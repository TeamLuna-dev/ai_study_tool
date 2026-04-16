/**
 * useSummarizer.js
 * Encapsulates all state and side-effects for the AI summarizer feature.
 * Components import only from this hook — never from summarizerService directly.
 *
 * Follows the same separation-of-concerns pattern as useFileUpload.js:
 *   hook  → manages state and calls service
 *   service → handles HTTP transport
 *   component → renders state, calls hook actions
 */

import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { generateSummary, fetchSummaryHistory } from "../services/summarizerService";

/**
 * @returns {{
 *   summary:      string|null,
 *   loading:      boolean,
 *   error:        string|null,
 *   history:      Array,
 *   generate:     ({ text?: string, docId?: string }) => Promise<void>,
 *   clearSummary: () => void,
 *   loadHistory:  () => Promise<void>,
 * }}
 */
export function useSummarizer() {
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [history, setHistory] = useState([]);

  /**
   * generate — calls the summarizer API with either a docId or raw text.
   * Sets loading while in-flight; populates summary or error on resolution.
   */
  const generate = useCallback(async ({ text, docId } = {}) => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const idToken = user ? await user.getIdToken() : null;
      const result = await generateSummary({ text, docId, idToken });
      setSummary(result.summary);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * clearSummary — resets the current summary and any error.
   * Does not affect history.
   */
  const clearSummary = useCallback(() => {
    setSummary(null);
    setError(null);
  }, []);

  /**
   * loadHistory — fetches the user's past summaries from the backend.
   * Non-fatal: logs a warning on failure rather than surfacing an error state,
   * since history is supplementary and should not block the main flow.
   */
  const loadHistory = useCallback(async () => {
    try {
      const idToken = user ? await user.getIdToken() : null;
      const items = await fetchSummaryHistory(idToken);
      setHistory(items);
    } catch (err) {
      console.warn("[useSummarizer] Could not load history:", err.message);
    }
  }, [user]);

  return { summary, loading, error, history, generate, clearSummary, loadHistory };
}
