/**
 * ocrService.js
 * API communication for OCR text confirmation.
 * Decoupled from UI so the transport layer can be swapped or mocked in tests.
 */

/**
 * Saves the user-confirmed OCR text for a document.
 *
 * @param {string}      docId      - Firestore document ID
 * @param {string}      text       - Finalized text after user review
 * @param {string|null} authToken  - Firebase ID token
 * @returns {Promise<void>}
 * @throws {Error} if the request fails
 */
export async function saveOcrText(docId, text, authToken) {
  const res = await fetch(`/api/ocr/${docId}/text`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to save text (${res.status}).`);
  }
}
