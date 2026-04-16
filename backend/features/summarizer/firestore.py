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


def get_document_text(doc_id: str, uid: str) -> tuple[str, str]:
    """
    Fetches the extracted text and original filename for a document.

    Arguments:
        doc_id: Firestore document ID.
        uid:    Firebase UID of the requesting user.

    Returns:
        (ocr_text, file_name) tuple.

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

    file_name = data.get("fileName") or data.get("file_name") or ""
    return text, file_name


def save_summary(
    uid: str,
    doc_id: str | None,
    summary: str,
    file_name: str | None = None,
) -> None:
    """
    Persists a generated summary to Firestore under users/{uid}/summaries/.

    If doc_id is provided the document is written at a fixed ID so that
    re-summarising the same document overwrites the previous result.

    Arguments:
        uid:       Firebase UID of the authenticated user.
        doc_id:    Firestore document ID the summary was generated from, or None.
        summary:   The generated summary text.
        file_name: Original filename of the source document, or None.
    """
    from google.cloud.firestore_v1 import SERVER_TIMESTAMP

    db = _get_db()
    entry = {
        "summary":      summary,
        "generated_at": SERVER_TIMESTAMP,
        "doc_id":       doc_id,
        "file_name":    file_name,
    }
    col = db.collection("users").document(uid).collection("summaries")

    if doc_id:
        col.document(doc_id).set(entry)
    else:
        col.add(entry)


def get_summaries(uid: str) -> list:
    """
    Returns the user's last 10 summaries ordered by generation time, newest first.

    Serialises Firestore timestamps to ISO-8601 strings for JSON transport.

    Arguments:
        uid: Firebase UID of the authenticated user.

    Returns:
        List of dicts with keys: id, summary, generated_at, doc_id, file_name.
    """
    from google.cloud.firestore_v1 import Query

    db = _get_db()
    snaps = (
        db.collection("users")
          .document(uid)
          .collection("summaries")
          .order_by("generated_at", direction=Query.DESCENDING)
          .limit(10)
          .stream()
    )

    result = []
    for snap in snaps:
        data = snap.to_dict()
        generated_at = data.get("generated_at")
        if hasattr(generated_at, "isoformat"):
            generated_at = generated_at.isoformat()
        elif generated_at is not None:
            generated_at = str(generated_at)

        result.append({
            "id":           snap.id,
            "summary":      data.get("summary", ""),
            "generated_at": generated_at,
            "doc_id":       data.get("doc_id"),
            "file_name":    data.get("file_name"),
        })

    return result
