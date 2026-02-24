# AiTutorProject — Firestore Database Schema

> **Single source of truth for the database structure.**
> Every teammate should read this before writing any code that touches Firestore.
> Initialized by `backend/init_firestore_schema.py`. Sample documents use the prefix `sample-*` and can be safely deleted.

---

## Table of Contents

1. [Collection Overview](#collection-overview)
2. [users](#1-users)
3. [documents](#2-documents)
4. [rooms](#3-rooms)
   - [rooms/members (subcollection)](#subcollection-roomsroomiidmembers)
   - [rooms/shared-documents (subcollection)](#subcollection-roomsroomiidshared-documents)
5. [sessions](#4-sessions)
6. [Collection Relationships](#collection-relationships)

---

## Collection Overview

| Collection | Description |
|---|---|
| `users` | One document per registered user |
| `documents` | Each uploaded file (PDF, PPTX, DOCX, image) |
| `rooms` | Collaborative study rooms |
| `rooms/{roomId}/members` | Subcollection — who belongs to a room and their role |
| `rooms/{roomId}/shared-documents` | Subcollection — documents shared into a room |
| `sessions` | A single Q&A, quiz, or summary session |

---

## 1. `users`

**Path:** `users/{uid}`
**Purpose:** Stores profile information for every registered user. `uid` matches the Firebase Auth UID.

| Field | Type | Description |
|---|---|---|
| `displayName` | `string` | User's display name from Firebase Auth or profile setup |
| `email` | `string` | User's email address |
| `photoURL` | `string` | URL to the user's profile photo |
| `createdAt` | `timestamp` | When the account was first created (server timestamp) |
| `roomIds` | `string[]` | List of `roomId` values the user belongs to |

---

## 2. `documents`

**Path:** `documents/{docId}`
**Purpose:** Tracks every file a user uploads. After upload, the backend processes the file (chunking, embedding) and updates `status` and `vectorIds`.

| Field | Type | Description |
|---|---|---|
| `ownerId` | `string` | `uid` of the user who uploaded the file |
| `fileName` | `string` | Original file name as uploaded (e.g. `lecture-notes.pdf`) |
| `fileType` | `string` | One of: `pdf`, `pptx`, `docx`, `jpg`, `png` |
| `fileSize` | `number` | File size in bytes |
| `storageUrl` | `string` | Public (or signed) download URL from Firebase Storage |
| `storagePath` | `string` | Internal path in the Storage bucket (e.g. `documents/{uid}/lecture-notes.pdf`) |
| `uploadedAt` | `timestamp` | When the file was uploaded (server timestamp) |
| `status` | `string` | Processing state: `processing` → `ready` or `error` |
| `vectorIds` | `string[]` | IDs of the Qdrant vectors generated from this document |
| `roomId` | `string \| null` | Set to a `roomId` when shared into a room; `null` if private |

---

## 3. `rooms`

**Path:** `rooms/{roomId}`
**Purpose:** Represents a collaborative study room. Members share a document pool and a common AI tutor context.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Display name of the room |
| `description` | `string` | Short description of the room's purpose |
| `creatorId` | `string` | `uid` of the user who created the room |
| `inviteCode` | `string` | Short alphanumeric code used to join the room |
| `createdAt` | `timestamp` | When the room was created (server timestamp) |

### Subcollection: `rooms/{roomId}/members`

**Path:** `rooms/{roomId}/members/{userId}`
**Purpose:** Tracks which users belong to a room and their permission level.

| Field | Type | Description |
|---|---|---|
| `role` | `string` | Either `owner` (creator, can manage room) or `member` |
| `joinedAt` | `timestamp` | When the user joined the room (server timestamp) |

### Subcollection: `rooms/{roomId}/shared-documents`

**Path:** `rooms/{roomId}/shared-documents/{docId}`
**Purpose:** A lightweight record of each document shared into the room. The full document data lives in the top-level `documents` collection; this subcollection holds only what the room UI needs.

| Field | Type | Description |
|---|---|---|
| `fileName` | `string` | Original file name |
| `uploaderId` | `string` | `uid` of the user who shared the document |
| `uploaderName` | `string` | Display name of the uploader (denormalized for quick reads) |
| `uploadedAt` | `timestamp` | When the document was shared into the room (server timestamp) |
| `storageUrl` | `string` | Download URL from Firebase Storage |
| `status` | `string` | Processing state: `processing` → `ready` or `error` |

---

## 4. `sessions`

**Path:** `sessions/{sessionId}`
**Purpose:** Records a single AI interaction — a Q&A conversation, a quiz attempt, or a document summary. Used for history, analytics, and identifying weak topics.

| Field | Type | Description |
|---|---|---|
| `userId` | `string` | `uid` of the user who ran the session |
| `documentIds` | `string[]` | List of `docId` values the session was based on |
| `type` | `string` | One of: `qa` (Q&A chat), `quiz` (quiz attempt), `summary` |
| `createdAt` | `timestamp` | When the session started (server timestamp) |
| `summary` | `string` | AI-generated summary or transcript of the session |
| `score` | `number \| null` | Quiz score (0–100); `null` for `qa` and `summary` sessions |
| `weakTopics` | `string[]` | Topics the AI identified as needing more review |

---

## Collection Relationships

```
users/{uid}
│
│  users.roomIds[]  ──────────────────────────────────────┐
│                                                          │
├── documents/{docId}                               rooms/{roomId}
│     ownerId → users/{uid}                               │
│     roomId  ─────────────────────────────────────── rooms/{roomId}
│     vectorIds[] → Qdrant vectors                        │
│                                                  ┌──────┴──────────────────┐
└── sessions/{sessionId}               members/{userId}   shared-documents/{docId}
      userId      → users/{uid}          (role, joinedAt)   (fileName, status …)
      documentIds → documents/{docId}[]
```

### How the collections connect

| Relationship | How it works |
|---|---|
| User → Rooms | `users.roomIds[]` holds the IDs of every room the user belongs to. The `rooms/{roomId}/members` subcollection holds the same link from the room's perspective (bidirectional for efficient reads in both directions). |
| User → Documents | `documents.ownerId` points back to the user who uploaded the file. |
| Document → Room | When a document is shared into a room, `documents.roomId` is set to that room's ID **and** a lightweight copy is written to `rooms/{roomId}/shared-documents`. |
| Document → Qdrant | `documents.vectorIds[]` stores the chunk IDs in Qdrant so the backend can retrieve context for the AI tutor without scanning all vectors. |
| Session → User | `sessions.userId` links a session back to its owner for history and analytics queries. |
| Session → Documents | `sessions.documentIds[]` records which documents were active when the session ran, enabling reproducible AI responses. |

---

## Notes for Teammates

- **Sample data** — All documents created by `init_firestore_schema.py` use IDs starting with `sample-`. Delete them once you have real data or write a cleanup script.
- **Timestamps** — Always use `SERVER_TIMESTAMP` from the Admin SDK (or `serverTimestamp()` from the client SDK) so timestamps are authoritative and timezone-safe.
- **Status lifecycle** — Both `documents.status` and `shared-documents.status` follow: `processing` → `ready` (or `error`). Never query a document for AI features until `status === "ready"`.
- **Qdrant IDs** — `vectorIds` is managed entirely by the backend PDF-processing pipeline. Frontend code should never read or write this field directly.
