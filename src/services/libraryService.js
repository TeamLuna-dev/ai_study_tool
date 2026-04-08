/**
 * libraryService.js
 * Firestore and Firebase Storage operations for the Document Library feature.
 * Single responsibility: library data access only: no UI, no state.
 *
 * Distinct from documentService.js which handles real-time document listeners
 * for the dashboard. This service does one-time reads and deletions for the
 * library page.
 *
 * Collection: top-level `documents` filtered by `ownerId`
 */

import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Fetches all documents uploaded by a user from Firestore.
 * Returns them sorted by uploadedAt descending (newest first).
 *
 * @param {string} uid -> Firebase UID of the authenticated user
 * @returns {Promise<Array>} -> array of document objects with id field included
 */
export async function getUserDocs(uid) {
  const q = query(
    collection(db, "documents"),
    where("ownerId", "==", uid)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // sort newest first since Firestore doesn't guarantee order without an index
  return docs.sort((a, b) => {
    const aTime = a.uploadedAt?.seconds ?? 0;
    const bTime = b.uploadedAt?.seconds ?? 0;
    return bTime - aTime;
  });
}
window.__libraryService = { getUserDocs }; // for testing purposes only, not used by components directly
