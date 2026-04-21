# Deployment Guide

**Last updated:** April 20, 2026
**Owner:** Christian Molina
**Stack:** Firebase Hosting (frontend) + Google Cloud Run (backend)
**GCP Project:** `aitutorproject-197c3`

---

## Live URLs

| Service | URL |
|---|---|
| Frontend | https://aitutorproject-197c3.web.app |
| Backend | https://ai-tutor-backend-285361659733.us-central1.run.app |
| Firebase Console | https://console.firebase.google.com/project/aitutorproject-197c3 |
| GCP Console | https://console.cloud.google.com/home/dashboard?project=aitutorproject-197c3 |

---

## Golden rules

1. **Never deploy from a dirty working tree.** Run `git status` first. What you deploy should match a committed hash in the repo so rollbacks work.
2. **Deploy from `main`.** Feature branches are for testing locally, not for prod.
3. **Backend URL is hardcoded into the frontend bundle.** If the backend URL ever changes, the frontend must be rebuilt and redeployed.
4. **Secrets never leave Secret Manager.** If you need to view or rotate one, use `gcloud secrets`. Do not paste them into `.env`, chat, or tickets.
5. **Test in incognito before announcing a deploy.** Browser cache hides regressions.

---

## One-time setup for new contributors

If you're new to the deploy rotation, do these once:

### Install CLIs

```bash
# Google Cloud CLI (macOS)
brew install --cask gcloud-cli
# If the cask post-install fails (known Homebrew bug), add to ~/.zshrc:
#   export PATH="/opt/homebrew/share/google-cloud-sdk/bin:$PATH"
#   source "/opt/homebrew/share/google-cloud-sdk/path.zsh.inc"

# Firebase CLI
npm install -g firebase-tools
```

### Authenticate

```bash
# gcloud
gcloud auth login
gcloud config set project aitutorproject-197c3
gcloud auth application-default login   # for local backend dev

# Firebase
firebase login
firebase use aitutorproject-197c3
```

### Get IAM access

Ask Christian to run:

```bash
gcloud projects add-iam-policy-binding aitutorproject-197c3 \
  --member="user:<your-email>@gmail.com" \
  --role="roles/editor"
```

Editor is enough for deploy, logs, and secrets. Owner only needs to be granted for billing changes.

### Local backend env

For running the Flask backend locally, `backend/serviceAccountKey.json` must exist. **It is gitignored — never commit it.** Ask Christian for a copy via secure channel (1Password, encrypted DM, in-person).

---

## Redeploying the frontend

From repo root:

```bash
git checkout main
git pull

# Sanity check
git status   # must be clean

# Build
rm -rf dist
npm run build

# Deploy
firebase deploy --only hosting
```

Output ends with `Hosting URL: https://aitutorproject-197c3.web.app`. Deploy takes ~1–2 minutes.

**Test after deploy:**

1. Open incognito → https://aitutorproject-197c3.web.app
2. Sign in with Google
3. Check DevTools Network tab — API calls should go to `ai-tutor-backend-285361659733.us-central1.run.app` and return 200s

---

## Redeploying the backend

From repo root:

```bash
git checkout main
git pull
git status   # must be clean

gcloud run deploy ai-tutor-backend \
  --source backend \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --timeout 300
```

Deploy takes ~3–6 minutes (Cloud Build builds the Docker image remotely).

**Existing env vars and secrets are preserved across redeploys.** You only need to pass `--set-env-vars` or `--set-secrets` when adding or changing one.

**Test after deploy:**

```bash
curl -i https://ai-tutor-backend-285361659733.us-central1.run.app/api/health
# expected: HTTP/2 200, {"status":"ok"}
```

---

## Environment variables

### Frontend (`.env` or `.env.production.local`)

All prefixed `VITE_` because Vite only exposes those to the client bundle. **Baked into the JS at build time** — changes require a rebuild and redeploy.

| Var | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (in `.env.production.local` for prod) |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key (public, safe to expose) |
| `VITE_FIREBASE_AUTH_DOMAIN` | `aitutorproject-197c3.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `aitutorproject-197c3` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `aitutorproject-197c3.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Numeric ID |
| `VITE_FIREBASE_APP_ID` | Full app ID string |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics (optional) |

### Backend (Cloud Run env vars)

Set via `--set-env-vars` on deploy, or `gcloud run services update ... --update-env-vars`. **Runtime values, not baked in.** Changes take effect on next revision.

| Var | Current value |
|---|---|
| `DEV_MODE` | `false` |
| `CHUNKING_STRATEGY` | `api` |
| `FIREBASE_STORAGE_BUCKET` | `aitutorproject-197c3.appspot.com` |
| `QDRANT_URL` | `https://92db3cd0-0a97-4304-8b44-e614f5e13fcc.us-east4-0.gcp.cloud.qdrant.io` |
| `FRONTEND_URL` | `https://aitutorproject-197c3.web.app` |

