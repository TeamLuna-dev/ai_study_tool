/**
 * useDocumentStatus.js
 *
 * Subscribes to a Firestore document via onSnapshot and returns the
 * current processing status. Used after upload to show live pipeline
 * progress (extracting → embedding → storing → ready / error).
 *
 * Returns null for all fields until a docId is provided.
 */

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * @param {string|null} docId  Firestore document ID returned by the upload API.
 * @returns {{
 *   pipelineStatus: string|null,  - "extracting" | "embedding" | "storing" | "ready" | "error"
 *   pipelineError:  { stage: string, message: string } | null
 * }}
 */
export function useDocumentStatus(docId) {
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [pipelineError, setPipelineError]   = useState(null);

  useEffect(() => {
    // Reset immediately whenever docId changes (including when set to null)
    setPipelineStatus(null);
    setPipelineError(null);

    if (!docId) return;

    const ref = doc(db, "documents", docId);

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.data();
      setPipelineStatus(data.status ?? null);
      setPipelineError(
        data.status === "error" && data.error ? data.error : null
      );
    });

    return unsubscribe;
  }, [docId]);

  return { pipelineStatus, pipelineError };
}
