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

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5001";

/**
 * Subscribes to all rooms where `uid` is present in the top-level `members`
 * array. Returns the Firestore unsubscribe function — caller must invoke it
 * on cleanup.
 *
 * @param {string}   uid      Firebase Auth UID of the current user.
 * @param {function} onNext   Invoked with a QuerySnapshot on every update.
 * @param {function} onError  Invoked with a FirestoreError if the query fails.
 * @returns {function}        Unsubscribe function.
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
 * @returns {function} Unsubscribe function.
 */
export function subscribeToRoom(roomId, onNext, onError) {
  return onSnapshot(doc(db, "rooms", roomId), onNext, onError);
}

/**
 * Subscribes to the members subcollection of a room.
 * @returns {function} Unsubscribe function.
 */
export function subscribeToRoomMembers(roomId, onNext, onError) {
  return onSnapshot(collection(db, "rooms", roomId, "members"), onNext, onError);
}

/**
 * Subscribes to the shared-documents subcollection of a room.
 * @returns {function} Unsubscribe function.
 */
export function subscribeToSharedDocuments(roomId, onNext, onError) {
  return onSnapshot(collection(db, "rooms", roomId, "shared-documents"), onNext, onError);
}

/**
 * Subscribes to the messages subcollection of a room, ordered by createdAt.
 * @returns {function} Unsubscribe function.
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

export async function createRoom(idToken, { name, description }) {
  const res = await fetch(`${API_BASE}/rooms/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to create room (${res.status})`);
  }
  return res.json();
}
