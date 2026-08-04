"""
test_firebase_storage_privacy.py
DE-2: uploaded files must stay private — no make_public() call, no
storageUrl written to Firestore, no storage_url in the returned dict.

Imports firebase_storage.py directly rather than going through main.py,
whose broken relative import (see TRAP C in de.phase3.md) prevents
test_firebase_storage.py from being collected at all. firebase_storage's
_get_firebase() is lazily imported specifically so this module can be
tested without real Firebase credentials — patch that, not the module.
"""

import os
import sys
from unittest.mock import MagicMock, patch

# Backend dir must be on sys.path — this tests/ package has no __init__.py,
# so pytest won't insert it for us the way it does for sibling packages.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from features.upload import firebase_storage


def _mock_firebase(mock_get_firebase, doc_id="doc-abc123"):
    """Wires a mock (db, bucket) pair with a working blob + add()."""
    mock_db = MagicMock()
    mock_bucket = MagicMock()
    mock_get_firebase.return_value = (mock_db, mock_bucket)

    mock_bucket.blob.return_value = MagicMock()

    mock_doc_ref = MagicMock()
    mock_doc_ref.id = doc_id
    mock_db.collection.return_value.add.return_value = (None, mock_doc_ref)

    return mock_db, mock_bucket


@patch("features.upload.firebase_storage._get_firebase")
def test_upload_never_calls_make_public(mock_get_firebase):
    _, mock_bucket = _mock_firebase(mock_get_firebase)

    firebase_storage.upload_file_to_storage(
        file_bytes=b"hello",
        uid="user-1",
        original_filename="notes.pdf",
        mimetype="application/pdf",
    )

    mock_bucket.blob.return_value.make_public.assert_not_called()


@patch("features.upload.firebase_storage._get_firebase")
def test_firestore_payload_has_no_storage_url(mock_get_firebase):
    mock_db, _ = _mock_firebase(mock_get_firebase)

    firebase_storage.upload_file_to_storage(
        file_bytes=b"hello",
        uid="user-1",
        original_filename="notes.pdf",
        mimetype="application/pdf",
    )

    written_payload = mock_db.collection.return_value.add.call_args.args[0]
    assert "storageUrl" not in written_payload
    assert written_payload["storagePath"].startswith("users/user-1/documents/")


@patch("features.upload.firebase_storage._get_firebase")
def test_result_dict_has_no_storage_url(mock_get_firebase):
    _mock_firebase(mock_get_firebase, doc_id="doc-abc123")

    result = firebase_storage.upload_file_to_storage(
        file_bytes=b"hello",
        uid="user-1",
        original_filename="notes.pdf",
        mimetype="application/pdf",
    )

    assert "storage_url" not in result
    assert result["doc_id"] == "doc-abc123"
    assert result["storage_path"].startswith("users/user-1/documents/")
