/**
 * ProcessingStatus.jsx
 *
 * Shows a live checklist of the three pipeline stages after upload.
 * Each stage transitions from pending → active (spinner) → done or error
 * as the backend updates the Firestore document status.
 *
 * Receives pipelineStatus and pipelineError from useDocumentStatus().
 */

import React from "react";

const STAGES = [
  { key: "extracting", label: "Extracting text" },
  { key: "embedding",  label: "Generating embeddings" },
  { key: "storing",    label: "Storing in Qdrant" },
];

// The order in which statuses occur — used to decide which stages are "done".
// pending_review sits between extracting and embedding for image uploads.
const STATUS_ORDER = ["processing", "extracting", "pending_review", "embedding", "storing", "ready"];

function stageState(stageKey, pipelineStatus, errorStage) {
  if (pipelineStatus === "error" && errorStage === stageKey) return "error";

  const currentIndex = STATUS_ORDER.indexOf(pipelineStatus);
  const stageIndex   = STATUS_ORDER.indexOf(stageKey);

  if (currentIndex === -1) return "pending";
  if (pipelineStatus === stageKey) return "active";
  if (currentIndex > stageIndex) return "done";
  return "pending";
}

function StageIcon({ state }) {
  if (state === "done")    return <span className="font-bold text-green-600 dark:text-green-400">✓</span>;
  if (state === "error")   return <span className="font-bold text-red-600 dark:text-red-400">✕</span>;
  if (state === "active")  return <Spinner />;
  return <span className="text-slate-400 dark:text-slate-500">○</span>;
}

function Spinner() {
  return (
    <span
      className="
        inline-block h-3.5 w-3.5 align-middle
        rounded-full border-2
        border-indigo-500 dark:border-indigo-400
        border-t-transparent
        animate-spin
      "
    />
  );
}

/**
 * @param {{
 *   pipelineStatus: string|null,
 *   pipelineError:  { stage: string, message: string }|null,
 * }} props
 */
export function ProcessingStatus({ pipelineStatus, pipelineError }) {
  if (!pipelineStatus || pipelineStatus === "processing") return null;

  const errorStage      = pipelineError?.stage ?? null;
  const isDone          = pipelineStatus === "ready";
  const isPendingReview = pipelineStatus === "pending_review";

  return (
    <div
      data-testid="processing-status"
      className="
        mt-4 rounded-2xl border
        border-slate-200 dark:border-slate-700
        bg-slate-50 dark:bg-slate-900
        p-4 text-sm
        text-slate-700 dark:text-slate-200
        transition-colors
      "
    >
      <p  className="mb-3 font-semibold text-slate-800 dark:text-slate-100">
        {isDone          ? "Processing complete"      :
         isPendingReview ? "Text extracted — review below" :
                           "Processing…"}
      </p>

      <ul className="flex flex-col gap-2">
        {STAGES.map(({ key, label }) => {
          const state = stageState(key, pipelineStatus, errorStage);
          return (
            <li key={key} className="flex items-center gap-3">
              <StageIcon state={state} />
              <span  className={
                  state === "error"
                    ? "text-red-600 dark:text-red-400"
                    : state === "pending"
                    ? "text-slate-400 dark:text-slate-500"
                    : "text-slate-800 dark:text-slate-100"
                }>
                {label}
              </span>
            </li>
          );
        })}
      </ul>

      {pipelineError && (
        <p
          role="alert"
          className="
            mt-3 rounded-lg border
            border-red-300 dark:border-red-800
            bg-red-50 dark:bg-red-900/20
            px-3 py-2
            text-red-800 dark:text-red-300
          "
        >
          <strong>Error during {pipelineError.stage}:</strong> {pipelineError.message}
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
