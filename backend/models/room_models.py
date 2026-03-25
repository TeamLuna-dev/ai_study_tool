"""
room_models.py
Pydantic request/response models for room endpoints.
Each model contains only the fields relevant to its specific endpoint (ISP).
"""

from pydantic import BaseModel
from typing import Optional


# ── Request models ────────────────────────────────────────────────────────────

class CreateRoomRequest(BaseModel):
    name: str
    description: str
    # creatorId is NOT here — it comes from the verified Firebase token


class JoinRoomRequest(BaseModel):
    inviteCode: str
    userId: Optional[str] = None  # for client reference; authoritative UID comes from token


# ── Response models ───────────────────────────────────────────────────────────

class RoomResponse(BaseModel):
    roomId: str
    name: str
    description: str
    creatorId: str
    createdAt: str
    inviteCode: str


class JoinRoomResponse(BaseModel):
    roomId: str
    userId: str
    role: str
    joinedAt: str


class GetRoomResponse(BaseModel):
    roomId: str
    name: str
    description: str
    inviteCode: str
    creatorId: str
    createdAt: str


class MemberResponse(BaseModel):
    uid: str
    role: str
    joinedAt: str
    displayName: str


class MembersListResponse(BaseModel):
    members: list[MemberResponse]


class RemoveMemberResponse(BaseModel):
    removed: str
    roomId: str


class DeleteRoomResponse(BaseModel):
    deleted: str
