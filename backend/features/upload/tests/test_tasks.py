"""
tests/test_tasks.py
DE-3: queue-backed document processing — OIDC-gated task handler,
enqueue/route wiring, and outcome-based retry decisions.

Two fixtures are used:
  - `client` (bare Flask app, tasks_bp only) for the handler itself.
  - create_app() directly, per-test, for the upload/OCR route wiring —
    same pattern as test_upload.py — since those routes need the full
    blueprint set and DEV_MODE plumbing.
"""

import io
import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

import pytest
from flask import Flask

import features.upload.tasks as tasks_mod
from features.upload.tasks import tasks_bp
from app import create_app


@pytest.fixture
def app():
    app = Flask(__name__)
    app.register_blueprint(tasks_bp, url_prefix="/internal/tasks")
    return app


@pytest.fixture
def client(app):
    return app.test_client()


# ═══════════════════════════════════════════════════════════════════════════
# (a) OIDC gate — verified before anything else (TRAP E)
# ═══════════════════════════════════════════════════════════════════════════

def test_missing_bearer_token_rejected(client, monkeypatch):
    monkeypatch.setattr(tasks_mod, "DEV_MODE", False)
    res = client.post(
        "/internal/tasks/process-document",
        json={"doc_id": "d1", "trigger": "upload"},
    )
    assert res.status_code == 403


def test_invalid_oidc_token_rejected(client, monkeypatch):
    monkeypatch.setattr(tasks_mod, "DEV_MODE", False)
    with patch.object(
        tasks_mod.google_id_token, "verify_oauth2_token",
        side_effect=ValueError("bad token"),
    ):
        res = client.post(
            "/internal/tasks/process-document",
            json={"doc_id": "d1", "trigger": "upload"},
            headers={"Authorization": "Bearer faketoken"},
        )
    assert res.status_code == 403


def test_wrong_service_account_rejected(client, monkeypatch):
    monkeypatch.setattr(tasks_mod, "DEV_MODE", False)
    with patch.object(
        tasks_mod.google_id_token, "verify_oauth2_token",
        return_value={"email": "someone-else@example.com", "email_verified": True},
    ):
        res = client.post(
            "/internal/tasks/process-document",
            json={"doc_id": "d1", "trigger": "upload"},
            headers={"Authorization": "Bearer faketoken"},
        )
    assert res.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════
# (b) body validation — DEV_MODE bypasses OIDC (default true, see conftest)
# ═══════════════════════════════════════════════════════════════════════════

def test_missing_doc_id_rejected(client):
    res = client.post("/internal/tasks/process-document", json={"trigger": "upload"})
    assert res.status_code == 400


def test_unknown_trigger_rejected(client):
    res = client.post(
        "/internal/tasks/process-document",
        json={"doc_id": "d1", "trigger": "bogus"},
    )
    assert res.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════
# (c)/(f) terminal-or-transient outcomes → 200
# ═══════════════════════════════════════════════════════════════════════════

@patch("features.upload.tasks.run_document_processing")
def test_ready_outcome_returns_200(mock_run, client):
    mock_run.return_value = "ready"
    res = client.post(
        "/internal/tasks/process-document",
        json={"doc_id": "d1", "trigger": "upload"},
    )
    assert res.status_code == 200
    assert res.json["outcome"] == "ready"


@patch("features.upload.tasks.run_document_processing")
def test_missing_outcome_returns_200(mock_run, client):
    """Doc deleted between enqueue and delivery — ack, don't retry."""
    mock_run.return_value = "missing"
    res = client.post(
        "/internal/tasks/process-document",
        json={"doc_id": "d1", "trigger": "upload"},
    )
    assert res.status_code == 200
    assert res.json["outcome"] == "missing"


# ═══════════════════════════════════════════════════════════════════════════
# (d) pipeline-reported "error" — retries, but the pipeline already wrote
# its own failing-stage error, so the handler must not overwrite it
# ═══════════════════════════════════════════════════════════════════════════

