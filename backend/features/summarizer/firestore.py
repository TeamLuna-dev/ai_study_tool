"""
firestore.py — Summarizer feature
Firestore read/write operations only. No HTTP or AI logic.

Imports firebase_admin lazily so this module can be imported in tests
without a real Firebase connection (same pattern as upload/firebase_storage.py).
"""

import os
import sys


class DocumentNotFoundError(Exception):
    """Raised when a requested document does not exist or is not owned by the user."""


def _get_db():
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    from security.firebase_admin_config import db
    return db


def get_document_text(doc_id: str, uid: str) -> str:
    """
    Fetches the extracted text for a document from the Firestore documents collection.

    Arguments:
        doc_id: Firestore document ID.
        uid:    Firebase UID of the requesting user.

    Returns:
        The stored ocr_text string.

    Raises:
        DocumentNotFoundError: If the document does not exist, is not owned by the
                               user, or has no extracted text.
    """
    db = _get_db()
    snap = db.collection("documents").document(doc_id).get()

    if not snap.exists:
        raise DocumentNotFoundError(f"Document '{doc_id}' not found.")

    data = snap.to_dict()

    # Treat documents owned by other users as not found (don't leak existence)
    if data.get("ownerId") != uid:
        raise DocumentNotFoundError(f"Document '{doc_id}' not found.")

    text = (data.get("ocr_text") or "").strip()
    if not text:
        raise DocumentNotFoundError(
            "No extracted text is available for this document. "
            "Only image uploads with completed OCR are supported."
        )

    return text


def save_summary(uid: str, doc_id: str | None, summary: str) -> None:
    """
    Persists a generated summary to Firestore under users/{uid}/summaries/.

    If doc_id is provided the document is written at a fixed ID so that
    re-summarising the same document overwrites the previous result.

    Arguments:
        uid:     Firebase UID of the authenticated user.
        doc_id:  Firestore document ID the summary was generated from, or None
                 for raw-text summaries.
        summary: The generated summary text.
    """
    from google.cloud.firestore_v1 import SERVER_TIMESTAMP

    db = _get_db()
    entry = {
        "summary":      summary,
        "generated_at": SERVER_TIMESTAMP,
        "doc_id":       doc_id,
    }
    col = db.collection("users").document(uid).collection("summaries")

    if doc_id:
        col.document(doc_id).set(entry)
    else:
        col.add(entry)
