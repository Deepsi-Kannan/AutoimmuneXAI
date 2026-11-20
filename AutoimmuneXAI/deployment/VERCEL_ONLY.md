# Vercel-only deployment candidate — 2026-11-15

Render preparation is stopped. No Render service was created. This document
supersedes the Render-first recommendation in the earlier Phase 2 notes.

## Verdict

A complete, single-project Vercel Hobby deployment is technically plausible with
the optimized dependency set and is prepared locally. It is NOT yet a verified
cloud deployment. The final Vercel bundle, native Linux imports, cold starts,
and all live API endpoints must pass before calling the website fully working.
No frontend-only deployment is proposed.

No commit, push, project creation or deployment was performed for these changes.

## Architecture and Vercel project settings

Repository Root Directory: **the repository root (.)**, not AutoimmuneXAI/frontend
and not AutoimmuneXAI. Framework preset: Other (framework is null in vercel.json).
Use the personal Hobby plan, Fluid Compute, and a supported Node 22.x runtime
meeting the locked frontend requirement >=22.12. Python is pinned to 3.12.

- Install: npm ci --prefix AutoimmuneXAI/frontend
- Build: VITE_API_BASE_URL=/api npm run build --prefix AutoimmuneXAI/frontend
- Output: AutoimmuneXAI/frontend/dist
- Python entry: api/index.py, exporting the ASGI app
- Dependency manifest: repository-root requirements.txt (32 exact runtime pins)
- Maximum request duration: 300 seconds
- Memory: Hobby default 2 GB; no paid memory or large-function override

The build command sets a public API base of /api for production only. React
source remains unchanged; the existing local-development fallback still works.

