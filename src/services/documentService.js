/**
 * documentService.js
 * Firestore read layer for user documents.
 * Components and hooks never import from Firebase directly (DIP).
 */

import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Subscribes to the user's most recently uploaded documents.
 *
 * Queries the top-level `documents` collection filtered by `ownerId`.
 * Sorting by `uploadedAt` is done client-side to avoid requiring a
 * composite Firestore index.
 *
 * @param {string}   uid         - Firebase Auth UID
 * @param {Function} onNext      - called with a Firestore QuerySnapshot
 * @param {Function} onError     - called with a FirestoreError
 * @param {number}   [limitCount=3] - maximum documents to return
 * @returns {() => void} Firestore unsubscribe function
 */
export function getRecentDocuments(uid, onNext, onError, limitCount = 3) {
  const q = query(
    collection(db, "documents"),
    where("ownerId", "==", uid)
  );
  return onSnapshot(q, (snapshot) => {
    const sorted = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.uploadedAt?.seconds ?? 0) - (a.uploadedAt?.seconds ?? 0))
      .slice(0, limitCount);
    onNext(sorted);
  }, onError);
}
