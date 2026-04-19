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
  doc,
  deleteDoc as firestoreDelete,
  updateDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../config/firebase";


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
/**
 * Deletes a document from both Firebase Storage and Firestore.
 * Storage deletion is attempted first: if it fails (e.g. file already gone),
 * we log but still proceed to delete the Firestore record.
 *
 * @param {object} document -> must include id and storagePath
 * @returns {Promise<void>}
 */
export async function deleteDoc(document) {
  // Step 1 —> delete file from Firebase Storage
  if (document.storagePath) {
    try {
      const storageRef = ref(storage, document.storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn("[libraryService] Storage delete failed:", err.message);
    }
  }

  // Step 2 —> delete Firestore document record
  await firestoreDelete(doc(db, "documents", document.id));
}

/**
 * Renames a document in Firestore by updating its fileName field.
 *
 * @param {string} docId   -> Firestore document ID
 * @param {string} newName -> new filename string
 * @returns {Promise<void>}
 */
export async function renameDoc(docId, newName) {
  await updateDoc(doc(db, "documents", docId), { fileName: newName });
}