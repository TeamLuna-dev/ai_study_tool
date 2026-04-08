/**
 * useDocuments.js
 * Custom hook for the Document Library feature.
 * Single responsibility: manages document fetching and deletion state.
 *
 * Keeps components clean —> they never call libraryService directly (DIP). 
 */

import { useState, useEffect } from "react";
import { getUserDocs, deleteDoc } from "../services/libraryService";

/**
 * Fetches and manages the current user's uploaded documents.
 *
 * @param {string} uid - Firebase UID of the authenticated user
 * @returns {{ docs: Array, loading: boolean, error: string }}
 */
export function useDocuments(uid) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) return;

    async function fetchDocs() {
      setLoading(true);
      setError("");
      try {
        const result = await getUserDocs(uid);
        setDocs(result);
      } catch (err) {
        console.error("[useDocuments] Failed to fetch docs:", err);
        setError("Failed to load documents. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchDocs();
  }, [uid]);

  return { docs, loading, error };
}

/**
   * Deletes a document and removes it from local state immediately.
   * Optimistic removal: the card disappears without waiting for a refetch.
   * If deletion fails, the error is surfaced via the error state.
   *
   * @param {object} doc - document object from Firestore (must have id and storagePath)
   */
  async function handleDelete(doc) {
    try {
      await deleteDoc(doc);
      // remove from local state without a full refetch — faster UX
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      console.error("[useDocuments] Failed to delete doc:", err);
      setError("Failed to delete document. Please try again.");
    }
     return { docs, loading, error, handleDelete };

  }