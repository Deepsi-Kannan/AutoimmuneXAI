"""Verify the Vercel /api mount against the original complete JSON baselines."""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from api.index import app

saved = json.loads(
    (ROOT / "AutoimmuneXAI/deployment/phase2-baseline.json").read_text(encoding="utf-8")
)
digest = hashlib.sha256(
    (ROOT / "AutoimmuneXAI/models/autoimmune_xgb_model.joblib").read_bytes()
).hexdigest()
assert digest == saved["model_sha256"], "Model bytes changed"
checked = set()
with TestClient(app) as client:
    for record in saved["requests"]:
        path = record["path"]
        if path in checked:
            continue
        checked.add(path)
        payload = dict(saved["baseline_payload"])
        if path == "/what-if":
            payload.update(feature="ESR", value=30)
        url = "/api" + path
        response = client.get(url) if path == "/health" else client.post(url, json=payload)
        assert response.status_code == record["status"], (url, response.text)
        assert response.json() == record["body"], f"Baseline changed: {url}"
        print(f"PASS exact baseline: {url}")
    assert client.get("/api/docs").status_code == 200
print("PASS original model checksum and API documentation")
