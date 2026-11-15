# AutoimmuneXAI frontend

React 19 and Vite. No UI framework or styling dependencies are required.

## Run locally

From the project root, start the existing API:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

The local environment uses `requirements.txt`. For a fresh setup, create a Python virtual environment and install those requirements. API tests additionally require `pytest` and `httpx`.

In another terminal:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173. The API defaults to http://127.0.0.1:8000. An optional `VITE_API_BASE_URL` environment variable can override this address; the backend must allow the frontend origin.

## Interface

- The prediction workspace contains all 14 original model inputs. Prefilled values are explicitly identified as an example.
- Age and Gender are required. Blank optional measurements and unavailable serology values are sent as JSON null.
- Prediction, SHAP explanation, and what-if analysis call the existing `/predict`, `/explain`, and `/what-if` endpoints.
- Explanations and scenarios use an immutable snapshot of the submitted inputs. Editing the form displays a stale-result notice until the next prediction.
- What-if feature names use the model's hyphenated names, while baseline input keys retain the API's underscore mapping.
- Model evaluation retains the existing recorded metrics, confusion matrices, and original scientific chart assets; these are not live metrics.
- Backend preprocessing, trained model artifacts, feature order, and inference logic are unchanged.

## Checks

```powershell
npm run build
npm run lint
```

From the project root:

```powershell
.\.venv\Scripts\python.exe -m pytest tests -q
```
