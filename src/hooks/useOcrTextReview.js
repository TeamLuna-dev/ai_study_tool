/**
 * useOcrTextReview.js
 *
 * Manages editable OCR text state and the confirm-save action.
 * The saveFn is injectable so it can be swapped in tests or for a
 * different backend without changing this hook or the component.
 *
 * Returns:
 *   text        - current (possibly edited) text
 *   setText     - update text on each keystroke
 *   handleSave  - triggers the save API call
 *   saveStatus  - "idle" | "saving" | "saved" | "error"
 *   saveError   - error message string, or null
 */

import { useState } from "react";
import { saveOcrText } from "../services/ocrService";

export const SAVE_STATUS = {
  IDLE:   "idle",
  SAVING: "saving",
  SAVED:  "saved",
  ERROR:  "error",
};

/**
 * @param {{
 *   docId:      string,
 *   initialText: string,
 *   authToken?: string|null,
 *   saveFn?:    (docId: string, text: string, token: string|null) => Promise<void>
 * }} options
 */
export function useOcrTextReview({
  docId,
  initialText,
  authToken = null,
  saveFn = saveOcrText,
}) {
  const [text,       setText]       = useState(initialText ?? "");
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.IDLE);
  const [saveError,  setSaveError]  = useState(null);

  async function handleSave() {
    setSaveStatus(SAVE_STATUS.SAVING);
    setSaveError(null);
    try {
      await saveFn(docId, text, authToken);
      setSaveStatus(SAVE_STATUS.SAVED);
    } catch (err) {
      setSaveStatus(SAVE_STATUS.ERROR);
      setSaveError(err.message);
    }
  }

  return { text, setText, handleSave, saveStatus, saveError };
}
