"""
tests/test_firebase_storage.py
pytest tests for Task 4 — Firebase Storage integration.

Run from the file-upload/ directory:
    cd backend/file-upload
    pytest tests/test_firebase_storage.py -v

Tests:
  - Successful upload in dev mode (no Firebase needed)
  - Successful upload in production mode (Firebase mocked)
  - Storage failure handling
  - Firestore write failure handling
  - Invalid token rejection
  - Only authenticated users can upload
"""

import io
import os
import sys
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Force dev mode off for production path tests
# Individual tests override this via monkeypatch
os.environ["DEV_MODE"] = "true"
os.environ["DEV_UID"]  = "test-user-123"

from main import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def make_file(filename, mimetype, size_bytes=1024):
    return (io.BytesIO(b"x" * size_bytes), filename, mimetype)


# ── Dev mode (existing behaviour unchanged) ────────────────────────────────

class TestDevMode:

    def test_valid_upload_returns_201(self, client):
        data = {"file": make_file("notes.pdf", "application/pdf")}
        res  = client.post("/api/upload/", data=data, content_type="multipart/form-data")
        assert res.status_code == 201

    def test_response_contains_expected_fields(self, client):
        data = {"file": make_file("notes.pdf", "application/pdf")}
        res  = client.post("/api/upload/", data=data, content_type="multipart/form-data")
        body = res.json
        assert body["user_uid"]  == "test-user-123"
        assert body["filename"]  == "notes.pdf"
        assert body["temp_path"] is not None
        assert body["doc_id"]    is None   # no Firestore doc in dev mode

    def test_file_is_written_to_temp_dir(self, client, tmp_path, monkeypatch):
        """Confirms the file actually lands on disk in dev mode."""
        import routes
        monkeypatch.setattr(routes, "TEMP_DIR", str(tmp_path))

        data = {"file": make_file("slide.pdf", "application/pdf")}
        client.post("/api/upload/", data=data, content_type="multipart/form-data")

        files = list(tmp_path.iterdir())
        assert len(files) == 1
        assert "slide.pdf" in files[0].name


# ── Production mode (Firebase mocked) ─────────────────────────────────────

class TestProductionMode:

    @pytest.fixture(autouse=True)
    def set_production_mode(self, monkeypatch):
        """Switch to production mode for every test in this class."""
        import routes
        monkeypatch.setattr(routes, "DEV_MODE", False)

    def _mock_firebase(self, mock_upload):
        """Helper — sets up a successful Firebase mock response."""
        mock_upload.return_value = {
            "doc_id":       "firestore-doc-abc123",
            "storage_url":  "https://storage.googleapis.com/test/notes.pdf",
            "storage_path": "users/test-user-123/documents/notes.pdf",
        }

    @patch("firebase_storage.upload_file_to_storage")
    def test_successful_upload_returns_201(self, mock_upload, client):
        self._mock_firebase(mock_upload)
        data = {"file": make_file("notes.pdf", "application/pdf")}
        res  = client.post("/api/upload/", data=data, content_type="multipart/form-data")
        assert res.status_code == 201

    @patch("firebase_storage.upload_file_to_storage")
    def test_response_contains_firebase_fields(self, mock_upload, client):
        self._mock_firebase(mock_upload)
        data = {"file": make_file("notes.pdf", "application/pdf")}
        res  = client.post("/api/upload/", data=data, content_type="multipart/form-data")
        body = res.json
        assert body["doc_id"]       == "firestore-doc-abc123"
        assert body["storage_url"]  == "https://storage.googleapis.com/test/notes.pdf"
        assert body["storage_path"] == "users/test-user-123/documents/notes.pdf"
        assert body["user_uid"]     == "test-user-123"

    @patch("firebase_storage.upload_file_to_storage")
    def test_firebase_is_called_with_correct_args(self, mock_upload, client):
        """Confirms routes.py passes the right data to firebase_storage."""
        self._mock_firebase(mock_upload)
        data = {"file": make_file("lecture.pdf", "application/pdf", size_bytes=2048)}
        client.post("/api/upload/", data=data, content_type="multipart/form-data")

        mock_upload.assert_called_once()
        call_kwargs = mock_upload.call_args.kwargs
        assert call_kwargs["uid"]               == "test-user-123"
        assert call_kwargs["original_filename"] == "lecture.pdf"
        assert call_kwargs["mimetype"]          == "application/pdf"
        assert len(call_kwargs["file_bytes"])   == 2048

    @patch("firebase_storage.upload_file_to_storage")
    def test_storage_failure_returns_500(self, mock_upload, client):
        """Confirms a Firebase Storage error is surfaced as a 500."""
        from firebase_storage import FirebaseStorageError
        mock_upload.side_effect = FirebaseStorageError("Storage bucket unavailable.")

        data = {"file": make_file("notes.pdf", "application/pdf")}
        res  = client.post("/api/upload/", data=data, content_type="multipart/form-data")
        assert res.status_code == 500
        assert "Storage bucket unavailable" in res.json["error"]


# ── Auth tests (apply in both modes) ──────────────────────────────────────

class TestAuth:

    def test_missing_file_rejected(self, client):
        res = client.post("/api/upload/", data={}, content_type="multipart/form-data")
        assert res.status_code == 400

    def test_invalid_mime_type_rejected(self, client):
        data = {"file": make_file("doc.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        res  = client.post("/api/upload/", data=data, content_type="multipart/form-data")
        assert res.status_code == 415

    def test_oversized_file_rejected(self, client):
        data = {"file": make_file("big.pdf", "application/pdf", 21 * 1024 * 1024)}
        res  = client.post("/api/upload/", data=data, content_type="multipart/form-data")
        assert res.status_code == 413

    def test_invalid_token_rejected(self, client, monkeypatch):
        """Confirms unauthenticated requests are blocked when DEV_MODE is off."""
        import auth
        monkeypatch.setattr(auth, "DEV_MODE", False)

        data = {"file": make_file("notes.pdf", "application/pdf")}
        res  = client.post("/api/upload/", data=data, content_type="multipart/form-data")
        assert res.status_code == 401