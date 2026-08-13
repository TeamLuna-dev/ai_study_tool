"""
routes.py
HTTP concerns only — validates, associates with user, stores temporarily.

This file only handles HTTP request/response concerns.
All Firebase operations are delegated to firebase_storage.py

  - In DEV_MODE: still uses temp/ folder (no Firebase needed)
  - In production: uploads to Firebase Storage + creates Firestore document
"""

import os
import sys
import uuid
from flask import Blueprint, jsonify, request
from .auth import verify_firebase_token

# Add backend/embeddings to path so pipeline can be imported
"""_embeddings_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "embeddings"))
if _embeddings_dir not in sys.path:
    sys.path.insert(0, _embeddings_dir)
"""
upload_bp = Blueprint("upload", __name__)
ocr_bp    = Blueprint("ocr",    __name__)

# ---------------------------------------------------------------------------
# Validation registry — mirrors src/util/fileValidation.js on the frontend.
# Add new types here without changing any route logic below.
# ---------------------------------------------------------------------------
ALLOWED_MIME_TYPES = {
    "application/pdf": {"max_size_bytes": 20 * 1024 * 1024},
    "image/jpeg":       {"max_size_bytes": 20 * 1024 * 1024},
    "image/png":        {"max_size_bytes": 20 * 1024 * 1024},
    "audio/mpeg":       {"max_size_bytes": 100 * 1024 * 1024},
    "audio/mp4":        {"max_size_bytes": 100 * 1024 * 1024},
    "audio/x-m4a":      {"max_size_bytes": 100 * 1024 * 1024},
    "audio/wav":        {"max_size_bytes": 100 * 1024 * 1024},
}

# Dev mode flag — same source as auth.py; default false so an unset
# env var in a deployed environment never silently skips auth.
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

# temp/ sits alongside this file in file-upload/
TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)


@upload_bp.route("", methods=["POST"])
def upload_file():
    """
    Authenticated file upload endpoint.

    DEV_MODE=true  → stores file in temp/, skips Firebase entirely
    DEV_MODE=false → uploads to Firebase Storage, creates Firestore document

    Expects:
        - Authorization: Bearer <token> header (skipped in DEV_MODE)
        - multipart/form-data with a 'file' field

    Returns:
        201 with file info on success.
        4xx with { "error": "..." } on failure.
    """

    # 1. Verify Firebase token — returns (uid, None) or (None, error)
    uid, auth_error = verify_firebase_token(request)
    if auth_error:
        return jsonify({"error": auth_error}), 401

    # 2. Check a file was actually included in the request
    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    # 3. Validate MIME type
    type_entry = ALLOWED_MIME_TYPES.get(file.mimetype)
    if type_entry is None:
        return jsonify({
            "error": f"Unsupported file type '{file.mimetype}'."
        }), 415

    # 4. Validate file size against this type's own limit
    file_bytes = file.read()
    max_size_bytes = type_entry["max_size_bytes"]
    if len(file_bytes) > max_size_bytes:
        max_size_mb = max_size_bytes // (1024 * 1024)
        return jsonify({
            "error": f"File exceeds the {max_size_mb}MB size limit."
        }), 413

    # 5. Store the file
    if DEV_MODE:
        # ── Dev path: write to local temp/ folder ─────────────────────────
        # Firebase is not needed — allows full testing without credentials
        safe_filename = f"{uid}_{uuid.uuid4().hex}_{file.filename}"
        temp_path = os.path.join(TEMP_DIR, safe_filename)

        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        print(f"[UPLOAD] Stored temp file for UID {uid}: {safe_filename}")

        return jsonify({
            "message": "File received and stored for processing.",
            "filename": file.filename,
            "mimetype": file.mimetype,
            "size_bytes": len(file_bytes),
            "user_uid": uid,
            "temp_path": temp_path,
            "doc_id": None,  # no Firestore doc in dev mode
        }), 201
    else:
        # ── Production path: delegate to firebase_storage.py ───────────────
        from .firebase_storage import (
            upload_file_to_storage,
            FirebaseStorageError,
            mark_document_error,
        )

        try:
            result = upload_file_to_storage(
                file_bytes=file_bytes,
                uid=uid,
                original_filename=file.filename,
                mimetype=file.mimetype,
            )
        except FirebaseStorageError as exc:
            return jsonify({"error": str(exc)}), 500

        # Enqueue processing instead of running it on borrowed post-response
        # CPU (F2). Bytes + Firestore doc are already durable, so an
        # enqueue failure must NOT fail the upload — it becomes an "error"
        # status that DE-7's backfill CLI can redrive.
        processing_enqueued = True
        try:
            from .tasks import enqueue_process_document
            enqueue_process_document(result["doc_id"], "upload")
        except Exception as exc:
            processing_enqueued = False
            mark_document_error(
                result["doc_id"], "task",
                f"Enqueue failed: {exc}",
            )
            print(f"[UPLOAD] Enqueue failed: {exc}")

        return jsonify({
            "message": (
                "File uploaded. Processing queued."
                if processing_enqueued
                else "File uploaded, but processing could not be queued."
            ),
            "filename": file.filename,
            "mimetype": file.mimetype,
            "size_bytes": len(file_bytes),
            "user_uid": uid,
            "doc_id": result["doc_id"],
            "storage_path": result["storage_path"],
            "processing_enqueued": processing_enqueued,
        }), 201


@ocr_bp.route("/<doc_id>/text", methods=["PUT"])
def save_ocr_text(doc_id):
    """
    Saves the user-confirmed OCR text back to the Firestore document.

    Called by the OcrTextReview component after the user edits and confirms
    the extracted text. Overwrites the ocr_text field in Firestore.

    Expects:
        - Authorization: Bearer <token> header (skipped in DEV_MODE)
        - JSON body: { "text": "<confirmed text>" }

    Returns:
        200 on success, 4xx on failure.
    """
    uid, auth_error = verify_firebase_token(request)
    if auth_error:
        return jsonify({"error": auth_error}), 401

    body = request.get_json(silent=True)
    if not body or "text" not in body:
        return jsonify({"error": "Request body must include a 'text' field."}), 400

    from .firebase_storage import store_ocr_text, mark_document_error
    # Write BEFORE enqueue — the task handler reads ocr_text back from
    # Firestore, so a redelivered task always sees this exact confirmation.
    store_ocr_text(doc_id, body["text"])

    from .tasks import enqueue_process_document
    try:
        enqueue_process_document(doc_id, "ocr_confirm")
    except Exception as exc:
        # Unlike upload, this should surface: the user is waiting on this
        # click. Their edit IS saved — re-clicking confirm safely
        # re-saves + re-enqueues, since processing is now idempotent.
        mark_document_error(doc_id, "task", f"Enqueue failed: {exc}")
        return jsonify({
            "error": "OCR text saved, but processing could not be queued."
        }), 502

    return jsonify({"message": "OCR text saved. Processing queued."}), 200