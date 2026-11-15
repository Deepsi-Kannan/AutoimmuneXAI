from pathlib import Path
import os

import joblib
import pandas as pd
import math 

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.xai import explain_prediction


# =========================================================
# 1. APPLICATION SETUP
# =========================================================

app = FastAPI(
    title="AutoimmuneXAI API",
    description=(
        "Academic and research API for explainable "
        "multiclass classification."
    ),
    version="1.0.0"
)
# =========================================================
# CORS
# =========================================================

LOCAL_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173"
]
# Comma-separated exact HTTPS origins, without paths or trailing slashes.
# Keep local development available alongside configured production origins.
PRODUCTION_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.environ.get("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(LOCAL_ORIGINS + PRODUCTION_ORIGINS)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# 2. MODEL PATH
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "autoimmune_xgb_model.joblib"
)


# =========================================================
# 3. LOAD SAVED MODEL
# =========================================================

try:
    model_bundle = joblib.load(MODEL_PATH)

    pipeline = model_bundle["pipeline"]
    label_encoder = model_bundle["label_encoder"]
    required_features = model_bundle["feature_names"]

except Exception as error:
    raise RuntimeError(
        f"Could not load model from {MODEL_PATH}: {error}"
    )


# =========================================================
# 4. DATA-QUALITY REFERENCE
# =========================================================

NUMERIC_RANGES = {
    "Age": (20.0, 80.0),
    "ESR": (0.0, 49.0),
    "CRP": (0.1, 30.0),
    "RF": (0.0, 40.0),
    "Anti-CCP": (0.0, 40.0),
    "C3": (50.0, 205.0),
    "C4": (5.0, 74.0),
}

CATEGORICAL_VALUES = {
    "Gender": ["Female", "Male"],
    "HLA-B27": ["Negative", "Positive"],
    "ANA": ["Negative", "Positive"],
    "Anti-Ro": ["Negative", "Positive"],
    "Anti-La": ["Negative", "Positive"],
    "Anti-dsDNA": ["Negative", "Positive"],
    "Anti-Sm": ["Negative", "Positive"],
}


# =========================================================
# 5. INPUT SCHEMA
# =========================================================

class PredictionInput(BaseModel):
    Age: float
    Gender: str

    ESR: float | None = None
    CRP: float | None = None
    RF: float | None = None
    Anti_CCP: float | None = None

    HLA_B27: str | None = None
    ANA: str | None = None
    Anti_Ro: str | None = None
    Anti_La: str | None = None
    Anti_dsDNA: str | None = None
    Anti_Sm: str | None = None

    C3: float | None = None
    C4: float | None = None

    C3: float | None = None
    C4: float | None = None
    # =========================================================
# WHAT-IF REQUEST
# =========================================================

class WhatIfRequest(PredictionInput):
    feature: str
    value: str | float | int
# =========================================================
# WHAT-IF ANALYSIS ENDPOINT
# =========================================================

