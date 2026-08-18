"""
tasks.py
Queue-backed document processing (DE-3 / D1 in docs/de.phase2.md).

Upload and OCR-confirm routes enqueue {doc_id, trigger}; Cloud Tasks
delivers it to /internal/tasks/process-document as an OIDC-signed POST.
Because the handler IS an HTTP request, Cloud Run allocates CPU for the
full run — fixing the fire-and-forget-thread failure mode (F2) without
paying for min-instances or always-on CPU.

Delivery semantics, stated honestly: at-least-once delivery (Cloud Tasks
retries with backoff) + idempotent writes (qdrant_store.py) = effectively
-once outcomes. On the final retry attempt the doc is marked "error" —
that error state IS the dead-letter record; the DE-7 backfill CLI is the
redrive path.

TASKS_QUEUE unset (local dev) falls back to an in-process daemon thread
so `docent.study` local flows keep working with zero new setup.
"""

import json
import os

from flask import Blueprint, jsonify, request

from .firebase_storage import (
    mark_document_error,
    get_document_for_processing,
    download_document,
)

# Aliased so flask's `request` above is never shadowed. google-auth is a
# direct dependency already (requirements.txt) and safe at module level —
# unlike google-cloud-tasks (see the lazy import in enqueue_process_document).
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

# ---------------------------------------------------------------------------
# Config — env-driven; defaults are project constants, not secrets.
# TASKS_MAX_ATTEMPTS must match infra/setup_queue.sh's --max-attempts.
# ---------------------------------------------------------------------------
TASKS_QUEUE = os.getenv("TASKS_QUEUE")  # unset ⇒ local thread fallback
TASKS_LOCATION = os.getenv("TASKS_LOCATION", "us-central1")
GCP_PROJECT = os.getenv("GCP_PROJECT", "aitutorproject-197c3")
TASKS_SERVICE_ACCOUNT = os.getenv(
    "TASKS_SERVICE_ACCOUNT",
    "285361659733-compute@developer.gserviceaccount.com",
)
TASK_HANDLER_BASE_URL = os.getenv(
    "TASK_HANDLER_BASE_URL",
    "https://ai-tutor-backend-285361659733.us-central1.run.app",
)
TASKS_MAX_ATTEMPTS = int(os.getenv("TASKS_MAX_ATTEMPTS", "5"))

# Same source/rationale as features/upload/routes.py — default false so an
# unset env var in a deployed environment never silently skips OIDC auth.
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

ALLOWED_TRIGGERS = {"upload", "ocr_confirm", "backfill"}

tasks_bp = Blueprint("tasks", __name__)


def enqueue_process_document(doc_id: str, trigger: str) -> str:
    """
    Enqueues a document for processing.

    Returns "queue" (Cloud Tasks) or "thread" (local fallback) so callers
    can log which path ran. Raises on enqueue failure — callers decide
    whether that should fail the request (see routes.py).
    """
    if trigger not in ALLOWED_TRIGGERS:
        raise ValueError(f"Unknown trigger: {trigger}")

    if not TASKS_QUEUE:
        # No queue configured — dispatch inline on a daemon thread. There
        # are no retries here, so a failure must be recorded immediately
        # rather than silently dropped (that was the whole F2 bug).
        import threading

        print("[TASKS] queue not configured — inline dispatch")

        def _run():
            try:
                run_document_processing(doc_id, trigger)
            except Exception as exc:
                mark_document_error(doc_id, "task", str(exc))

        threading.Thread(target=_run, daemon=True).start()
        return "thread"

    # Lazy import — google-cloud-tasks must never become an app-boot
    # dependency (a missing package here would only break the queue
    # branch, not every environment that imports this module).
    from google.cloud import tasks_v2

    client = tasks_v2.CloudTasksClient()
    parent = client.queue_path(GCP_PROJECT, TASKS_LOCATION, TASKS_QUEUE)

    # Tasks are deliberately unnamed: named tasks add enqueue-dedup, but a
    # completed named task leaves a ~1h tombstone that rejects re-creation
    # — that would block DE-7 replays. Idempotency lives in the writes
    # (qdrant_store.py), not in enqueue dedup.
    task = {
        "http_request": {
            "http_method": tasks_v2.HttpMethod.POST,
            "url": f"{TASK_HANDLER_BASE_URL}/internal/tasks/process-document",
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"doc_id": doc_id, "trigger": trigger}).encode(),
            "oidc_token": {
                "service_account_email": TASKS_SERVICE_ACCOUNT,
                "audience": TASK_HANDLER_BASE_URL,
            },
        }
    }
    client.create_task(parent=parent, task=task)
    return "queue"


