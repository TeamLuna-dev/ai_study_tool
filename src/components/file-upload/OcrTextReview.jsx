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
 *   ocrWarning?:   string|null,
 * }} props
 */
export function OcrTextReview({ docId, extractedText, authToken, saveFn, ocrWarning }) {
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
      className="
        mt-4 rounded-2xl border
        border-slate-200 dark:border-slate-700
        bg-slate-50 dark:bg-slate-900
        p-4 text-sm
        text-slate-700 dark:text-slate-200
        transition-colors
      "
    >
      <p className="mb-1 font-semibold text-slate-800 dark:text-slate-100">
        Review Extracted Text
      </p>

      <p className="mb-3 text-slate-500 dark:text-slate-400">
        Edit the text below if needed, then confirm to save.
      </p>

      {ocrWarning && (
        <div
          role="alert"
          data-testid="ocr-warning"
          className="
            mb-3 rounded-lg border
            border-yellow-300 dark:border-yellow-700
            bg-yellow-50 dark:bg-yellow-900/20
            px-3 py-2 text-xs
            text-yellow-800 dark:text-yellow-300
          "
        >
          ⚠ {ocrWarning}
        </div>
      )}

      <textarea
        data-testid="ocr-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        disabled={isSaving || isSaved}
        className={`
          w-full resize-y rounded-xl border px-3 py-2 text-sm leading-6
          font-sans box-border outline-none transition-colors
          ${
            isSaved
              ? "bg-slate-100 dark:bg-slate-800"
              : "bg-white dark:bg-slate-950"
          }
          border-slate-300 dark:border-slate-600
          text-slate-800 dark:text-slate-100
          disabled:cursor-default disabled:opacity-90
          focus:border-blue-500 dark:focus:border-blue-400
        `}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          data-testid="confirm-save-button"
          onClick={handleSave}
          disabled={isSaving || isSaved}
          className={`
            rounded-xl px-5 py-2.5 text-sm font-semibold text-white
            shadow-sm transition active:scale-95
            ${
              isSaved
                ? "bg-green-600 dark:bg-green-500"
                : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            }
            disabled:cursor-default disabled:opacity-70 disabled:active:scale-100
          `}
        >
          {isSaving ? "Saving…" : isSaved ? "Saved ✓" : "Confirm & Save"}
        </button>

        {saveStatus === SAVE_STATUS.ERROR && saveError && (
          <p
            role="alert"
            data-testid="save-error"
            className="m-0 text-xs text-red-600 dark:text-red-400"
          >
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}