# Flora Deployment

This repo is prepared for deployment on Render with:

- `flora-api` as a FastAPI web service
- `flora-frontend` as a static Create React App site

## What was added

- `render.yaml` at the repo root so Render can create both services from one repo
- `backend/.python-version` to pin Python 3.11.11 for package compatibility
- environment-aware backend config for:
  - `DB_FILE`
  - `ALLOWED_ORIGINS`

## Render setup

1. Push this repo to GitHub.
2. In Render, choose `New` -> `Blueprint`.
3. Connect the GitHub repo and select this repository.
4. Render will detect `render.yaml` and propose two services.
5. Set these environment variables before the first deploy:

### `flora-api`

- `ALLOWED_ORIGINS`
  - use your frontend Render URL, for example:
  - `https://flora-frontend.onrender.com`

### `flora-frontend`

- `REACT_APP_API_URL`
  - use your backend Render URL, for example:
  - `https://flora-api.onrender.com`

6. Deploy the blueprint.
7. After the first deploy, confirm:
  - backend root responds at `/`
  - frontend loads
  - login / assessment calls succeed from the browser

## Important limitation

The current backend stores app data in a local JSON file.

That means:

- this works for demos and testing
- data can be lost on free-instance restarts or redeploys
- for production, the developer should move auth/history/check-ins/food logs to Postgres or another managed database

## Start commands used by Render

### Backend

`uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend

`npm install && npm run build`
