"""Vercel ASGI entry point; preserves the original backend under /api."""
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
# Numba must be able to cache in an ephemeral writable directory on Vercel.
os.environ.setdefault(
    "NUMBA_CACHE_DIR",
    str(Path(tempfile.gettempdir()) / "autoimmunexai-numba"),
)
sys.path.insert(0, str(ROOT / "AutoimmuneXAI"))

from fastapi import FastAPI
from backend.main import app as backend_app

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", backend_app)
