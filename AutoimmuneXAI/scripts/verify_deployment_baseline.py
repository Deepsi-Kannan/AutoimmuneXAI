"""Check model hash, exact baseline outputs and configured CORS locally."""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".deployment-checks/tools"))
sys.path.insert(0, str(ROOT))
from fastapi.testclient import TestClient
from backend.main import app


def verify():
    saved = json.loads((ROOT / "deployment/phase2-baseline.json").read_text(encoding="utf-8"))
    digest = hashlib.sha256((ROOT / "models/autoimmune_xgb_model.joblib").read_bytes()).hexdigest()
    assert digest == saved["model_sha256"], "Model bytes changed"
    with TestClient(app) as client:
        checked = set()
        for record in saved["requests"]:
            path = record["path"]
            if path in checked:
                continue
            checked.add(path)
            payload = dict(saved["baseline_payload"])
            if path == "/what-if":
                payload.update(feature="ESR", value=30)
            response = client.get(path) if path == "/health" else client.post(path, json=payload)
            assert response.status_code == record["status"], path
            assert response.json() == record["body"], f"Baseline response changed: {path}"
            print(f"PASS exact baseline: {path}")
        # Set ALLOWED_ORIGINS=https://deployment-check.example before starting this script.
        for origin, allowed in [("http://localhost:5173", True),
                                ("https://deployment-check.example", True),
                                ("https://unlisted.example", False)]:
            response = client.options("/predict", headers={
                "Origin": origin, "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type"})
            assert response.status_code == (200 if allowed else 400), (origin, response.text)
            assert response.headers.get("access-control-allow-origin") == (origin if allowed else None)
            print(f"PASS CORS: {origin}, allowed={allowed}")
    print(f"PASS unchanged model SHA-256: {digest}")


if __name__ == "__main__":
    verify()
