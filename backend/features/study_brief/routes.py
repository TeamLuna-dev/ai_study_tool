"""
routes.py — Study Brief Blueprint
Single Responsibility: HTTP concerns only.
Firestore + OpenAI logic lives in study_brief_service.py.
"""

from flask import Blueprint, jsonify, request
from firebase_admin import auth as firebase_auth

from . import study_brief_service

study_brief_bp = Blueprint("study_brief_bp", __name__)


def _get_current_uid():
    """Verifies Firebase Bearer token from the Authorization header."""
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None, ("Missing or malformed Authorization header", 401)

    token = auth_header.split("Bearer ")[1].strip()

    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"], None
    except Exception as exc:
        return None, (f"Invalid or expired token: {exc}", 401)


@study_brief_bp.get("/")
def get_study_brief():
    uid, error = _get_current_uid()
    if error:
        return jsonify({"error": error[0]}), error[1]

    result = study_brief_service.generate_study_brief(uid)
    return jsonify(result), 200