@patch("features.upload.tasks.mark_document_error")
@patch("features.upload.tasks.run_document_processing")
def test_error_outcome_first_attempt_does_not_mark(mock_run, mock_mark, client):
    mock_run.return_value = "error"
    res = client.post(
        "/internal/tasks/process-document",
        json={"doc_id": "d1", "trigger": "upload"},
        headers={"X-CloudTasks-TaskRetryCount": "0"},
    )
    assert res.status_code == 500
    mock_mark.assert_not_called()


# ═══════════════════════════════════════════════════════════════════════════
# (e) infra exception on the FINAL attempt — this IS the DLQ record
# ═══════════════════════════════════════════════════════════════════════════

@patch("features.upload.tasks.mark_document_error")
@patch("features.upload.tasks.run_document_processing")
def test_exception_on_final_attempt_marks_error(mock_run, mock_mark, client):
    mock_run.side_effect = RuntimeError("Storage unavailable")
    # TASKS_MAX_ATTEMPTS defaults to 5 ⇒ retry_count 4 is the final attempt.
    res = client.post(
        "/internal/tasks/process-document",
        json={"doc_id": "d1", "trigger": "upload"},
        headers={"X-CloudTasks-TaskRetryCount": "4"},
    )
    assert res.status_code == 500
    mock_mark.assert_called_once()
    assert mock_mark.call_args.args[1] == "task"


@patch("features.upload.tasks.mark_document_error")
@patch("features.upload.tasks.run_document_processing")
def test_exception_on_non_final_attempt_does_not_mark(mock_run, mock_mark, client):
    mock_run.side_effect = RuntimeError("transient")
    res = client.post(
        "/internal/tasks/process-document",
        json={"doc_id": "d1", "trigger": "upload"},
        headers={"X-CloudTasks-TaskRetryCount": "1"},
    )
    assert res.status_code == 500
    mock_mark.assert_not_called()


# ═══════════════════════════════════════════════════════════════════════════
# (g) run_document_processing routing — tested directly, not through Flask
# ═══════════════════════════════════════════════════════════════════════════

@patch("features.upload.tasks.download_document")
@patch("features.upload.tasks.get_document_for_processing")
def test_ocr_confirm_reads_stored_text_not_storage(mock_get_doc, mock_download):
    mock_get_doc.return_value = {
        "owner_id": "u1", "file_name": "f.png",
        "storage_path": "users/u1/documents/f.png",
        "mime_type": None, "ocr_text": "confirmed text", "status": "pending_review",
    }
    with patch(
        "embeddings.pipeline.process_confirmed_ocr_text", return_value="ready"
    ) as mock_proc:
        outcome = tasks_mod.run_document_processing("d1", "ocr_confirm")

    assert outcome == "ready"
    mock_proc.assert_called_once_with(
        text="confirmed text", uid="u1", file_name="f.png", doc_id="d1"
    )
    mock_download.assert_not_called()


@patch("features.upload.tasks.download_document")
@patch("features.upload.tasks.get_document_for_processing")
def test_upload_trigger_falls_back_to_blob_content_type(mock_get_doc, mock_download):
    """Pre-DE-3 docs have no mimeType field — fall back to blob.content_type."""
    mock_get_doc.return_value = {
        "owner_id": "u1", "file_name": "f.pdf",
        "storage_path": "users/u1/documents/f.pdf",
        "mime_type": None, "ocr_text": "", "status": "processing",
    }
    mock_download.return_value = (b"raw bytes", "application/pdf")
    with patch("embeddings.pipeline.process_document", return_value="ready") as mock_proc:
        outcome = tasks_mod.run_document_processing("d1", "upload")

    assert outcome == "ready"
    mock_download.assert_called_once_with("users/u1/documents/f.pdf")
    assert mock_proc.call_args.kwargs["mimetype"] == "application/pdf"


@patch("features.upload.tasks.get_document_for_processing")
def test_deleted_doc_returns_missing(mock_get_doc):
    mock_get_doc.return_value = None
    assert tasks_mod.run_document_processing("d1", "upload") == "missing"


# ═══════════════════════════════════════════════════════════════════════════
# (h) upload route enqueues instead of threading
# ═══════════════════════════════════════════════════════════════════════════

