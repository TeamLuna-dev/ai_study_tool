"""
tests/test_upload.py
pytest tests for Task 2 — file upload endpoint.

Run from the file-upload/ directory:
    cd backend/file-upload
    pytest tests/test_upload.py -v
"""

import io
import os
import sys

# Add the file-upload/ directory to the path so pytest finds main, routes, auth
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

# Set dev mode before importing the app so Firebase is never initialised
os.environ["DEV_MODE"] = "true"
os.environ["DEV_UID"]  = "test-user-123"

from main import create_app


@pytest.fixture
def client():
    """Creates a Flask test client for each test."""
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def make_file(filename, mimetype, size_bytes=1024):
    """Helper — creates an in-memory file to send in test requests."""
    return (io.BytesIO(b"x" * size_bytes), filename, mimetype)


# ── Valid uploads ──────────────────────────────────────────────────────────

def test_valid_pdf_upload(client):
    data = {"file": make_file("notes.pdf", "application/pdf")}
    res = client.post("/api/upload/", data=data, content_type="multipart/form-data")
    assert res.status_code == 201
    assert res.json["user_uid"] == "test-user-123"
    assert res.json["filename"] == "notes.pdf"

def test_valid_jpg_upload(client):
    data = {"file": make_file("photo.jpg", "image/jpeg")}
    res = client.post("/api/upload/", data=data, content_type="multipart/form-data")
    assert res.status_code == 201

def test_valid_png_upload(client):
    data = {"file": make_file("diagram.png", "image/png")}
    res = client.post("/api/upload/", data=data, content_type="multipart/form-data")
    assert res.status_code == 201


# ── Invalid MIME type ──────────────────────────────────────────────────────

def test_invalid_mime_type_rejected(client):
    data = {"file": make_file("doc.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    res = client.post("/api/upload/", data=data, content_type="multipart/form-data")
    assert res.status_code == 415
    assert "Unsupported file type" in res.json["error"]


# ── File size ──────────────────────────────────────────────────────────────

def test_oversized_file_rejected(client):
    size = 21 * 1024 * 1024  # 21MB — over the 20MB limit
    data = {"file": make_file("huge.pdf", "application/pdf", size)}
    res = client.post("/api/upload/", data=data, content_type="multipart/form-data")
    assert res.status_code == 413
    assert "size limit" in res.json["error"]


# ── Missing file ───────────────────────────────────────────────────────────

def test_missing_file_rejected(client):
    res = client.post("/api/upload/", data={}, content_type="multipart/form-data")
    assert res.status_code == 400
    assert "No file provided" in res.json["error"]


# ── Auth (mocked) ──────────────────────────────────────────────────────────

def test_uid_associated_with_upload(client):
    """Confirms the response contains the UID from DEV_MODE."""
    data = {"file": make_file("notes.pdf", "application/pdf")}
    res = client.post("/api/upload/", data=data, content_type="multipart/form-data")
    assert res.status_code == 201
    assert res.json["user_uid"] == "test-user-123"

def test_auth_rejected_when_dev_mode_off(client, monkeypatch):
    """Confirms a missing token is rejected when DEV_MODE is false."""
    import auth
    monkeypatch.setattr(auth, "DEV_MODE", False)

    data = {"file": make_file("notes.pdf", "application/pdf")}
    res = client.post("/api/upload/", data=data, content_type="multipart/form-data")
    assert res.status_code == 401