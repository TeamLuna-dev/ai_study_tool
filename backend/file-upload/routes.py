"""
routes.py
HTTP concerns only — validates, associates with user, stores temporarily.

  - Receive file via POST
  - Validate MIME type and size
  - Associate with Firebase UID
  - Temporarily store for processing
"""

import os
import uuid
from flask import Blueprint, jsonify, request
from auth import verify_firebase_token       # flat import — no subfolder

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

# temp/ sits alongside this file in file-upload/
TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)


@upload_bp.route("/", methods=["POST"])
def upload_file():
    """
    Receives an uploaded file, validates it, associates it with the
    authenticated user, and temporarily stores it for downstream processing.

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

    # 5. Temporarily store the file for processing in Tasks 3 + 4.
    # Filename format: <uid>_<uuid>_<originalname>
    # The UID prefix associates the file with the authenticated user.
    # The UUID prevents collisions if the same file is uploaded twice.
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
    }), 201