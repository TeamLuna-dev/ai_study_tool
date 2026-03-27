"""
room_service.py
Firestore operations for room management.
HTTP concerns live in routers/rooms.py; this module only talks to Firestore.
"""

import random
import string
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set

from firebase_admin import auth as firebase_auth
from firebase_admin import firestore as firebase_firestore

from security.firebase_admin_config import db


# ── Permission system (Open/Closed Principle) ────────────────────────────────
# To add a new role (e.g. "moderator"), extend ROLE_PERMISSIONS.
# Never modify has_permission() — the checking logic never changes.

ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "owner":  {"can_delete_room", "can_remove_members", "can_upload", "can_read"},
    "member": {"can_upload", "can_read"},
}


def has_permission(role: str, action: str) -> bool:
    """Returns True if the role is allowed to perform the given action."""
    return action in ROLE_PERMISSIONS.get(role, set())


# ── Internal helpers ──────────────────────────────────────────────────────────

def _generate_invite_code(length: int = 6) -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


def _unique_invite_code() -> str:
    """Generates a 6-char invite code not already used by any existing room."""
    rooms_ref = db.collection("rooms")
    for _ in range(10):
        code = _generate_invite_code()
        existing = rooms_ref.where("inviteCode", "==", code).limit(1).get()
        if not existing:
            return code
    raise RuntimeError("Failed to generate a unique invite code after 10 attempts")


def _get_member_role(room_id: str, uid: str) -> Optional[str]:
    """Returns the uid's role in the room, or None if not a member."""
    doc = (
        db.collection("rooms")
        .document(room_id)
        .collection("members")
        .document(uid)
        .get()
    )
    return doc.to_dict().get("role") if doc.exists else None


def _ts(value) -> str:
    """Converts a datetime (Firestore or stdlib) to an ISO-8601 string."""
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


# ── Public service functions ──────────────────────────────────────────────────

def create_room(name: str, description: str, creator_uid: str) -> dict:
    """
    Creates a new room document and registers the creator as owner
    in the members subcollection.
    """
    room_ref = db.collection("rooms").document()
    invite_code = _unique_invite_code()
    now = datetime.now(timezone.utc)

    room_ref.set({
        "name":        name,
        "description": description,
        "creatorId":   creator_uid,
        "createdAt":   now,
        "inviteCode":  invite_code,
        # Denormalized array so the frontend can run an array-contains query
        # without a subcollection lookup. Keep in sync with the members subcollection.
        "members": [creator_uid],
    })

    try:
        user_record = firebase_auth.get_user(creator_uid)
        display_name = user_record.display_name or user_record.email or creator_uid
    except Exception:
        display_name = creator_uid  

    room_ref.collection("members").document(creator_uid).set({
        "role":        "owner",
        "joinedAt":    now,
        "displayName": display_name,
    })

    return {
        "roomId":      room_ref.id,
        "name":        name,
        "description": description,
        "creatorId":   creator_uid,
        "createdAt":   now.isoformat(),
        "inviteCode":  invite_code,
    }


def join_room(invite_code: str, user_uid: str) -> dict:
    """
    Finds a room by invite code and adds the user as a member.
    Raises ValueError if the code is invalid or the user is already a member.
    """
    matches = db.collection("rooms").where("inviteCode", "==", invite_code).limit(1).get()
    if not matches:
        raise ValueError("No room found for that invite code")

    room_doc = matches[0]
    room_id = room_doc.id

    existing_role = _get_member_role(room_id, user_uid)
    if existing_role:
        raise ValueError(f"Already a member of this room with role: {existing_role}")

    now = datetime.now(timezone.utc)
    try:
        user_record = firebase_auth.get_user(user_uid)
        display_name = user_record.display_name or user_record.email or user_uid
    except Exception:
        display_name = user_uid

    room_doc.reference.collection("members").document(user_uid).set({
        "role":        "member",
        "joinedAt":    now,
        "displayName": display_name,
    })

    # Keep the denormalized members array in sync so Firestore security rules
    # (which use array-contains queries) and room-read checks stay valid.
    room_doc.reference.update({
        "members": firebase_firestore.ArrayUnion([user_uid])
    })

    return {
        "roomId":   room_id,
        "userId":   user_uid,
        "role":     "member",
        "joinedAt": now.isoformat(),
    }

def get_room(room_id: str) -> dict:
    """Returns the room document fields."""
    room_ref = db.collection("rooms").document(room_id)
    doc = room_ref.get()
    if not doc.exists:
        raise ValueError("Room not found")
    data = doc.to_dict()
    return {
        "roomId":      doc.id,
        "name":        data.get("name"),
        "description": data.get("description", ""),
        "inviteCode":  data.get("inviteCode"),
        "creatorId":   data.get("creatorId"),
        "createdAt":   _ts(data.get("createdAt")),
    }

def get_members(room_id: str) -> List[dict]:
    """Returns all members of the room with their roles and join timestamps."""
    room_ref = db.collection("rooms").document(room_id)
    if not room_ref.get().exists:
        raise ValueError("Room not found")

    result = []
    for doc in room_ref.collection("members").get():
        data = doc.to_dict()
        result.append({
            "uid":         doc.id,
            "role":        data.get("role"),
            "joinedAt":    _ts(data.get("joinedAt")),
            "displayName": data.get("displayName", doc.id),
        })
    return result


def remove_member(room_id: str, target_uid: str, requesting_uid: str) -> dict:
    """
    Removes a member from the room.
    - The owner cannot be removed (the room must be deleted instead).
    - A member may remove themselves (leave).
    - Only the owner can remove other members.
    """
    room_ref = db.collection("rooms").document(room_id)
    if not room_ref.get().exists:
        raise ValueError("Room not found")

    target_role = _get_member_role(room_id, target_uid)
    if target_role is None:
        raise ValueError("Target user is not a member of this room")

    if target_role == "owner":
        raise PermissionError("The room owner cannot be removed. Delete the room instead.")

    is_self = requesting_uid == target_uid
    requesting_role = _get_member_role(room_id, requesting_uid)
    is_owner = requesting_role == "owner"

    if not is_self and not has_permission(requesting_role or "", "can_remove_members"):
        raise PermissionError("Only the room owner can remove other members")

    room_ref.collection("members").document(target_uid).delete()
    return {"removed": target_uid, "roomId": room_id}


def delete_room(room_id: str, requesting_uid: str) -> dict:
    """
    Deletes a room and all its subcollections (owner only).
    Firestore does not cascade-delete subcollections, so we delete them explicitly.
    """
    room_ref = db.collection("rooms").document(room_id)
    if not room_ref.get().exists:
        raise ValueError("Room not found")

    requesting_role = _get_member_role(room_id, requesting_uid)
    if not has_permission(requesting_role or "", "can_delete_room"):
        raise PermissionError("Only the room owner can delete the room")

    for doc in room_ref.collection("members").list_documents():
        doc.delete()

    for doc in room_ref.collection("shared-documents").list_documents():
        doc.delete()

    room_ref.delete()
    return {"deleted": room_id}