Vercel serves the built UI, CSS, hero, icons and evaluation images from its CDN.
Requests to /api/* are routed to the Python entry. Its FastAPI parent mounts the
original backend at /api. These are the deployed public endpoints:

- GET /api/health
- POST /api/predict
- POST /api/explain
- POST /api/what-if
- GET /api/docs

The original backend's local paths remain /health, /predict, /explain, /what-if.
The adapter changes routing only. It imports the original backend and fitted
pipeline, without copying/reimplementing inference logic. NUMBA_CACHE_DIR is set
to an ephemeral writable temporary directory before SHAP imports.

Same-origin frontend/API requests need no production CORS origin or external
backend URL. Existing local CORS support is unchanged. No API key is required.

## Dependency changes

The original AutoimmuneXAI/requirements.txt and requirements-hosting.txt are
unchanged. The new repository-root manifest is Vercel-specific.

- xgboost-cpu==2.1.4 replaces standard xgboost==2.1.4 in this manifest only.
  The Python import remains xgboost; trained artifact version remains 2.1.4.
  This avoids unneeded GPU/NCCL binaries for the application's CPU inference.
- numba==0.61.2 and llvmlite==0.44.0 replace the much larger newer pair in the
  Vercel manifest. Official Numba support includes Python 3.12 and NumPy 1.26.
- SHAP 0.47.2, scikit-learn 1.9.1, NumPy 1.26.3, pandas 2.2.3,
  SciPy 1.16.3 and joblib 1.4.2 remain fixed.
- Web-framework versions match the tested environment. Remaining transitive
  runtime dependencies are pinned as well.
- No retraining, model conversion, quantization, replacement, approximation,
  input transformation, or explanation algorithm change was made.

The model SHA-256 remains:
9b7f843182813c3715fe0d6ce4155d3808adafdda22aa474dc4694ff6d227c81

## Measured Linux package footprint

A complete Linux x86_64/Python 3.12 dependency set was resolved using binary wheels
and extracted into an isolated directory on Windows. This measures actual Linux
package contents; it does not execute Linux native libraries.

- 32 runtime distributions, 7,951 extracted files
- Dependencies: 439,915,061 bytes (439.92 decimal MB)
- Original model: 2,874,954 bytes
- Dependencies + model: 442,790,015 bytes (442.79 decimal MB)
- Application code, Vercel runtime additions and selected bytecode are additional
- Estimated bytecode for every dependency source: 107,749,770 additional bytes
- Dependencies + model + ALL estimated bytecode: 550,539,785 bytes

Do not report 442.79 MB as the final deployed bundle. Vercel documents optional
bytecode inclusion where space allows, and its builder ranks/fills bytecode within
capacity. Shipping every possible .pyc would exceed the documented 500 MB Python
limit. Final builder output must be measured and must fit; no paid large-function
beta or external model host is assumed. Vercel's own dependency packing can also
affect cold-start installation and temporary storage. That behavior remains a
cloud validation gate.

The whole Linux set installs from compatible wheels, including scikit-learn
1.9.1. No Docker or WSL Linux runtime is available on this machine, so Linux
execution, shared-library loading and a real Vercel build are still unverified.

## Checks completed

Isolated Windows CPython 3.12.13, CPU-only dependency stack:

- uv pip check: all 41 installed runtime + test distributions compatible
- Existing API tests: 8 passed (Starlette's existing httpx deprecation warning)
- Saved Phase 2 complete JSON responses: exact equality for health, prediction,
  SHAP explanation and what-if
- 20 additional exact response comparisons: six synthetic profiles through all
  three POST endpoints plus two invalid-input cases, compared with the original
  Python 3.11 stack
- Original missing-category encoder warnings occurred in both stacks and were
  preserved, not suppressed or "fixed" by changing the model
- /api wrapper: all four saved endpoint responses match exactly; /api/docs works
- Frontend lint and production build: passed; compiled API base is /api and the
  localhost API fallback is absent from the production JS bundle
- Vercel JSON: validated against the official current JSON schema
- Function globs: original backend/model included; frontend, test tools and tests
  excluded from the Python function
- Git-normalized protected file checks: model, backend, React UI, assets, package
  lockfile and original application requirements are unchanged

These are finite regression checks, not a mathematical proof across every
possible input. The trained model and preprocessing bytes are unchanged.

## Local resource measurements

Windows 64-bit, Python 3.12.13, one Uvicorn worker, sequential requests, roughly
10 ms process-tree sampling. This is not a Linux/Vercel memory measurement.

- Launch to healthy response: 9.56 s
- Startup RSS: 207.93 MiB
- Overall resident-memory peak: 252.59 MiB
- Windows private committed peak: 911.39 MiB (different from resident RAM)
- Prediction HTTP requests: 112.8 / 21.6 / 29.3 ms
- Explanation (prediction + SHAP + HTTP): 391.5 / 401.5 / 340.5 ms
- What-if: 53.2 / 40.8 / 41.1 ms

Memory observations are compatible with investigating Hobby's 2 GB allowance,
but Vercel runtime overhead, concurrency, Linux memory and cloud cold starts
remain to be tested. The unchanged browser timeout is 120 seconds, below the
function's 300-second maximum.

## Files and exclusions

New files only:

- .python-version
- .vercelignore
- requirements.txt
- vercel.json
- api/index.py
- scripts/verify_vercel.py
- AutoimmuneXAI/deployment/VERCEL_ONLY.md
- AutoimmuneXAI/deployment/vercel-linux-footprint.json
- AutoimmuneXAI/deployment/vercel-resource-check.json

Existing Render/Docker files are retained on disk/in Git but excluded from this
Vercel upload. Legacy child Python requirements are excluded from the upload;
the repository-root requirements.txt is the authoritative Python manifest.
The static frontend is uploaded for building, but excluded from the Python
function. Test environments, dependency experiments, caches, datasets, logs,
tests, scripts and baseline reports are not runtime assets. The model is inside
the private function bundle, not the public frontend output.

All temporary runtimes, package downloads and validation tools are under ignored
.deployment-checks directories. The original D:\AutoimmuneXAI project remains
unchanged. No history was rewritten.

## Limitations and advisories

- Hobby is limited to personal/noncommercial use and its included quotas.
  Current docs list 4 active CPU-hours and 360 GB-hours of provisioned memory.
  Usage limits can pause availability; free does not mean unlimited.
- Function filesystem is ephemeral/read-only except temporary storage. The app
  needs no database or persistent prediction storage, and reads its bundled model.
- Two high-severity npm findings remain in existing development/build dependencies:
  Vite 8.3.1 and source-map-js. The audit report is in the ignored testing folder.
  source-map-js 1.2.1 (via Vite/PostCSS) has a crafted-source-map denial-of-service
  vulnerability; 1.2.2 patches it. Vite 8.3.1 has dev-server/editor-launch issues.
  Production serves static React assets and the Python API, not those tools.
  Direct production runtime exposure is therefore limited, but developer/build
  environments remain affected. Recommend a separate patch update before production
  use. No npm audit fix or lockfile update was performed.
  Sources: https://github.com/advisories/GHSA-68fv-2mgg-jv7q and
  https://github.com/advisories/GHSA-587h-7wmj-h5pm
- If Linux imports, bundle packing, memory, runtime or baseline comparisons fail,
  report the exact failure. Do not remove SHAP/what-if or silently switch hosts.

## Next steps requiring approval

1. Review the staged deployment files; no commit has been created.
2. Approve the local commit, then approve its push separately.
3. Approve creating/configuring a personal Vercel Hobby project with Root Directory
   set to the repository root, using the checked-in configuration.
4. Inspect actual build output, Python bundle size, Linux imports and native libs.
5. Verify deployed UI and all four /api endpoints, exact golden responses, the
   synthetic corpus, input-validation behavior and API documentation.
6. Test a genuinely cold instance and concurrent requests. Review logs/memory.
7. Only after those pass describe the complete Vercel-only site as working.

To repeat the wrapper checks, install runtime requirements plus the existing
AutoimmuneXAI/requirements-dev.txt in an isolated Python 3.12 environment, then
run: python -B scripts/verify_vercel.py

## Primary sources checked

- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/functions/runtimes/python
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/project-configuration/vercel-json
- https://pypi.org/project/xgboost-cpu/2.1.4/
- https://numba.readthedocs.io/en/0.61.2/user/installing.html
- https://raw.githubusercontent.com/vercel/vercel/main/packages/python/src/bytecode-packing.ts
