/**
 * summarizerService.js
 * HTTP and Firestore access for the summarizer feature.
 * Single responsibility: data transport only — no state, no UI.
 *
 * Follows the same pattern as quizService.js:
 *   - API_BASE from env, falls back to local Flask server
 *   - Throws on non-ok responses so callers (hooks) handle errors in one place
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

/**
 * Calls POST /api/summarizer/generate and returns the generated summary.
 *
 * @param {{ text?: string, docId?: string, idToken?: string|null }} options
 * @returns {Promise<{ summary: string, doc_id: string|null }>}
 * @throws {Error} on network failure or non-2xx response
 */
export async function generateSummary({ text, docId, idToken } = {}) {
  if (!text && !docId) {
    throw new Error("Provide either text or a docId.");
  }

  const body = docId ? { doc_id: docId } : { text };

  const res = await fetch(`${API_BASE}/api/summarizer/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to generate summary (${res.status})`);
  }

  return data; // { summary, doc_id }
}

/**
 * Calls GET /api/summarizer/history and returns the user's past summaries.
 * Backend endpoint created in Task 4.
 *
 * @param {string|null} idToken
 * @returns {Promise<Array>}
 * @throws {Error} on network failure or non-2xx response
 */
export async function fetchSummaryHistory(idToken) {
  const res = await fetch(`${API_BASE}/api/summarizer/history`, {
    headers: {
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch summary history (${res.status})`);
  }

  return data.summaries ?? [];
}
