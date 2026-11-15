"""Local Windows resource check; requires psutil from requirements-dev.txt.

Measure the full process tree, including the actual virtual-environment child.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".deployment-checks"
OUT.mkdir(exist_ok=True)
sys.path.insert(0, str(OUT / "tools"))
import psutil


def run():
    samples, errors = [], []
    stop = threading.Event()
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
    started = time.perf_counter()
    with (OUT / "server.log").open("w", encoding="utf-8") as log:
        process = subprocess.Popen(
            [sys.executable, "-B", "-m", "uvicorn", "backend.main:app",
             "--host", "127.0.0.1", "--port", "18763"],
            cwd=ROOT, env=env, stdout=log, stderr=log)
        root_process = psutil.Process(process.pid)

        def sample():
            while not stop.is_set():
                try:
                    tree = [root_process] + root_process.children(recursive=True)
                    memory = [child.memory_info() for child in tree]
                    samples.append({"seconds": time.perf_counter() - started,
                                    "pids": [child.pid for child in tree],
                                    "rss_bytes": sum(item.rss for item in memory),
                                    "private_bytes": sum(getattr(item, "private", item.vms) for item in memory),
                                    "os_peak_rss_bytes": sum(getattr(item, "peak_wset", item.rss) for item in memory)})
                except psutil.NoSuchProcess:
                    pass
                stop.wait(0.01)

        monitor = threading.Thread(target=sample)
        monitor.start()
        report = {"platform": sys.platform, "python": sys.version,
                  "sample_interval_seconds": 0.01, "requests": [], "errors": errors}
        def request(path, payload=None):
            data = None if payload is None else json.dumps(payload).encode()
            req = urllib.request.Request("http://127.0.0.1:18763" + path,
                                         data=data, headers={"Content-Type": "application/json"})
            begin = time.perf_counter()
            try:
                with urllib.request.urlopen(req, timeout=120) as response:
                    status, body = response.status, json.load(response)
            except urllib.error.HTTPError as error:
                status, body = error.code, json.load(error)
            return {"path": path, "status": status,
                    "seconds": time.perf_counter() - begin, "body": body}

        try:
            while True:
                if process.poll() is not None:
                    raise RuntimeError("Backend exited; see server.log")
                try:
                    health = request("/health")
                    break
                except urllib.error.URLError:
                    if time.perf_counter() - started > 120:
                        raise TimeoutError("Backend startup exceeded 120 seconds")
                    time.sleep(0.05)
            report["startup_seconds"] = time.perf_counter() - started
            report["startup_memory"] = samples[-1]
            report["startup_peak_rss_bytes"] = max(s["rss_bytes"] for s in samples)
            report["requests"].append(health)
            payload = {"Age": 30, "Gender": "Male", "ESR": 1, "CRP": 0.8,
                       "RF": None, "Anti_CCP": None, "HLA_B27": "Negative",
                       "ANA": "Negative", "Anti_Ro": "Negative", "Anti_La": "Negative",
                       "Anti_dsDNA": "Negative", "Anti_Sm": "Negative", "C3": 130, "C4": 38}
            report["baseline_payload"] = payload
            for path in ("/predict", "/explain", "/what-if"):
                for repeat in range(3):
                    position = len(samples)
                    body = dict(payload)
                    if path == "/what-if":
                        body.update(feature="ESR", value=30)
                    result = request(path, body)
                    time.sleep(0.03)
                    observed = samples[max(0, position - 1):]
                    result.update(repeat=repeat, peak_rss_bytes=max(s["rss_bytes"] for s in observed),
                                  peak_private_bytes=max(s["private_bytes"] for s in observed))
                    report["requests"].append(result)
                    if result["status"] != 200:
                        errors.append(result)
            report["model_sha256"] = hashlib.sha256((ROOT / "models/autoimmune_xgb_model.joblib").read_bytes()).hexdigest()
        except Exception as error:
            errors.append(repr(error))
        finally:
            stop.set()
            monitor.join()
            for child in root_process.children(recursive=True):
                child.terminate()
            process.terminate()
            process.wait(timeout=15)
            report["peak_rss_bytes"] = max((s["os_peak_rss_bytes"] for s in samples), default=0)
            report["peak_private_bytes"] = max((s["private_bytes"] for s in samples), default=0)
            (OUT / "baseline-resources.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
            print(json.dumps({k: v for k, v in report.items() if k not in ("requests", "baseline_payload")}, indent=2))
            for result in report["requests"]:
                print(json.dumps({k: v for k, v in result.items() if k != "body"}))
    return bool(errors)


if __name__ == "__main__":
    raise SystemExit(run())