@patch("features.upload.tasks.enqueue_process_document")
@patch("features.upload.firebase_storage.upload_file_to_storage")
@patch("features.upload.routes.verify_firebase_token")
def test_upload_route_enqueues_upload_trigger(mock_auth, mock_upload, mock_enqueue, monkeypatch):
    import features.upload.routes as routes
    monkeypatch.setattr(routes, "DEV_MODE", False)
    mock_auth.return_value = ("user-1", None)
    mock_upload.return_value = {
        "doc_id": "doc-1", "storage_path": "users/user-1/documents/notes.pdf",
    }

    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()

    data = {"file": (io.BytesIO(b"x" * 10), "notes.pdf", "application/pdf")}
    res = client.post("/api/upload", data=data, content_type="multipart/form-data")

    assert res.status_code == 201
    assert res.json["processing_enqueued"] is True
    mock_enqueue.assert_called_once_with("doc-1", "upload")


@patch("features.upload.tasks.enqueue_process_document")
@patch("features.upload.firebase_storage.mark_document_error")
@patch("features.upload.firebase_storage.upload_file_to_storage")
@patch("features.upload.routes.verify_firebase_token")
def test_upload_route_enqueue_failure_still_201(
    mock_auth, mock_upload, mock_mark, mock_enqueue, monkeypatch
):
    import features.upload.routes as routes
    monkeypatch.setattr(routes, "DEV_MODE", False)
    mock_auth.return_value = ("user-1", None)
    mock_upload.return_value = {
        "doc_id": "doc-1", "storage_path": "users/user-1/documents/notes.pdf",
    }
    mock_enqueue.side_effect = RuntimeError("queue unavailable")

    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()

    data = {"file": (io.BytesIO(b"x" * 10), "notes.pdf", "application/pdf")}
    res = client.post("/api/upload", data=data, content_type="multipart/form-data")

    # Bytes + Firestore doc are already durable — enqueue failure must
    # NOT fail the upload response.
    assert res.status_code == 201
    assert res.json["processing_enqueued"] is False
    mock_mark.assert_called_once()
    assert mock_mark.call_args.args[1] == "task"


# ═══════════════════════════════════════════════════════════════════════════
# (i) OCR-confirm route enqueues instead of threading
# ═══════════════════════════════════════════════════════════════════════════

@patch("features.upload.tasks.enqueue_process_document")
@patch("features.upload.firebase_storage.store_ocr_text")
@patch("features.upload.routes.verify_firebase_token")
def test_ocr_route_enqueues_ocr_confirm_trigger(mock_auth, mock_store, mock_enqueue):
    mock_auth.return_value = ("user-1", None)

    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()

    res = client.put("/api/ocr/doc-1/text", json={"text": "confirmed"})

    assert res.status_code == 200
    mock_store.assert_called_once_with("doc-1", "confirmed")
    mock_enqueue.assert_called_once_with("doc-1", "ocr_confirm")


@patch("features.upload.tasks.enqueue_process_document")
@patch("features.upload.firebase_storage.mark_document_error")
@patch("features.upload.firebase_storage.store_ocr_text")
@patch("features.upload.routes.verify_firebase_token")
def test_ocr_route_enqueue_failure_returns_502(mock_auth, mock_store, mock_mark, mock_enqueue):
    mock_auth.return_value = ("user-1", None)
    mock_enqueue.side_effect = RuntimeError("queue unavailable")

    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()

    res = client.put("/api/ocr/doc-1/text", json={"text": "confirmed"})

    # The user's edit IS saved — surface the error so a re-click can retry.
    assert res.status_code == 502
    mock_mark.assert_called_once()


# ═══════════════════════════════════════════════════════════════════════════
# (j) regression guard for the fixed defect (F2)
# ═══════════════════════════════════════════════════════════════════════════

def test_no_thread_pool_executor_left_in_source():
    import inspect
    import features.upload.routes as routes
    source = inspect.getsource(routes)
    assert "ThreadPoolExecutor" not in source
    assert "_executor" not in source
