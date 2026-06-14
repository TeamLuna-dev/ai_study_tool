import traceback

from flask import Blueprint, request, jsonify
from firebase_admin import auth as firebase_auth

from models.room_models import (
    CreateRoomRequest,
    JoinRoomRequest,
    RoomResponse,
    JoinRoomResponse,
    GetRoomResponse,
    MembersListResponse,
    RemoveMemberResponse,
    DeleteRoomResponse
)
from . import room_service

rooms_bp = Blueprint("rooms_bp", __name__)


def get_current_uid():
    """Verifies Firebase token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None, ("Missing or malformed Authorization header", 401)

    token = auth_header.split("Bearer ")[1].strip()

    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"], None
    except Exception as exc:
        return None, (f"Invalid or expired token: {exc}", 401)


@rooms_bp.post("/")
def create_room():
    uid, error = get_current_uid()
    if error:
        return jsonify({"error": error[0]}), error[1]

    data = request.json
    body = CreateRoomRequest(**data)

    try:
        room = room_service.create_room(body.name, body.description, uid)
        return jsonify(room), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@rooms_bp.post("/join")
def join_room():
    uid, error = get_current_uid()
    if error:
        return jsonify({"error": error[0]}), error[1]

    data = request.json
    body = JoinRoomRequest(**data)

    if body.userId and body.userId != uid:
        return jsonify({"error": "userId must match authenticated user"}), 403

    try:
        result = room_service.join_room(body.invite_code, uid, body.display_name)
        return jsonify(result), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@rooms_bp.get("/<room_id>")
def get_room(room_id):
    uid, error = get_current_uid()
    if error:
        return jsonify({"error": error[0]}), error[1]

    try:
        room = room_service.get_room(room_id, uid)
        return jsonify(room), 200
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@rooms_bp.get("/<room_id>/members")
def get_members(room_id):
    uid, error = get_current_uid()
    if error:
        return jsonify({"error": error[0]}), error[1]

    try:
        members = room_service.get_members(room_id, uid)
        return jsonify({"members": members}), 200
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@rooms_bp.delete("/<room_id>/members/<target_uid>")
def remove_member(room_id, target_uid):
    uid, error = get_current_uid()
    if error:
        return jsonify({"error": error[0]}), error[1]

    try:
        result = room_service.remove_member(room_id, target_uid, uid)
        return jsonify(result), 200
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@rooms_bp.delete("/<room_id>")
def delete_room(room_id):
    uid, error = get_current_uid()
    if error:
        return jsonify({"error": error[0]}), error[1]

    try:
        result = room_service.delete_room(room_id, uid)
        return jsonify(result), 200
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@rooms_bp.post("/<room_id>/summarize")
def summarize_room(room_id):
    uid, error = get_current_uid()
    if error:
        return jsonify({"error": error[0]}), error[1]

    try:
        result = room_service.generate_room_summary(room_id, uid)
        return jsonify(result), 200
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        traceback.print_exc()
        return jsonify({"error": str(exc)}), 500


@rooms_bp.get("/health")
def health():
    return jsonify({"rooms": "ok"}), 200