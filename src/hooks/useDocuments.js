/**
 * useDocuments.js
 * Custom hook for the Document Library feature.
 * Single responsibility: manages document fetching and deletion state.
 *
 * Keeps components clean —> they never call libraryService directly (DIP). 
 */

import { useState, useEffect } from "react";
import { getUserDocs } from "../services/libraryService";

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