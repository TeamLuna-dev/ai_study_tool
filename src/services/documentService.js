/**
 * documentService.js
 * Firestore read layer for user documents.
 * Components and hooks never import from Firebase directly (DIP).
 */

import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Subscribes to the user's most recently accessed documents.
 *
 * Orders by `lastAccessed` descending. Documents that do not yet have a
 * `lastAccessed` field are excluded by Firestore's orderBy behaviour, so the
 * listener will yield an empty snapshot (not an error) until the field exists.
 *
 * @param {string}   uid      - Firebase Auth UID
 * @param {Function} onNext   - called with a Firestore QuerySnapshot
 * @param {Function} onError  - called with a FirestoreError
 * @param {number}   [limitCount=3] - maximum documents to return
 * @returns {() => void} Firestore unsubscribe function
 */
export function getRecentDocuments(uid, onNext, onError, limitCount = 3) {
  const q = query(
    collection(db, "users", uid, "documents"),
    orderBy("lastAccessed", "desc"),
    limit(limitCount)
  );
  return onSnapshot(q, onNext, onError);
}