### Backend secrets (Secret Manager)

Referenced via `--set-secrets` as `ENV_VAR=secret-name:latest`. Mounted as environment variables at container startup.

| Env var | Secret name |
|---|---|
| `OPENAI_API_KEY` | `openai-api-key` |
| `UNSTRUCTURED_API_KEY` | `unstructured-api-key` |
| `QDRANT_API_KEY` | `qdrant-api-key` |

### Updating an env var or secret

```bash
# Env var
gcloud run services update ai-tutor-backend \
  --region us-central1 \
  --update-env-vars "KEY=value"

# Secret (add a new version)
echo -n "new-value" | gcloud secrets versions add <secret-name> --data-file=-
# Cloud Run pulls :latest on next container start; restart the service:
gcloud run services update ai-tutor-backend --region us-central1 --clear-env-vars=DUMMY
# (the --clear-env-vars trick forces a new revision)
```

---

## Reading logs

### Backend (Cloud Run)

```bash
# Last 50 lines
gcloud run services logs read ai-tutor-backend --region us-central1 --limit 50

# Follow live
gcloud run services logs tail ai-tutor-backend --region us-central1

# In the GCP Console (richer UI, filtering, metrics):
# https://console.cloud.google.com/run/detail/us-central1/ai-tutor-backend/logs
```

Common things to grep for:
- `ModuleNotFoundError` → missing dependency in `requirements.txt`
- `CORS policy` → `FRONTEND_URL` out of sync with the deployed frontend domain
- `PERMISSION_DENIED` on Firestore → service account missing `roles/datastore.user`
- `401 Unauthorized` → Firebase ID token issue; usually means frontend didn't send `Authorization: Bearer <token>` header

### Frontend (browser DevTools)

Firebase Hosting doesn't have server logs — it's a CDN. Frontend issues show up in:
- **Browser DevTools Console** — JS errors
- **Browser DevTools Network tab** — failed API calls, CORS errors, 4xx/5xx responses
- **Firebase Console → Hosting** — deploy history, rollback, version compare

---

## Rollback

### Frontend

```bash
# See recent releases
firebase hosting:releases:list

# Roll back to previous
firebase hosting:rollback
```

Or in the Firebase Console → Hosting → click the ⋮ menu on a past release → "Rollback".

### Backend

```bash
# List revisions
gcloud run revisions list --service ai-tutor-backend --region us-central1

# Route all traffic to a previous revision
gcloud run services update-traffic ai-tutor-backend \
  --region us-central1 \
  --to-revisions <revision-name>=100
```

Or in the GCP Console → Cloud Run → `ai-tutor-backend` → Revisions tab → click ⋮ on a healthy revision → "Manage traffic" → 100%.

---

## Adding a new backend env var or secret

### Plain env var

```bash
gcloud run services update ai-tutor-backend \
  --region us-central1 \
  --update-env-vars "NEW_VAR=value"
```

### New secret

```bash
# Create secret
echo -n "secret-value" | gcloud secrets create new-secret-name --data-file=-

# Grant Cloud Run service account access
PROJECT_NUMBER=$(gcloud projects describe aitutorproject-197c3 --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding new-secret-name \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Wire into Cloud Run
gcloud run services update ai-tutor-backend \
  --region us-central1 \
  --update-secrets "NEW_VAR=new-secret-name:latest"
```

Update the relevant table in this document when you add one.

---

## Adding a custom domain

### Frontend (Firebase Hosting)

Firebase Console → Hosting → Add custom domain → follow prompts. Firebase will provision a free SSL cert.

### Firebase Auth authorized domains

**Critical — easy to forget.** Any custom domain must be added to Firebase Auth's authorized domains list, or Google Sign-In will reject it.

Firebase Console → Authentication → Settings → Authorized domains → Add domain.

The default `*.web.app` and `*.firebaseapp.com` domains are already there. Only custom domains need manual addition.

---

## What's in Docker

`backend/Dockerfile` is the source of truth for the backend environment. Python version, system deps, gunicorn config — all there. Changes to the Dockerfile require a backend redeploy to take effect.

Local Docker test (requires Docker Desktop, optional):

```bash
cd backend
docker build -t ai-tutor-backend:local .
docker run --rm -p 8080:8080 \
  -v "$(pwd)/serviceAccountKey.json:/app/serviceAccountKey.json:ro" \
  -e DEV_MODE=true \
  -e FIREBASE_STORAGE_BUCKET=aitutorproject-197c3.appspot.com \
  ai-tutor-backend:local
```

Then hit `curl http://localhost:8080/api/health`.

---

## Troubleshooting

### Frontend loads but API calls fail with CORS error

Backend's `FRONTEND_URL` is out of sync, or `cors_origins` in `backend/app.py` doesn't include the domain.

Fix:
```bash
gcloud run services update ai-tutor-backend \
  --region us-central1 \
  --update-env-vars "FRONTEND_URL=https://<correct-domain>"
```

