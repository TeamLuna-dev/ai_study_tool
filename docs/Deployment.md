# Deployment Guide

**Last updated:** July 27, 2026
**Owner:** Christian Molina
**Stack:** Firebase Hosting (frontend) + Google Cloud Run (backend)
**GCP Project:** `aitutorproject-197c3`

---

## Live URLs

| Service | URL |
|---|---|
| Frontend | https://docent.study |
| Frontend (Firebase default) | https://aitutorproject-197c3.web.app |
| Backend (direct) | https://ai-tutor-backend-285361659733.us-central1.run.app |
| Backend (via Hosting rewrite) | https://docent.study/api |
| Firebase Console | https://console.firebase.google.com/project/aitutorproject-197c3 |
| GCP Console | https://console.cloud.google.com/home/dashboard?project=aitutorproject-197c3 |

---

## Golden rules

1. **Never deploy from a dirty working tree.** Run `git status` first. What you deploy should match a committed hash in the repo so rollbacks work.
2. **Deploy from `main`.** Feature branches are for testing locally, not for prod.
3. **The frontend calls the backend same-origin at `/api`.** Firebase Hosting rewrites `/api/**` to Cloud Run (see `firebase.json`), so the backend URL is *not* baked into the bundle and no CORS is involved. Do not set `VITE_API_BASE_URL` in production — it overrides the rewrite with a cross-origin absolute URL.
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
### Add file .env.production.local to main root
### File should only have VITE_API_BASE_URL: (key) ... nothing else

### Include in your .gitignore
### Firebase Hosting cache
### .firebase/ 

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

Output ends with `Hosting URL: https://aitutorproject-197c3.web.app` (the CLI always prints the default site, not the custom domain). Deploy takes ~1–2 minutes and serves both hosts.

**Test after deploy:**

1. Open incognito → https://docent.study
2. Sign in with Google
3. Check DevTools Network tab — API calls should be **relative** (`docent.study/api/...`) and return 200s. An absolute `*.run.app` URL here means `VITE_API_BASE_URL` leaked into the build.

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
| `VITE_API_BASE_URL` | **Leave unset in prod.** Local override only (e.g. pointing dev at deployed Cloud Run). Unset ⇒ `src/config/api.js` falls back to same-origin `/api`. |
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
| `FRONTEND_URL` | `https://docent.study` |

### Backend secrets (Secret Manager)

Referenced via `--set-secrets` as `ENV_VAR=secret-name:latest`. Mounted as environment variables at container startup.

| Env var | Secret name |
|---|---|
| `OPENAI_API_KEY` | `openai-api-key` |
| `UNSTRUCTURED_API_KEY` | `unstructured-api-key` |
| `QDRANT_API_KEY` | `qdrant-api-key` |
| `ANTHROPIC_LUNA_KEY` | `anthropic-luna-key` |

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

## Custom domain

Production domain is **`docent.study`**, registered at **Namecheap** using Namecheap BasicDNS (`dns1/dns2.registrar-servers.com`).

Because Hosting rewrites `/api/**` to Cloud Run, the custom domain fronts the API too. No separate DNS record or backend domain mapping is needed.

### DNS records (Namecheap → Advanced DNS → HOST RECORDS)

| Type | Host | Value |
|---|---|---|
| A Record | `@` | `199.36.158.100` |
| TXT Record | `@` | `hosting-site=aitutorproject-197c3` |
| TXT Record | `@` | `v=spf1 include:spf.efwd.registrar-servers.com ~all` (email forwarding — leave alone) |

**Namecheap's default parking records must be removed or the ACME challenge fails:**
- A **URL Redirect Record** on `@` — this is what publishes `162.255.119.126`. It does *not* appear as an A record in the panel, so it's easy to miss.
- A **CNAME** `www → parkingpage.namecheap.com.`
- Also check the separate **REDIRECT DOMAIN** section on the same page.

Symptom if you skip this: Firebase shows `Hosting's HTTP GET request for the ACME challenge failed: 162.255.119.126: Request failed`. Let's Encrypt validates over HTTP, so it hits whatever the apex A record resolves to — the parking page has no `/.well-known/acme-challenge/` handler.

Verify before clicking **Verify** in the Firebase console:

```bash
dig +short docent.study A @8.8.8.8    # want 199.36.158.100, nothing else
dig +short docent.study TXT @8.8.8.8  # want the hosting-site= line
```

Cert issuance can take a few hours after verification succeeds. Firebase retries the ACME challenge on its own.

### Firebase Auth authorized domains

**Critical — easy to forget.** Any custom domain must be added to Firebase Auth's authorized domains list, or Google Sign-In will reject it with `auth/unauthorized-domain`.

Firebase Console → Authentication → Settings → Authorized domains → Add domain.

The default `*.web.app` and `*.firebaseapp.com` domains are already there. Only custom domains need manual addition.

### Checklist when adding another domain

1. Firebase Console → Hosting → Add custom domain
2. Add the A + TXT records at the registrar; remove any parking/redirect records
3. Firebase Console → Authentication → Authorized domains → add it
4. Update `FRONTEND_URL` on Cloud Run (belt-and-braces — same-origin traffic never triggers CORS, but keeps the allowlist honest)
5. Update the Live URLs table above

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

**In prod this should be impossible** — requests go same-origin through the Hosting rewrite. A CORS error means the bundle was built with `VITE_API_BASE_URL` set, turning calls cross-origin. Check the Network tab: if requests target `*.run.app` instead of `docent.study/api`, clear the var from `.env.production.local`, rebuild, redeploy.

If you genuinely need the cross-origin path, the backend's `FRONTEND_URL` must match the calling origin exactly (`backend/app.py` allowlists one production origin plus localhost):
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
│                 │       │  docent.study            │
│  React/Vite SPA │       │  (+ *.web.app default)   │
└─────────────────┘       └────────────┬─────────────┘
                                       │
        all requests are same-origin;  │  /api/** rewrite
        no CORS anywhere in prod       │  HTTPS + Bearer token
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
     --set-env-vars "DEV_MODE=false,CHUNKING_STRATEGY=api,FIREBASE_STORAGE_BUCKET=aitutorproject-197c3.appspot.com,QDRANT_URL=https://92db3cd0-0a97-4304-8b44-e614f5e13fcc.us-east4-0.gcp.cloud.qdrant.io,FRONTEND_URL=https://docent.study" \
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