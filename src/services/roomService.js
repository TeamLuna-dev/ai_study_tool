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
import { db } from "../config/firebase";

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