### Sign-in fails with `auth/unauthorized-domain`

Domain missing from Firebase Auth authorized domains. See "Adding a custom domain" section.

### Backend 500s with `PERMISSION_DENIED` on Firestore

Service account missing a role. Re-run:
```bash
PROJECT_NUMBER=$(gcloud projects describe aitutorproject-197c3 --format="value(projectNumber)")
gcloud projects add-iam-policy-binding aitutorproject-197c3 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

### Frontend build succeeds but deployed site shows old code

Browser cache. Hard reload (Cmd+Shift+R) or test in incognito. Firebase Hosting does honor cache-control headers, so hashed asset filenames should prevent this — if it persists, check `dist/index.html` for the expected `<script>` hash.

### Deploy fails on `gcloud run deploy` with quota error

Check billing is enabled: https://console.cloud.google.com/billing. Free tier is generous but does require a card on file to enable the APIs.

### `No module named 'app'` at container startup

Dockerfile `CMD` doesn't match the Flask entry point. Our backend's entry is `backend/app.py` with `app = Flask(...)` created inside `create_app()`. Dockerfile uses `app:app` because `app.py` exposes `app` at module level after calling `create_app()` — if that pattern changes, update the `CMD` line.

---

## Architecture diagram (text)

```
┌─────────────────┐       ┌──────────────────────────┐
│  User Browser   │◀─────▶│  Firebase Hosting (CDN)  │
│                 │       │  aitutorproject-197c3    │
│  React/Vite SPA │       │  .web.app                │
└────────┬────────┘       └──────────────────────────┘
         │
         │  HTTPS + Bearer token (Firebase ID token)
         ▼
┌──────────────────────────────────────────────────┐
│  Cloud Run: ai-tutor-backend                     │
│  us-central1, Docker container, gunicorn         │
│                                                  │
│  ┌──────────────┐    ┌──────────────┐            │
│  │ Flask app.py │───▶│ Service layer│            │
│  └──────────────┘    └──────┬───────┘            │
│                             │                    │
│  Runs as: <proj-num>-compute@developer.gsa       │
│  Secrets from: Secret Manager                    │
└─────┬──────────┬──────────┬──────────┬──────────┘
      │          │          │          │
      ▼          ▼          ▼          ▼
  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐
  │Firestore│ │Storage │ │ Qdrant │ │ OpenAI  │
  │         │ │        │ │(GCP)   │ │  API    │
  └────────┘ └────────┘ └────────┘ └─────────┘
```

---

## Appendix: Full redeploy from scratch

If the project somehow disappears and you need to recreate everything:

1. Follow [one-time setup](#one-time-setup-for-new-contributors)
2. Enable APIs:
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
     artifactregistry.googleapis.com secretmanager.googleapis.com
   ```
3. Recreate secrets (ask Christian for values):
   ```bash
   echo -n "<value>" | gcloud secrets create openai-api-key --data-file=-
   echo -n "<value>" | gcloud secrets create unstructured-api-key --data-file=-
   echo -n "<value>" | gcloud secrets create qdrant-api-key --data-file=-
   ```
4. Grant IAM to the compute service account:
   ```bash
   PROJECT_NUMBER=$(gcloud projects describe aitutorproject-197c3 --format="value(projectNumber)")
   SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
   for SECRET in openai-api-key unstructured-api-key qdrant-api-key; do
     gcloud secrets add-iam-policy-binding $SECRET \
       --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
   done
   gcloud projects add-iam-policy-binding aitutorproject-197c3 \
     --member="serviceAccount:$SA" --role="roles/datastore.user"
   gcloud projects add-iam-policy-binding aitutorproject-197c3 \
     --member="serviceAccount:$SA" --role="roles/storage.objectAdmin"
   ```
5. Initial backend deploy (full env vars):
   ```bash
   gcloud run deploy ai-tutor-backend \
     --source backend --region us-central1 --allow-unauthenticated \
     --memory 1Gi --cpu 1 --min-instances 0 --max-instances 5 --timeout 300 \
     --set-env-vars "DEV_MODE=false,CHUNKING_STRATEGY=api,FIREBASE_STORAGE_BUCKET=aitutorproject-197c3.appspot.com,QDRANT_URL=https://92db3cd0-0a97-4304-8b44-e614f5e13fcc.us-east4-0.gcp.cloud.qdrant.io,FRONTEND_URL=https://aitutorproject-197c3.web.app" \
     --set-secrets "OPENAI_API_KEY=openai-api-key:latest,UNSTRUCTURED_API_KEY=unstructured-api-key:latest,QDRANT_API_KEY=qdrant-api-key:latest"
   ```
6. Frontend deploy:
   ```bash
   npm run build && firebase deploy --only hosting
   ```

---

## Change log

| Date | Change | Author |
|---|---|---|
| 2026-04-20 | Initial migration from DigitalOcean App Platform to Firebase Hosting + Cloud Run | Christian |