/**
 * OcrTextReview.jsx
 *
 * Shown after OCR completes on an image upload. Displays the extracted
 * text in an editable textarea so the user can correct mistakes before
 * the text is sent to the embedding pipeline.
 *
 * The saveFn prop is injectable (e.g. for tests) via useOcrTextReview.
 */

import React from "react";
import { useOcrTextReview, SAVE_STATUS } from "../../hooks/useOcrTextReview";

/**
 * @param {{
 *   docId:         string,
 *   extractedText: string,
 *   authToken?:    string|null,
 *   saveFn?:       Function,
 * }} props
 */
export function OcrTextReview({ docId, extractedText, authToken, saveFn }) {
  const { text, setText, handleSave, saveStatus, saveError } = useOcrTextReview({
    docId,
    initialText: extractedText,
    authToken,
    saveFn,
  });

  const isSaving = saveStatus === SAVE_STATUS.SAVING;
  const isSaved  = saveStatus === SAVE_STATUS.SAVED;

  if (!extractedText) return null;

  return (
    <div
      data-testid="ocr-text-review"
      style={{
        marginTop: "16px",
        padding: "14px 16px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        fontSize: "0.875rem",
        color: "#334155",
      }}
    >
      <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#1e293b" }}>
        Review Extracted Text
      </p>
      <p style={{ margin: "0 0 10px", color: "#64748b" }}>
        Edit the text below if needed, then confirm to save.
      </p>

      <textarea
        data-testid="ocr-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        disabled={isSaving || isSaved}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          fontSize: "0.875rem",
          fontFamily: "system-ui, sans-serif",
          lineHeight: "1.6",
          resize: "vertical",
          boxSizing: "border-box",
          background: isSaved ? "#f1f5f9" : "#fff",
          color: "#1e293b",
          outline: "none",
        }}
      />

      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          data-testid="confirm-save-button"
          onClick={handleSave}
          disabled={isSaving || isSaved}
          style={{
            padding: "9px 20px",
            borderRadius: "8px",
            border: "none",
            background: isSaved ? "#16a34a" : "#6366f1",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: isSaving || isSaved ? "default" : "pointer",
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? "Saving…" : isSaved ? "Saved ✓" : "Confirm & Save"}
        </button>

        {saveStatus === SAVE_STATUS.ERROR && saveError && (
          <p
            role="alert"
            data-testid="save-error"
            style={{ margin: 0, color: "#dc2626", fontSize: "0.8rem" }}
          >
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}
