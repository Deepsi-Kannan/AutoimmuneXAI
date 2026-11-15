from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


VALID_PAYLOAD = {
    "Age": 30,
    "Gender": "Male",
    "ESR": 1,
    "CRP": 0.8,
    "RF": None,
    "Anti_CCP": None,
    "HLA_B27": "Negative",
    "ANA": "Negative",
    "Anti_Ro": "Negative",
    "Anti_La": "Negative",
    "Anti_dsDNA": "Negative",
    "Anti_Sm": "Negative",
    "C3": 130,
    "C4": 38
}


# =========================================================
# HEALTH
# =========================================================

def test_health():
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"
    assert data["model_loaded"] is True


# =========================================================
# VALID PREDICTION
# =========================================================

def test_valid_prediction():

    response = client.post(
        "/predict",
        json=VALID_PAYLOAD
    )

    assert response.status_code == 200

    data = response.json()

    assert "prediction" in data
    assert "probabilities" in data
    assert "probability_sum" in data
    assert "data_quality" in data


# =========================================================
# PROBABILITY SUM
# =========================================================

def test_probability_sum():

    response = client.post(
        "/predict",
        json=VALID_PAYLOAD
    )

    assert response.status_code == 200

    data = response.json()

    assert abs(
        data["probability_sum"] - 1.0
    ) < 1e-6


# =========================================================
# MISSING VALUES
# =========================================================

def test_missing_numeric_values():

    payload = VALID_PAYLOAD.copy()

    payload["ESR"] = None
    payload["CRP"] = None
    payload["RF"] = None

    response = client.post(
        "/predict",
        json=payload
    )

    assert response.status_code == 200

    data = response.json()

    assert "prediction" in data
    assert "data_quality" in data


# =========================================================
# INVALID CATEGORY
# =========================================================

def test_invalid_category():

    payload = VALID_PAYLOAD.copy()

    payload["Gender"] = "Unknown"

    response = client.post(
        "/predict",
        json=payload
    )

    assert response.status_code == 422


# =========================================================
# SHAP EXPLANATION
# =========================================================

def test_explain():

    response = client.post(
        "/explain",
        json=VALID_PAYLOAD
    )

    assert response.status_code == 200

    data = response.json()

    assert "prediction" in data
    assert "probabilities" in data
    assert "data_quality" in data

    # Current API response structure
    assert "explanation" in data["data_quality"]

    explanation = data["data_quality"]["explanation"]

    assert "predicted_class" in explanation
    assert "positive_contributions" in explanation
    assert "negative_contributions" in explanation


# =========================================================
# WHAT-IF
# =========================================================

def test_what_if():

    payload = VALID_PAYLOAD.copy()

    payload["feature"] = "ESR"
    payload["value"] = 30

    response = client.post(
        "/what-if",
        json=payload
    )

    assert response.status_code == 200

    data = response.json()

    assert data["feature"] == "ESR"
    assert data["original_value"] == 1
    assert data["new_value"] == 30

    assert "baseline" in data
    assert "what_if" in data
    assert "delta" in data


# =========================================================
# INVALID WHAT-IF FEATURE
# =========================================================

def test_invalid_what_if_feature():

    payload = VALID_PAYLOAD.copy()

    payload["feature"] = "UnknownFeature"
    payload["value"] = 10

    response = client.post(
        "/what-if",
        json=payload
    )

    assert response.status_code == 422