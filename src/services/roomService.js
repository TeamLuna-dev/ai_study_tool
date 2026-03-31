/**
 * roomService.js
 * Firestore room reads and backend room writes.
 * Components and hooks never import from Firebase directly (DIP).
 */

import {
  collection,
  doc,
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

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

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
export async function createRoom(idToken, { name, description }) {
  const res = await fetch(`${API_BASE}/api/rooms/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.error || `Failed to create room (${res.status})`);
  }

  return data;
}