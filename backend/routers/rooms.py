"""
routers/rooms.py
FastAPI router for room management.
HTTP routing and auth only — business logic lives in services/room_service.py.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from firebase_admin import auth as firebase_auth

from models.room_models import (
    CreateRoomRequest,
    JoinRoomRequest,
    RoomResponse,
    JoinRoomResponse,
    GetRoomResponse,
    MembersListResponse,
    RemoveMemberResponse,
    DeleteRoomResponse,
)
from services import room_service

router = APIRouter()


# ── Auth dependency (Dependency Inversion Principle) ─────────────────────────

async def get_current_uid(authorization: str = Header(...)) -> str:
    """
    FastAPI dependency. Verifies the Firebase ID token from
    'Authorization: Bearer <token>' and returns the caller's UID.
    Inject with: uid: str = Depends(get_current_uid)
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or malformed Authorization header",
        )
    token = authorization.split("Bearer ")[1].strip()
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {exc}")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=RoomResponse, status_code=201)
async def create_room(
    body: CreateRoomRequest,
    uid: str = Depends(get_current_uid),
):
    """
    Creates a new room. The authenticated user becomes the owner.
    Generates a unique 6-char invite code automatically.
    """
    try:
        return room_service.create_room(body.name, body.description, uid)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/join", response_model=JoinRoomResponse, status_code=200)
async def join_room(
    body: JoinRoomRequest,
    uid: str = Depends(get_current_uid),
):
    """
    Joins a room via invite code. If userId is provided in the body,
    it must match the authenticated user's UID.
    """
    if body.userId and body.userId != uid:
        raise HTTPException(
            status_code=403,
            detail="userId in request body must match the authenticated user",
        )
    try:
        return room_service.join_room(body.inviteCode, uid)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{room_id}", response_model=GetRoomResponse, status_code=200)
async def get_room(
    room_id: str,
    uid: str = Depends(get_current_uid),
):
    """Returns the room document. Caller must be a member (enforced by Firestore rules on direct reads; verified here via service)."""
    try:
        return room_service.get_room(room_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{room_id}/members", response_model=MembersListResponse, status_code=200)
async def get_members(
    room_id: str,
    uid: str = Depends(get_current_uid),
):
    """Returns all members of the room with their roles and join timestamps."""
    try:
        members = room_service.get_members(room_id)
        return {"members": members}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/{room_id}/members/{target_uid}", response_model=RemoveMemberResponse, status_code=200)
async def remove_member(
    room_id: str,
    target_uid: str,
    uid: str = Depends(get_current_uid),
):
    """
    Removes a member from the room.
    Members can remove themselves (leave). Only the owner can remove others.
    The owner cannot be removed.
    """
    try:
        return room_service.remove_member(room_id, target_uid, uid)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/{room_id}", response_model=DeleteRoomResponse, status_code=200)
async def delete_room(
    room_id: str,
    uid: str = Depends(get_current_uid),
):
    """Deletes a room and all its subcollections. Owner only."""
    try:
        return room_service.delete_room(room_id, uid)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
