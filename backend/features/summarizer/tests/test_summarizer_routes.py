"""
test_summarizer_routes.py
Unit tests for backend/features/summarizer/routes.py.

Covers:
  - Raw-text path returns a summary without doc_id
  - doc_id path fetches document text from Firestore and summarises it
  - Missing or invalid auth token returns 401
  - Missing doc_id document returns 404 with a user-facing message
  - Neither text nor doc_id provided returns 400
"""

import sys
import os
import pytest
from unittest.mock import patch, MagicMock
from flask import Flask

# Resolve imports from backend/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")))

os.environ["DEV_MODE"] = "false"  # force real auth path so we can test 401s

from features.summarizer.routes import summarizer_bp
from features.summarizer.firestore import DocumentNotFoundError


@pytest.fixture
def client():
    app = Flask(__name__)
    app.register_blueprint(summarizer_bp, url_prefix="/api/summarizer")
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def _auth_ok(uid="user-1"):
    """Patches verify_firebase_token to return a valid uid."""
    return patch(
        "features.summarizer.routes.verify_firebase_token",
        return_value=(uid, None),
    )

def _auth_fail(msg="Invalid or expired token"):
    """Patches verify_firebase_token to simulate a bad token."""
    return patch(
        "features.summarizer.routes.verify_firebase_token",
        return_value=(None, msg),
    )

def _mock_summarize(summary="Key points: A, B, C."):
    return patch(
        "features.summarizer.routes.summarize_text",
        return_value={"summary": summary},
    )

def _mock_get_text(text="Lecture notes content.", file_name="notes.jpg"):
    return patch(
        "features.summarizer.routes.get_document_text",
        return_value=(text, file_name),
    )

def _mock_get_text_missing():
    return patch(
        "features.summarizer.routes.get_document_text",
        side_effect=DocumentNotFoundError("Document 'bad-id' not found."),
    )

def _mock_save():
    return patch("features.summarizer.routes.save_summary")


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class TestAuth:

    def test_missing_token_returns_401(self, client):
        with _auth_fail():
            res = client.post("/api/summarizer/generate", json={"text": "hello"})
        assert res.status_code == 401

    def test_invalid_token_returns_401(self, client):
        with _auth_fail("Invalid or expired token: boom"):
            res = client.post("/api/summarizer/generate", json={"text": "hello"})
        assert res.status_code == 401
        assert "error" in res.get_json()


# ---------------------------------------------------------------------------
# Raw-text path
# ---------------------------------------------------------------------------

class TestRawTextPath:

    def test_returns_200_with_summary(self, client):
        with _auth_ok(), _mock_summarize(), _mock_save():
            res = client.post("/api/summarizer/generate", json={"text": "Some notes."})
        assert res.status_code == 200
        assert res.get_json()["summary"] == "Key points: A, B, C."

    def test_doc_id_is_null_for_raw_text(self, client):
        with _auth_ok(), _mock_summarize(), _mock_save():
            res = client.post("/api/summarizer/generate", json={"text": "Some notes."})
        assert res.get_json()["doc_id"] is None

    def test_empty_text_and_no_doc_id_returns_400(self, client):
        with _auth_ok():
            res = client.post("/api/summarizer/generate", json={})
        assert res.status_code == 400
        assert "error" in res.get_json()


# ---------------------------------------------------------------------------
# doc_id path
# ---------------------------------------------------------------------------

class TestDocIdPath:

    def test_fetches_text_from_firestore_and_summarises(self, client):
        with _auth_ok(), _mock_get_text("Lecture notes content.") as mock_get, \
             _mock_summarize(), _mock_save():
            res = client.post(
                "/api/summarizer/generate",
                json={"doc_id": "doc-abc"},
            )
        assert res.status_code == 200
        mock_get.assert_called_once_with("doc-abc", "user-1")

    def test_returns_doc_id_in_response(self, client):
        with _auth_ok(), _mock_get_text(), _mock_summarize(), _mock_save():
            res = client.post(
                "/api/summarizer/generate",
                json={"doc_id": "doc-abc"},
            )
        assert res.get_json()["doc_id"] == "doc-abc"

    def test_missing_document_returns_404(self, client):
        with _auth_ok(), _mock_get_text_missing():
            res = client.post(
                "/api/summarizer/generate",
                json={"doc_id": "bad-id"},
            )
        assert res.status_code == 404
        assert "not found" in res.get_json()["error"].lower()

    def test_doc_id_takes_precedence_over_text(self, client):
        """When both doc_id and text are provided, doc_id wins."""
        with _auth_ok(), _mock_get_text("From Firestore.") as mock_get, \
             _mock_summarize(), _mock_save():
            client.post(
                "/api/summarizer/generate",
                json={"doc_id": "doc-abc", "text": "Ignored text."},
            )
        mock_get.assert_called_once()


# ---------------------------------------------------------------------------
# History endpoint
# ---------------------------------------------------------------------------

FAKE_SUMMARIES = [
    {"id": "s1", "summary": "Summary one.", "generated_at": "2026-04-08T10:00:00", "doc_id": "doc-1", "file_name": "notes.jpg"},
    {"id": "s2", "summary": "Summary two.", "generated_at": "2026-04-07T09:00:00", "doc_id": None,    "file_name": None},
]

def _mock_get_summaries(summaries=None):
    return patch(
        "features.summarizer.routes.get_summaries",
        return_value=summaries if summaries is not None else FAKE_SUMMARIES,
    )


class TestHistoryEndpoint:

    def test_missing_token_returns_401(self, client):
        with _auth_fail():
            res = client.get("/api/summarizer/history")
        assert res.status_code == 401

    def test_returns_200_with_summaries_list(self, client):
        with _auth_ok(), _mock_get_summaries():
            res = client.get("/api/summarizer/history")
        assert res.status_code == 200
        assert "summaries" in res.get_json()

    def test_returns_correct_number_of_summaries(self, client):
        with _auth_ok(), _mock_get_summaries():
            res = client.get("/api/summarizer/history")
        assert len(res.get_json()["summaries"]) == len(FAKE_SUMMARIES)

    def test_returns_empty_list_when_no_history(self, client):
        with _auth_ok(), _mock_get_summaries(summaries=[]):
            res = client.get("/api/summarizer/history")
        data = res.get_json()
        assert res.status_code == 200
        assert data["summaries"] == []

    def test_firestore_error_returns_500(self, client):
        with _auth_ok(), patch(
            "features.summarizer.routes.get_summaries",
            side_effect=RuntimeError("Firestore unavailable"),
        ):
            res = client.get("/api/summarizer/history")
        assert res.status_code == 500
        assert "error" in res.get_json()
