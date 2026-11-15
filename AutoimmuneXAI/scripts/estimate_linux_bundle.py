"""Estimate Linux wheel contents from PyPI ZIP directories, without installing.

Reads public metadata and HTTP byte ranges only. This is not a Linux build or
dependency-resolution check. Small transitive dependencies are not included.
"""
import json
from pathlib import Path
import struct
import urllib.request

PACKAGES = {
    "numpy": "1.26.3", "pandas": "2.2.3", "scipy": "1.16.3",
    "scikit-learn": "1.9.1", "shap": "0.47.2", "numba": "0.67.0",
    "llvmlite": "0.49.0", "xgboost-cpu": "2.1.4",
}


def byte_range(url, start, end):
    req = urllib.request.Request(url, headers={"Range": f"bytes={start}-{end}"})
    with urllib.request.urlopen(req, timeout=30) as response:
        if response.status != 206:
            raise RuntimeError("Server does not support byte ranges; refusing full download")
        return response.read()


def estimate():
    result = {"target": "Linux x86_64 CPython 3.12", "packages": [], "errors": []}
    for name, version in PACKAGES.items():
        try:
            with urllib.request.urlopen(f"https://pypi.org/pypi/{name}/{version}/json", timeout=30) as response:
                metadata = json.load(response)
            wheels = [item for item in metadata["urls"]
                      if "manylinux" in item["filename"] and "x86_64" in item["filename"]
                      and ("cp312-cp312" in item["filename"] or "py3-none" in item["filename"])]
            wheel = sorted(wheels, key=lambda item: item["filename"])[0]
            tail = byte_range(wheel["url"], max(0, wheel["size"] - 65557), wheel["size"] - 1)
            end = tail.rfind(b"PK\x05\x06")
            if end < 0:
                raise ValueError("Missing ZIP end record")
            fields = struct.unpack_from("<4s4H2LH", tail, end)
            length, offset = fields[5:7]
            directory = byte_range(wheel["url"], offset, offset + length - 1)
            position, total, files = 0, 0, 0
            while position < len(directory):
                if directory[position:position + 4] != b"PK\x01\x02":
                    raise ValueError("Invalid ZIP directory")
                total += struct.unpack_from("<L", directory, position + 24)[0]
                name_len, extra_len, comment_len = struct.unpack_from("<3H", directory, position + 28)
                position += 46 + name_len + extra_len + comment_len
                files += 1
            result["packages"].append({"name": name, "version": version,
                                       "wheel": wheel["filename"], "compressed_bytes": wheel["size"],
                                       "uncompressed_bytes": total, "files": files})
        except Exception as error:
            result["errors"].append({"name": name, "error": repr(error)})
    result["subtotal_uncompressed_bytes"] = sum(p["uncompressed_bytes"] for p in result["packages"])
    output = Path(__file__).resolve().parents[1] / ".deployment-checks/linux-bundle-estimate.json"
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    estimate()
