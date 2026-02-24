"""
auth.py
Handles only Firebase token verification.

DEV_MODE bypasses real Firebase verification so the endpoint can be built
and tested without a Firebase project set up. When Firebase is ready:
  1. Set DEV_MODE=false in .env
  2. Set GOOGLE_APPLICATION_CREDENTIALS to your service account path
  3. Nothing else needs to change
"""

import os
import firebase_admin
from firebase_admin import auth

# ---------------------------------------------------------------------------
# Dev mode — reads from .env via python-dotenv (loaded in main.py)
# DEV_MODE=true  → skips Firebase, returns a hardcoded test UID
# DEV_MODE=false → verifies the real Firebase token
# ---------------------------------------------------------------------------
DEV_MODE = os.getenv("DEV_MODE", "true").lower() == "true"
DEV_UID  = os.getenv("DEV_UID", "test-user-123")

# Only initialise Firebase when not in dev mode
if not DEV_MODE:
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app()


def verify_firebase_token(request):
    """
    Extracts and verifies the Firebase ID token from the
    Authorization: Bearer <token> header.

    In DEV_MODE, skips verification entirely and returns DEV_UID.

    Args:
        request: Flask request object.

    Returns:
        (uid, None)            on success.
        (None, error_message)  on failure.
    """
    # ── Dev mode bypass ───────────────────────────────────────────────────
    if DEV_MODE:
        print(f"[DEV_MODE] Skipping Firebase auth — using UID: {DEV_UID}")
        return DEV_UID, None

    # ── Production: verify real token ────────────────────────────────────
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None, "Missing or malformed Authorization header."

    token = auth_header.split("Bearer ")[1].strip()

    try:
        decoded = auth.verify_id_token(token)
        return decoded["uid"], None
    except Exception as exc:
        return None, f"Invalid or expired token: {exc}"