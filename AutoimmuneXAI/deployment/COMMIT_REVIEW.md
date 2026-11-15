# Phase 3 commit review — awaiting approval

No commit, push, repository creation, remote update or deployment has been made.
No Phase 2 tests were repeated: Phase 3 changes only Git tracking, ignore rules
and documentation. Model, backend inference and frontend content are unchanged
from the Phase 2 working tree.

## Proposed single commit

Title: `Prepare AutoimmuneXAI UI and free-hosting deployment configuration`

Body:

```text
Preserve the current React workspace, evaluation UI and required assets.
Configure production CORS alongside existing local development origins.
Add Docker/Render Free configuration, dependency pins and baseline records.
Exclude unused review datasets, Python caches and editor settings from tracking.
Keep the trained XGBoost pipeline, SHAP and what-if behavior unchanged.

Validation from Phase 2: frontend lint/build passed; eight API tests passed in
existing and clean Windows environments; exact API baselines and CORS passed.
Linux Docker execution and Render's 512 MB memory limit remain unverified.
```

The large UI diff records pre-existing local UI work against the old Git commit.
Phase 3 has not redesigned or rewritten that UI.

## Integrity and exclusion checks

- Every staged frontend file matches its current working file after Git's normal
  line-ending filters. Required JSX imports and hero/ROC/PR assets are present.
- The model and `backend/xai.py` already exist in Git and remain in the snapshot.
  They need no new diff to be included in the next commit.
- Indexed model SHA-256:
  `9b7f843182813c3715fe0d6ce4155d3808adafdda22aa474dc4694ff6d227c81`.
- `backend/xai.py` is identical to HEAD. The backend source diff is production
  CORS configuration plus a final newline; prediction logic is unchanged.
- Runtime dependencies, the frontend package lockfile and API tests remain
  tracked. Docker whitelists backend source, the model and runtime manifests.
- No recognizable private keys, GitHub tokens, AWS access keys, OpenAI keys or
  long quoted credential assignments were found by a pattern scan of indexed
  text files. This is a targeted scan, not a guarantee covering arbitrary secrets
  or every historical blob. The only indexed environment file is `.env.example`,
  containing a public localhost API address.
- Virtual environments, node_modules, dist, local testing tools, caches, logs,
  editor settings, private environment files and common key files are ignored.
- The two datasets and all seven development-artifact files removed from tracking
  remain on disk. A `D` in the proposed diff means removal from Git's next
  snapshot, not deletion of the local file.
- The datasets exist in earlier commits. A later push of this branch would also
  send that history. Removing them from history or creating a history-free export
  requires separate review and authorization. Do not publish that history publicly
  without deciding whether the review data is appropriate to share.

## GitHub connection

- Current branch: `main`.
- Remote name: `origin`.
- Remote URL: `YOUR_GITHUB_REPO_URL` (placeholder, not a usable GitHub remote).
- Local Git author identity is configured; it was not changed.
- The actual personal repository URL and its contents are not yet known.

Later, after receiving the real URL and authorization, replace the placeholder:

```powershell
git remote set-url origin https://github.com/OWNER/REPOSITORY.git
git remote -v
```

Do not use `git remote add origin`: that name already exists. Authenticate through
GitHub's normal credential flow; never put a token in the remote URL or a file.
Before any separately approved push, inspect the remote branch/history. If the
remote already has commits, compare them and preserve both histories as appropriate;
do not force-push. If a new repository is needed, ask separately before creating
one. A private personal repository is the prudent default while dataset history
and distribution permissions remain unresolved.

## Free hosting path, after separate authorization

1. Approve the local commit; committing alone publishes nothing.
2. Supply the personal GitHub repository URL and approve connecting it.
3. Decide how to handle historical datasets; inspect any existing remote history.
4. Approve pushing the prepared branch separately.
5. Validate the Docker backend on Linux under 512 MB before accepting Render Free.
6. Use Vercel Hobby for `AutoimmuneXAI/frontend`, install `npm ci`, build
   `npm run build`, output `dist`; no `vercel.json` is required for this frontend.
7. Select Render **Free** explicitly for the backend; the prepared Blueprint
   declares `plan: free` and disables automatic deployments.
8. Set `VITE_API_BASE_URL` to the backend HTTPS origin and `ALLOWED_ORIGINS` to
   the frontend HTTPS origin. These are configuration values, not secrets.
9. Deployment is a separate approval. No paid fallback will be selected silently.

GitHub guidance: https://docs.github.com/en/get-started/git-basics/managing-remote-repositories
Render Free limits: https://render.com/docs/free

## Exact proposed file changes

Paths below are relative to `D:\AutoimmuneXAI`. A = add, M = modify,
D = remove from tracking only. Unchanged tracked files, including the model,
SHAP implementation and existing chart images, are also retained in the commit.

| Status | Path |
| --- | --- |
| A | `.gitignore` |
| A | `AutoimmuneXAI/.dockerignore` |
| A | `AutoimmuneXAI/.gitignore` |
| D | `AutoimmuneXAI/.vscode/settings.json` |
| A | `AutoimmuneXAI/Dockerfile` |
| D | `AutoimmuneXAI/backend/__pycache__/main.cpython-311.pyc` |
| D | `AutoimmuneXAI/backend/__pycache__/main.cpython-312.pyc` |
| D | `AutoimmuneXAI/backend/__pycache__/main.cpython-314.pyc` |
| D | `AutoimmuneXAI/backend/__pycache__/xai.cpython-311.pyc` |
| D | `AutoimmuneXAI/backend/__pycache__/xai.cpython-312.pyc` |
| M | `AutoimmuneXAI/backend/main.py` |
| D | `AutoimmuneXAI/calculator.csv` |
| A | `AutoimmuneXAI/deployment/COMMIT_REVIEW.md` |
| A | `AutoimmuneXAI/deployment/README.md` |
| A | `AutoimmuneXAI/deployment/linux-bundle-estimate.json` |
| A | `AutoimmuneXAI/deployment/phase2-baseline.json` |
| A | `AutoimmuneXAI/frontend/.env.example` |
| M | `AutoimmuneXAI/frontend/README.md` |
| M | `AutoimmuneXAI/frontend/index.html` |
| A | `AutoimmuneXAI/frontend/public/biotech-hero.png` |
| M | `AutoimmuneXAI/frontend/public/favicon.svg` |
| M | `AutoimmuneXAI/frontend/src/App.css` |
| M | `AutoimmuneXAI/frontend/src/App.jsx` |
| A | `AutoimmuneXAI/frontend/src/Evaluation.jsx` |
| A | `AutoimmuneXAI/frontend/src/Visuals.jsx` |
| M | `AutoimmuneXAI/frontend/src/index.css` |
| A | `AutoimmuneXAI/requirements-dev.txt` |
| A | `AutoimmuneXAI/requirements-hosting.txt` |
| D | `AutoimmuneXAI/scraped_reviews.xlsx` |
| A | `AutoimmuneXAI/scripts/estimate_linux_bundle.py` |
| A | `AutoimmuneXAI/scripts/measure_backend.py` |
| A | `AutoimmuneXAI/scripts/verify_deployment_baseline.py` |
| D | `AutoimmuneXAI/tests/__pycache__/test_api.cpython-312-pytest-7.4.4.pyc` |
| A | `render.yaml` |
