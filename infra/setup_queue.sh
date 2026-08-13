#!/usr/bin/env bash
# infra/setup_queue.sh
#
# One-time (but idempotent — safe to re-run) setup for the Cloud Tasks
# queue that drives document processing (DE-3 / D1 in docs/de.phase2.md).
# Requires gcloud auth against aitutorproject-197c3.
#
# After running this, set TASKS_QUEUE=process-document on the Cloud Run
# service to switch the backend from its local-thread fallback to the
# queue (see docs/Deployment.md, "Cloud Tasks queue" section).

set -euo pipefail

PROJECT="aitutorproject-197c3"
REGION="us-central1"
QUEUE="process-document"
# Compute default SA — also the identity Cloud Tasks signs OIDC tokens as.
SA="285361659733-compute@developer.gserviceaccount.com"

gcloud services enable cloudtasks.googleapis.com --project "$PROJECT"

# create-then-update (rather than create alone) makes re-runs converge
# the retry config even if the queue already exists.
gcloud tasks queues describe "$QUEUE" --location="$REGION" >/dev/null 2>&1 \
  || gcloud tasks queues create "$QUEUE" --location="$REGION"

# --max-attempts must equal backend/features/upload/tasks.py's
# TASKS_MAX_ATTEMPTS default (5) — the handler's final-attempt detection
# depends on the two agreeing.
gcloud tasks queues update "$QUEUE" --location="$REGION" \
  --max-attempts=5 --min-backoff=10s --max-backoff=300s --max-doubling=3 \
  --max-concurrent-dispatches=5 --max-dispatches-per-second=5
# max-concurrent/dispatches-per-second bound pressure on the embedding
# APIs (OpenAI, Unstructured) the pipeline calls per task.

# Lets the backend's service account create tasks on this queue.
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:$SA" --role="roles/cloudtasks.enqueuer"

# serviceAccountUser-on-itself is required for the SA to mint OIDC
# tokens as itself when creating the task.
gcloud iam service-accounts add-iam-policy-binding "$SA" --project="$PROJECT" \
  --member="serviceAccount:$SA" --role="roles/iam.serviceAccountUser"

echo "Done. Now set TASKS_QUEUE=process-document on the Cloud Run service."
