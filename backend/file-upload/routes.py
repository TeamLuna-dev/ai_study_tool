"""
routes.py
HTTP concerns only — validates, associates with user, stores temporarily.

This file only handles HTTP request/response concerns.
All Firebase operations are delegated to firebase_storage.py

  - In DEV_MODE: still uses temp/ folder (no Firebase needed)
  - In production: uploads to Firebase Storage + creates Firestore document
"""

import os
import uuid
from flask import Blueprint, jsonify, request
from auth import verify_firebase_token

upload_bp = Blueprint("upload", __name__)

# ---------------------------------------------------------------------------
# Validation constants
# Add new types here without changing any route logic
# ---------------------------------------------------------------------------
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}

MAX_FILE_SIZE_MB    = 20
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

# Dev mode flag — same source as auth.py
DEV_MODE = os.getenv("DEV_MODE", "true").lower() == "true"

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
    if file.mimetype not in ALLOWED_MIME_TYPES:
        return jsonify({
            "error": (
                f"Unsupported file type '{file.mimetype}'. "
                f"Allowed: PDF, JPG, PNG."
            )
        }), 415

    # 4. Validate file size
    file_bytes = file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        return jsonify({
            "error": f"File exceeds the {MAX_FILE_SIZE_MB}MB size limit."
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
        from firebase_storage import upload_file_to_storage, FirebaseStorageError

        try:
            result = upload_file_to_storage(
                file_bytes=file_bytes,
                uid=uid,
                original_filename=file.filename,
                mimetype=file.mimetype,
            )
        except FirebaseStorageError as exc:
            return jsonify({"error": str(exc)}), 500
        
        return jsonify({
            "message": "File uploaded to Firebase and Firestore document created.",
            "filename": file.filename,
            "mimetype": file.mimetype,
            "size_bytes": len(file_bytes),
            "user_uid": uid,
            "doc_id": result["doc_id"],
            "storage_url": result["storage_url"],
            "storage_path": result["storage_path"],
        }), 201