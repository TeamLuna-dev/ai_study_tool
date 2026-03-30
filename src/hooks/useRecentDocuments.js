/**
 * useRecentDocuments.js
 * Subscribes to the current user's 3 most recently accessed documents via a
 * Firestore real-time listener. Handles loading and error states; cleans up
 * the listener on unmount to prevent memory leaks.
 *
 * Single Responsibility: manage recent-documents list state — no UI, no routing.
 * Dependency Inversion: depends on documentService, never on Firebase directly.
 */

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getRecentDocuments } from "../services/documentService";

/**
 * @returns {{
 *   documents: Array<{ id: string, fileName: string, fileType: string, lastAccessed: any, storageUrl: string }>,
 *   loading:   boolean,
 *   error:     import("firebase/firestore").FirestoreError | null,
 * }}
 */
export function useRecentDocuments() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [documents, setDocuments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    // Guard: uid is null/undefined while auth is resolving or after sign-out.
    //
    // CLEANUP ORDER — why this is safe on sign-out:
    // React always calls the *previous* effect's cleanup before re-running the
    // effect with a new dependency value. So when uid flips from "abc123" to
    // null (sign-out), the cleanup `() => unsubscribe()` registered by the
    // previous run fires first — closing the Firestore listener — before this
    // guard executes. There is no window where the listener stays open.
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = getRecentDocuments(
      uid,
      (snapshot) => {
        setDocuments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe before the next effect run (uid change) or unmount.
    return () => unsubscribe();
  }, [uid]);

  return { documents, loading, error };
}
