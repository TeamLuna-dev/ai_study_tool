/**
 * roomService.js
 * Firestore room reads and backend room writes.
 * Components and hooks never import from Firebase directly (DIP).
 */

import {
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../config/firebase";

const ACCEPTED_MIME_TYPES = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/png": "png",
  "image/jpeg": "jpg",
};

const MAX_ROOM_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * Subscribes to all rooms where `uid` is present in the top-level `members`
 * array. Returns the Firestore unsubscribe function.
 */
export function getUserRooms(uid, onNext, onError) {
  const q = query(
    collection(db, "rooms"),
    where("members", "array-contains", uid)
  );
  return onSnapshot(q, onNext, onError);
}

/**
 * Subscribes to a single room document.
 */
export function subscribeToRoom(roomId, onNext, onError) {
  return onSnapshot(doc(db, "rooms", roomId), onNext, onError);
}

/**
 * Subscribes to the members subcollection of a room.
 */
export function subscribeToRoomMembers(roomId, onNext, onError) {
  return onSnapshot(collection(db, "rooms", roomId, "members"), onNext, onError);
}

/**
 * Subscribes to the shared-documents subcollection of a room.
 */
export function subscribeToSharedDocuments(roomId, onNext, onError) {
  return onSnapshot(collection(db, "rooms", roomId, "shared-documents"), onNext, onError);
}

/**
 * Subscribes to the messages subcollection of a room, ordered by createdAt.
 */
export function subscribeToMessages(roomId, onNext, onError) {
  const q = query(
    collection(db, "rooms", roomId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, onNext, onError);
}

/**
 * Sends a chat message to a room.
 * @param {string} roomId
 * @param {{ text: string, uid: string, displayName: string }} message
 */
export async function sendMessage(roomId, { text, uid, displayName }) {
  await addDoc(collection(db, "rooms", roomId, "messages"), {
    text,
    uid,
    displayName,
    createdAt: serverTimestamp(),
  });
}

/**
 * Uploads a file into a room's shared-documents subcollection.
 * Storage path: rooms/{roomId}/documents/{timestamp}_{fileName}
 * Firestore:    rooms/{roomId}/shared-documents/{docId}
 *
 * @param {string} roomId
 * @param {File}   file
 * @param {{ uid: string, displayName: string | null }} user
 * @returns {Promise<{ id: string, storageUrl: string }>}
 */
export async function uploadRoomDocument(roomId, file, user) {
  if (!user?.uid) throw new Error("Must be signed in to upload.");

  if (!ACCEPTED_MIME_TYPES[file.type]) {
    throw new Error("Unsupported file type. Accepted: PDF, PPTX, DOCX, PNG, JPG.");
  }

  if (file.size > MAX_ROOM_FILE_SIZE_BYTES) {
    throw new Error("File exceeds the 10 MB size limit.");
  }

  const fileType = ACCEPTED_MIME_TYPES[file.type];
  const storagePath = `rooms/${roomId}/documents/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(storageRef, file);
  const storageUrl = await getDownloadURL(snapshot.ref);

  const docRef = await addDoc(collection(db, "rooms", roomId, "shared-documents"), {
    fileName: file.name,
    fileType,
    fileSize: file.size,
    storageUrl,
    storagePath,
    uploadedBy: user.uid,
    uploaderName: user.displayName || "Anonymous",
    uploadedAt: serverTimestamp(),
    status: "ready",
  });

  return { id: docRef.id, storageUrl };
}

/**
 * Creates a room through the unified backend.
 */
export async function createRoom(idToken, { name, description, displayName }) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/rooms/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, description, displayName }),
    });
  } catch {
    throw new Error(
      "Could not reach the server. Make sure the Flask backend is running (python3 app.py) on port 5000."
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.error || `Failed to create room (${res.status})`);
  }

  return data;
}

/**
 * Joins a room by invite code.
 * @returns {Promise<{ roomId: string, userId: string, role: string, joinedAt: string }>}
 */
export async function joinRoom(idToken, inviteCode, displayName) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/rooms/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ invite_code: inviteCode, display_name: displayName }),
    });
  } catch {
    throw new Error(
      "Could not reach the server. Make sure the Flask backend is running (python3 app.py) on port 5000."
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.error || `Failed to join room (${res.status})`);
  }

  return data;
}

/**
 * Removes a member from a room (leave or kick).
 * Both leaveRoom and removeMember call the same endpoint with a different targetUid.
 */
export async function leaveRoom(idToken, roomId, uid) {
  const res = await fetch(`${API_BASE}/api/rooms/${roomId}/members/${uid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${idToken}` },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.error || `Failed to leave room (${res.status})`);
  }

  return data;
}

/**
 * Removes a specific member from a room (owner only).
 */
export async function removeMember(idToken, roomId, targetUid) {
  const res = await fetch(`${API_BASE}/api/rooms/${roomId}/members/${targetUid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${idToken}` },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.error || `Failed to remove member (${res.status})`);
  }

  return data;
}

/**
 * Deletes a room (owner only).
 */
export async function deleteRoom(idToken, roomId) {
  const res = await fetch(`${API_BASE}/api/rooms/${roomId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${idToken}` },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.error || `Failed to delete room (${res.status})`);
  }

  return data;
}

/**
 * Shares an existing library document into a room (no re-upload).
 * Reads the source document's metadata and creates a shared-documents entry
 * with a `sourceDocId` linking back to the original.
 *
 * @param {string} roomId
 * @param {string} sourceDocId  Firestore ID from the user's document library
 * @param {{ uid: string, displayName: string | null }} user
 * @returns {Promise<{ id: string }>}
 */
export async function shareExistingDocument(roomId, sourceDocId, user) {
  if (!user?.uid) throw new Error("Must be signed in to share a document.");

  const sourceSnap = await getDoc(doc(db, "documents", sourceDocId));
  if (!sourceSnap.exists()) throw new Error("Source document not found.");

  const source = sourceSnap.data();

  const docRef = await addDoc(collection(db, "rooms", roomId, "shared-documents"), {
    fileName:    source.fileName,
    fileType:    source.fileType || "pdf",
    fileSize:    source.fileSize || 0,
    storageUrl:  source.storageUrl || "",
    storagePath: source.storagePath || "",
    sourceDocId,
    uploadedBy:   user.uid,
    uploaderName: user.displayName || "Anonymous",
    uploadedAt:   serverTimestamp(),
    status:       "ready",
  });

  return { id: docRef.id };
}

/**
 * Triggers AI summarization of all room messages + shared document content.
 * The summary is saved as a message with `type: "ai"` in the room's messages
 * subcollection, so it flows through the existing real-time listener.
 *
 * @param {string} idToken
 * @param {string} roomId
 * @returns {Promise<{ summary: string }>}
 */
export async function generateRoomSummary(idToken, roomId) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/rooms/${roomId}/summarize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    });
  } catch {
    throw new Error(
      "Could not reach the server. Make sure the Flask backend is running (python3 app.py) on port 5000."
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.error || `Failed to generate summary (${res.status})`);
  }

  return data;
}