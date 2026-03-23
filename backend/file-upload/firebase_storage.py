"""
firebase_storage.py

Handles only Firebase Storage uploads and Firestore document management.
Does not validate files, generate embeddings, or handle HTTP concerns.

Imports firebase_admin_config lazily (inside functions, not at module level)
so this file can be imported in tests without needing real Firebase credentials.
"""

import os
import uuid
from google.cloud.firestore_v1 import SERVER_TIMESTAMP


class FirebaseStorageError(Exception):
    """
    Raised when a Firebase Storage upload or Firestore write fails.
    Callers catch this to return a meaningful error response to the frontend.
    """


def _get_firebase():
    """
    Lazily imports Firebase clients so this module can be imported in tests
    without triggering a real Firebase connection.

    Returns:
        (db, bucket) tuple from firebase_admin_config.
    """
    import sys
    # Add backend/ to path so firebase_admin_config can be found
    backend_dir = os.path.join(os.path.dirname(__file__), "..")
    if os.path.abspath(backend_dir) not in sys.path:
        sys.path.insert(0, os.path.abspath(backend_dir))

    from firebase_admin_config import db, bucket
    return db, bucket


def upload_file_to_storage(
    file_bytes: bytes,
    uid: str,
    original_filename: str,
    mimetype: str,
) -> dict:
    """
    Uploads a file to Firebase Storage and creates a Firestore document.

    Storage path: users/{uid}/documents/{uuid}_{original_filename}

    Arguments:
        file_bytes:        Raw bytes of the uploaded file.
        uid:               Firebase UID of the authenticated user.
        original_filename: Original filename as uploaded by the student.
        mimetype:          MIME type e.g. "application/pdf".

    Returns:
        dict with doc_id, storage_url, storage_path.

    Raises:
        FirebaseStorageError: If the Storage upload or Firestore write fails.
    """
    db, bucket = _get_firebase()

    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
    storage_path    = f"users/{uid}/documents/{unique_filename}"

    # ── Step 1: Upload to Firebase Storage ───────────────────────────────
    try:
        blob = bucket.blob(storage_path)
        blob.upload_from_string(file_bytes, content_type=mimetype)
        blob.make_public()
        storage_url = blob.public_url

    except Exception as exc:
        raise FirebaseStorageError(
            f"Failed to upload file to Storage: {exc}"
        ) from exc

    # ── Step 2: Create Firestore document ─────────────────────────────────
    try:
        _, doc_ref = db.collection("documents").add({
            "ownerId":     uid,
            "fileName":    original_filename,
            "fileType":    mimetype.split("/")[-1],
            "fileSize":    len(file_bytes),
            "storageUrl":  storage_url,
            "storagePath": storage_path,
            "uploadedAt":  SERVER_TIMESTAMP,
            "status":      "processing",
            "vectorIds":   [],
            "roomId":      None,
        })

    except Exception as exc:
        raise FirebaseStorageError(
            f"Failed to create Firestore document: {exc}"
        ) from exc

    print(f"[FIREBASE] Uploaded {original_filename} for UID {uid} → {storage_path}")

    return {
        "doc_id":       doc_ref.id,
        "storage_url":  storage_url,
        "storage_path": storage_path,
    }


def update_document_status(doc_id: str, status: str, extra: dict = None) -> None:
    """
    Sets the Firestore document's status field.
    Used by the pipeline to broadcast each processing stage to the frontend.

    Arguments:
        doc_id:  Firestore document ID.
        status:  One of "extracting", "embedding", "storing", "ready", "error".
        extra:   Optional extra fields to merge into the update (e.g. vectorIds).
    """
    db, _ = _get_firebase()
    update = {"status": status}
    if extra:
        update.update(extra)
    try:
        db.collection("documents").document(doc_id).update(update)
    except Exception as exc:
        # Non-fatal — log but don't crash the pipeline
        print(f"[FIREBASE] Warning: could not update status to '{status}': {exc}")


def mark_document_ready(doc_id: str, vector_ids: list) -> None:
    """
    Updates a Firestore document status to "ready" after embeddings stored.
    """
    update_document_status(doc_id, "ready", {"vectorIds": vector_ids})
    print(f"[FIREBASE] Document {doc_id} marked ready with {len(vector_ids)} vectors.")


def mark_document_error(doc_id: str, stage: str, message: str) -> None:
    """
    Updates a Firestore document status to "error" with structured context.
    Best-effort — logs but does not raise if the update itself fails.

    Arguments:
        doc_id:  Firestore document ID.
        stage:   Which pipeline stage failed: "extraction", "embedding", or "storage".
        message: Human-readable description of what went wrong.
    """
    try:
        db, _ = _get_firebase()
        db.collection("documents").document(doc_id).update({
            "status": "error",
            "error": {
                "stage":   stage,
                "message": message,
            },
        })
        print(f"[FIREBASE] Document {doc_id} error at '{stage}': {message}")

    except Exception as exc:
        print(f"[FIREBASE] Warning: could not mark document as error: {exc}")