@app.post("/what-if")
def what_if(data: WhatIfRequest):

    try:

        # -------------------------------------------------
        # Allowed features
        # -------------------------------------------------

        if data.feature not in required_features:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Invalid feature for What-if analysis.",
                    "allowed_features": required_features
                }
            )

        # -------------------------------------------------
        # Build baseline input
        # -------------------------------------------------

        baseline_input = {
            "Age": data.Age,
            "Gender": data.Gender,
            "ESR": data.ESR,
            "CRP": data.CRP,
            "RF": data.RF,
            "Anti-CCP": data.Anti_CCP,
            "HLA-B27": data.HLA_B27,
            "ANA": data.ANA,
            "Anti-Ro": data.Anti_Ro,
            "Anti-La": data.Anti_La,
            "Anti-dsDNA": data.Anti_dsDNA,
            "Anti-Sm": data.Anti_Sm,
            "C3": data.C3,
            "C4": data.C4
        }

        # -------------------------------------------------
        # Validate baseline input
        # -------------------------------------------------

        baseline_issues, baseline_warnings = (
            validate_prediction_input(baseline_input)
        )

        if baseline_issues:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Baseline input validation failed.",
                    "issues": baseline_issues,
                    "warnings": baseline_warnings
                }
            )

        # -------------------------------------------------
        # Create What-if scenario
        # -------------------------------------------------

        scenario_input = baseline_input.copy()

        # Numerical features
        numeric_features = {
            "Age",
            "ESR",
            "CRP",
            "RF",
            "Anti-CCP",
            "C3",
            "C4"
        }

        if data.feature in numeric_features:

            try:
                scenario_input[data.feature] = float(data.value)

            except (TypeError, ValueError):

                raise HTTPException(
                    status_code=422,
                    detail={
                        "message": (
                            f"{data.feature} requires a numeric value."
                        )
                    }
                )

        else:

            scenario_input[data.feature] = str(data.value)

        # -------------------------------------------------
        # Validate What-if scenario
        # -------------------------------------------------

        scenario_issues, scenario_warnings = (
            validate_prediction_input(scenario_input)
        )

        if scenario_issues:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "What-if input validation failed.",
                    "issues": scenario_issues,
                    "warnings": scenario_warnings
                }
            )

        # -------------------------------------------------
        # DataFrames
        # -------------------------------------------------

        baseline_df = pd.DataFrame(
            [baseline_input],
            columns=required_features
        )

        scenario_df = pd.DataFrame(
            [scenario_input],
            columns=required_features
        )

        # -------------------------------------------------
        # Baseline prediction
        # -------------------------------------------------

        baseline_index = pipeline.predict(
            baseline_df
        )[0]

        baseline_class = label_encoder.inverse_transform(
            [baseline_index]
        )[0]

        baseline_probabilities = pipeline.predict_proba(
            baseline_df
        )[0]

        # -------------------------------------------------
        # What-if prediction
        # -------------------------------------------------

        scenario_index = pipeline.predict(
            scenario_df
        )[0]

        scenario_class = label_encoder.inverse_transform(
            [scenario_index]
        )[0]

        scenario_probabilities = pipeline.predict_proba(
            scenario_df
        )[0]

        # -------------------------------------------------
        # Probability dictionaries
        # -------------------------------------------------

        baseline_output = {}

        scenario_output = {}

        delta_output = {}

        for class_name, baseline_probability, scenario_probability in zip(
            label_encoder.classes_,
            baseline_probabilities,
            scenario_probabilities
        ):

            baseline_output[class_name] = float(
                baseline_probability
            )

            scenario_output[class_name] = float(
                scenario_probability
            )

            delta_output[class_name] = float(
                scenario_probability - baseline_probability
            )

        # -------------------------------------------------
        # Response
        # -------------------------------------------------

        return {
            "feature": data.feature,

            "original_value": baseline_input.get(
                data.feature
            ),

            "new_value": scenario_input.get(
                data.feature
            ),

            "baseline": {
                "prediction": baseline_class,
                "probabilities": baseline_output
            },

            "what_if": {
                "prediction": scenario_class,
                "probabilities": scenario_output
            },

            "delta": delta_output,

            "data_quality": {
                "status": (
                    "passed_with_warnings"
                    if scenario_warnings
                    else "passed"
                ),
                "warnings": scenario_warnings
            },

            "disclaimer": (
                "What-if analysis shows how changing an input "
                "changes the machine-learning model output. "
                "It describes model sensitivity and does not "
                "represent a medical recommendation, causal "
                "relationship, or clinical prediction."
            )
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
# =========================================================
# 6. DATA-QUALITY VALIDATION
# =========================================================

def validate_prediction_input(input_data):
    issues = []
    warnings = []

    # -----------------------------------------------------
    # Numerical checks
    # -----------------------------------------------------

    for feature, (minimum, maximum) in NUMERIC_RANGES.items():

        value = input_data.get(feature)

        if value is None:
            continue

        if value < minimum or value > maximum:
            warnings.append(
                f"{feature}: value {value} is outside "
                f"the observed training range "
                f"[{minimum}, {maximum}]."
            )

    # -----------------------------------------------------
    # Categorical checks
    # -----------------------------------------------------

    for feature, allowed_values in CATEGORICAL_VALUES.items():

        value = input_data.get(feature)

        if value is None:
            continue

        if value not in allowed_values:
            issues.append(
                f"{feature}: invalid value '{value}'. "
                f"Allowed values: {allowed_values}"
            )

    return issues, warnings


# =========================================================
# 7. ROOT ENDPOINT
# =========================================================

@app.get("/")
def root():
    return {
        "status": "running",
        "application": "AutoimmuneXAI",
        "purpose": "Academic / Research",
        "model_loaded": True
    }


# =========================================================
# 8. HEALTH ENDPOINT
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": True
    }
# =========================================================
# XAI EXPLANATION ENDPOINT
# =========================================================

