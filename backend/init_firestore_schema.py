"""
Firestore schema initialization script.

Single Responsibility: create one sample document per top-level collection
(and one sample document per subcollection) so every teammate has a concrete
reference to work against.

Rules:
- Imports db from firebase_admin_config — never re-initializes Firebase.
- Does NOT overwrite existing documents (uses create(), not set()).
- Contains no business logic.

Run from the project root:
    python3 backend/init_firestore_schema.py
"""

import sys
from datetime import datetime, timezone

# ── import the already-initialized Firestore client ──────────────────────────
from firebase_admin_config import db
from google.cloud.firestore_v1 import SERVER_TIMESTAMP


# ── helpers ──────────────────────────────────────────────────────────────────

def _create_if_absent(ref, data: dict, label: str) -> None:
    """Write `data` to `ref` only when the document does not already exist."""
    if ref.get().exists:
        print(f"  [SKIP]   {label} already exists — not overwriting.")
    else:
        ref.set(data)
        print(f"  [CREATE] {label}")


# ── sample IDs (clearly fake, easy for teammates to grep / delete) ────────────

SAMPLE_USER_ID     = "sample-user-001"
SAMPLE_DOC_ID      = "sample-doc-001"
SAMPLE_ROOM_ID     = "sample-room-001"
SAMPLE_SESSION_ID  = "sample-session-001"
SAMPLE_MEMBER_ID   = "sample-user-001"          # same as user for simplicity
SAMPLE_SHARED_DOC  = "sample-shared-doc-001"

NOW = datetime.now(timezone.utc)


# ── collection initializers ───────────────────────────────────────────────────

def init_users() -> None:
    """users/{uid}"""
    print("\n[Collection] users")
    ref = db.collection("users").document(SAMPLE_USER_ID)
    _create_if_absent(ref, {
        "displayName": "Sample User",
        "email":       "sample-user@example.com",
        "photoURL":    "https://example.com/sample-avatar.png",
        "createdAt":   SERVER_TIMESTAMP,
        "roomIds":     [SAMPLE_ROOM_ID],
    }, f"users/{SAMPLE_USER_ID}")


def init_documents() -> None:
    """documents/{docId}"""
    print("\n[Collection] documents")
    ref = db.collection("documents").document(SAMPLE_DOC_ID)
    _create_if_absent(ref, {
        "ownerId":     SAMPLE_USER_ID,
        "fileName":    "sample-document.pdf",
        "fileType":    "pdf",
        "fileSize":    102400,                   # bytes (100 KB placeholder)
        "storageUrl":  "https://storage.example.com/sample-document.pdf",
        "storagePath": "documents/sample-user-001/sample-document.pdf",
        "uploadedAt":  SERVER_TIMESTAMP,
        "status":      "ready",
        "vectorIds":   ["vec-001", "vec-002"],
        "roomId":      None,
    }, f"documents/{SAMPLE_DOC_ID}")


def init_rooms() -> None:
    """
    rooms/{roomId}
    rooms/{roomId}/members/{userId}
    rooms/{roomId}/shared-documents/{docId}
    """
    print("\n[Collection] rooms")
    room_ref = db.collection("rooms").document(SAMPLE_ROOM_ID)
    _create_if_absent(room_ref, {
        "name":        "Sample Study Room",
        "description": "A placeholder room for schema reference.",
        "creatorId":   SAMPLE_USER_ID,
        "inviteCode":  "SAMPLE01",
        "createdAt":   SERVER_TIMESTAMP,
    }, f"rooms/{SAMPLE_ROOM_ID}")

    # subcollection: members
    print("\n  [Subcollection] rooms/{roomId}/members")
    member_ref = room_ref.collection("members").document(SAMPLE_MEMBER_ID)
    _create_if_absent(member_ref, {
        "role":     "owner",
        "joinedAt": SERVER_TIMESTAMP,
    }, f"rooms/{SAMPLE_ROOM_ID}/members/{SAMPLE_MEMBER_ID}")

    # subcollection: shared-documents
    print("\n  [Subcollection] rooms/{roomId}/shared-documents")
    shared_ref = room_ref.collection("shared-documents").document(SAMPLE_SHARED_DOC)
    _create_if_absent(shared_ref, {
        "fileName":     "sample-shared.pdf",
        "uploaderId":   SAMPLE_USER_ID,
        "uploaderName": "Sample User",
        "uploadedAt":   SERVER_TIMESTAMP,
        "storageUrl":   "https://storage.example.com/sample-shared.pdf",
        "status":       "ready",
    }, f"rooms/{SAMPLE_ROOM_ID}/shared-documents/{SAMPLE_SHARED_DOC}")


def init_sessions() -> None:
    """sessions/{sessionId}"""
    print("\n[Collection] sessions")
    ref = db.collection("sessions").document(SAMPLE_SESSION_ID)
    _create_if_absent(ref, {
        "userId":      SAMPLE_USER_ID,
        "documentIds": [SAMPLE_DOC_ID],
        "type":        "quiz",
        "createdAt":   SERVER_TIMESTAMP,
        "summary":     "Sample session — placeholder for schema reference.",
        "score":       None,
        "weakTopics":  ["sample-topic-a", "sample-topic-b"],
    }, f"sessions/{SAMPLE_SESSION_ID}")


# ── entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    print("Initializing Firestore schema with sample documents...")
    print("(Existing documents will not be overwritten.)\n")

    init_users()
    init_documents()
    init_rooms()
    init_sessions()

    print("\nSchema initialization complete.")


if __name__ == "__main__":
    main()