def run_document_processing(doc_id: str, trigger: str) -> str:
    """
    Shared processing core used by both the task handler and the local
    thread fallback. Returns a terminal-or-transient outcome string:
    "ready" | "pending_review" | "error" | "missing".

    Infra exceptions (Firestore read, Storage download) are left to
    propagate — the caller decides how to turn that into a retry.
    """
    # Lazy import — a missing pipeline dependency must not take down app
    # boot (same guard the old inline-submit code used).
    from embeddings.pipeline import process_document, process_confirmed_ocr_text

    doc = get_document_for_processing(doc_id)
    if doc is None:
        # Doc was deleted between enqueue and delivery — ack, don't retry.
        return "missing"

    if trigger == "ocr_confirm":
        # Text comes from Firestore (already saved by store_ocr_text
        # before enqueue), never from the request payload — that
        # ordering is what makes this trigger replayable.
        return process_confirmed_ocr_text(
            text=doc["ocr_text"],
            uid=doc["owner_id"],
            file_name=doc["file_name"],
            doc_id=doc_id,
        )

    # "upload" / "backfill" — re-read raw bytes from Storage.
    file_bytes, content_type = download_document(doc["storage_path"])
    # Pre-DE-3 docs have no mimeType field; fall back to the blob's
    # content_type, which upload_file_to_storage always set.
    mimetype = doc["mime_type"] or content_type
    return process_document(
        file_bytes=file_bytes,
        uid=doc["owner_id"],
        file_name=doc["file_name"],
        doc_id=doc_id,
        mimetype=mimetype,
    )


@tasks_bp.route("/process-document", methods=["POST"])
def process_document_task():
    """
    Cloud Tasks push target. Publicly reachable (the service deploys
    --allow-unauthenticated; /internal/** is never proxied by
    docent.study — see docs/Deployment.md), so OIDC verification is the
    gate and MUST run before anything else in this handler.
    """
    # ── 1. Verify the request came from the queue's service account ────
    if not DEV_MODE:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing bearer token."}), 403

        token = auth_header.split("Bearer ")[1].strip()
        try:
            claims = google_id_token.verify_oauth2_token(
                token, google_requests.Request(), audience=TASK_HANDLER_BASE_URL
            )
        except ValueError as exc:
            return jsonify({"error": f"Invalid OIDC token: {exc}"}), 403

        if (
            claims.get("email") != TASKS_SERVICE_ACCOUNT
            or not claims.get("email_verified")
        ):
            return jsonify({"error": "Unrecognized caller."}), 403

    # ── 2. Parse the body ────────────────────────────────────────────
    body = request.get_json(silent=True) or {}
    doc_id = body.get("doc_id")
    trigger = body.get("trigger")
    if not doc_id:
        return jsonify({"error": "Request body must include 'doc_id'."}), 400
    if trigger not in ALLOWED_TRIGGERS:
        return jsonify({"error": f"Unknown trigger: {trigger}"}), 400

    # Header counts PRIOR attempts: 0 on first delivery,
    # TASKS_MAX_ATTEMPTS-1 on the last one Cloud Tasks will make.
    retry_count = int(request.headers.get("X-CloudTasks-TaskRetryCount", "0"))
    is_final_attempt = retry_count >= TASKS_MAX_ATTEMPTS - 1

    # ── 3. Run the pipeline; classify the outcome ───────────────────
    try:
        outcome = run_document_processing(doc_id, trigger)
    except Exception as exc:
        print(f"[TASKS] processing raised for {doc_id} (attempt {retry_count}): {exc}")
        if is_final_attempt:
            # Infra failure exhausted retries — a doc must never strand
            # in a non-terminal status forever. This IS the DLQ record.
            mark_document_error(doc_id, "task", str(exc))
        return jsonify({"error": str(exc)}), 500

    if outcome == "error":
        # The pipeline already wrote its own failing-stage error — do
        # not overwrite it with a generic "task" stage. The pipeline
        # never raises on its own failures (it catches internally), so
        # detection has to happen on the return value, not an exception.
        print(f"[TASKS] {doc_id} outcome=error (attempt {retry_count})")
        return jsonify({"doc_id": doc_id, "trigger": trigger, "outcome": outcome}), 500

    print(f"[TASKS] {doc_id} outcome={outcome} (attempt {retry_count})")
    return jsonify({"doc_id": doc_id, "trigger": trigger, "outcome": outcome}), 200