@app.post("/explain")
def explain(data: PredictionInput):

    try:

        # -------------------------------------------------
        # Build input dictionary
        # -------------------------------------------------

        input_data = {
            "Age": data.Age,
            "Gender": data.Gender,
            "ESR": data.ESR,
            "CRP": data.CRP,
            "RF": data.RF,
            "Anti-CCP": data.Anti_CCP,
            "HLA-B27": data.HLA_B27,
            "ANA": data.ANA,
            "Anti-Ro": data.Anti_Ro,
            "Anti-La": data.Anti_La,
            "Anti-dsDNA": data.Anti_dsDNA,
            "Anti-Sm": data.Anti_Sm,
            "C3": data.C3,
            "C4": data.C4
        }

        # -------------------------------------------------
        # Data-quality validation
        # -------------------------------------------------

        validation_issues, validation_warnings = (
            validate_prediction_input(input_data)
        )

        if validation_issues:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Input validation failed.",
                    "issues": validation_issues,
                    "warnings": validation_warnings
                }
            )

        # -------------------------------------------------
        # Preserve exact feature order
        # -------------------------------------------------

        input_df = pd.DataFrame(
            [input_data],
            columns=required_features
        )

        # -------------------------------------------------
        # Prediction
        # -------------------------------------------------

        predicted_index = pipeline.predict(
            input_df
        )[0]

        predicted_class = label_encoder.inverse_transform(
            [predicted_index]
        )[0]

        # -------------------------------------------------
        # Probabilities
        # -------------------------------------------------

        probabilities = pipeline.predict_proba(
            input_df
        )[0]

        probability_output = {}

        for class_name, probability in zip(
            label_encoder.classes_,
            probabilities
        ):
            probability_output[class_name] = float(
                probability
            )

        # -------------------------------------------------
        # SHAP explanation
        # -------------------------------------------------

        explanation = explain_prediction(
            pipeline=pipeline,
            label_encoder=label_encoder,
            input_df=input_df,
            top_n=5
        )

        # -------------------------------------------------
        # Response
        # -------------------------------------------------

        return {
            "prediction": predicted_class,

            "probabilities": probability_output,

           "probability_sum": float(
    probabilities.sum()
),
"data_quality": {

            "data_quality": {
                "status": (
                    "passed_with_warnings"
                    if validation_warnings
                    else "passed"
                ),
                "warnings": validation_warnings
            },

            "explanation": explanation,

            "disclaimer": (
                "This is an academic research prediction "
                "generated by a machine-learning model. "
                "SHAP values describe model behavior and "
                "do not establish causality or provide a "
                "clinical explanation. This system is not "
                "a medical diagnostic tool."
            )
        }
        }
    

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )



# =========================================================
# 9. PREDICTION ENDPOINT
# =========================================================

@app.post("/predict")
def predict(data: PredictionInput):

    try:

        # -------------------------------------------------
        # Build input dictionary
        # -------------------------------------------------

        input_data = {
            "Age": data.Age,
            "Gender": data.Gender,
            "ESR": data.ESR,
            "CRP": data.CRP,
            "RF": data.RF,
            "Anti-CCP": data.Anti_CCP,
            "HLA-B27": data.HLA_B27,
            "ANA": data.ANA,
            "Anti-Ro": data.Anti_Ro,
            "Anti-La": data.Anti_La,
            "Anti-dsDNA": data.Anti_dsDNA,
            "Anti-Sm": data.Anti_Sm,
            "C3": data.C3,
            "C4": data.C4
        }

        # -------------------------------------------------
        # Validate input
        # -------------------------------------------------

        validation_issues, validation_warnings = (
            validate_prediction_input(input_data)
        )

        if validation_issues:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Input validation failed.",
                    "issues": validation_issues,
                    "warnings": validation_warnings
                }
            )

        # -------------------------------------------------
        # Create DataFrame in exact training feature order
        # -------------------------------------------------

        input_df = pd.DataFrame(
            [input_data],
            columns=required_features
        )

        # -------------------------------------------------
        # Prediction
        # -------------------------------------------------

        predicted_index = pipeline.predict(
            input_df
        )[0]

        predicted_class = label_encoder.inverse_transform(
            [predicted_index]
        )[0]

        # -------------------------------------------------
        # Probabilities
        # -------------------------------------------------

        probabilities = pipeline.predict_proba(
            input_df
        )[0]

        probability_output = {}

        for class_name, probability in zip(
            label_encoder.classes_,
            probabilities
        ):
            probability_output[class_name] = float(
                probability
            )
        # ============================================================
# Uncertainty metrics
# ============================================================

        # ============================================================
        # Uncertainty metrics
        # ============================================================

        sorted_probabilities = sorted(
            probabilities,
            reverse=True
        )

        top_class_probability = float(
            sorted_probabilities[0]
        )

        second_class_probability = float(
            sorted_probabilities[1]
        )

        top_two_margin = (
            top_class_probability
            - second_class_probability
        )

        # Normalized entropy:
        # 0 = concentrated on one class
        # 1 = maximally distributed across all classes
        entropy = 0.0

        for probability in probabilities:
            probability = float(probability)

            if probability > 0:
                entropy -= (
                    probability
                    * math.log(probability)
                )

        normalized_entropy = (
            entropy / math.log(len(probabilities))
        )

        # Research/UI heuristic only.
        if (
            top_class_probability >= 0.80
            and top_two_margin >= 0.50
            and normalized_entropy <= 0.35
        ):
            confidence_level = "High"

        elif (
            top_class_probability >= 0.60
            and top_two_margin >= 0.20
            and normalized_entropy <= 0.60
        ):
            confidence_level = "Moderate"

        else:
            confidence_level = "Low"

        return {
            "prediction": predicted_class,
            "probabilities": probability_output,
            "probability_sum": float(
    probabilities.sum()
),
"uncertainty": {
    "top_class_probability": top_class_probability,
    "top_two_margin": top_two_margin,
    "entropy": normalized_entropy,
    "confidence_level": confidence_level
},
"data_quality": {
                "status": "passed",
                "warnings": validation_warnings
            },
            "disclaimer": (
                "This is an academic research prediction "
                "generated by a machine-learning model. "
                "It is not a medical diagnosis and should "
                "not be used for medical decision-making."
            )
        }
    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
