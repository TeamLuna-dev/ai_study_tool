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

// The order in which statuses occur — used to decide which stages are "done"
const STATUS_ORDER = ["processing", "extracting", "embedding", "storing", "ready"];

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
  if (state === "done")    return <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>;
  if (state === "error")   return <span style={{ color: "#dc2626", fontWeight: 700 }}>✕</span>;
  if (state === "active")  return <Spinner />;
  return <span style={{ color: "#94a3b8" }}>○</span>;
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "14px",
        height: "14px",
        border: "2px solid #6366f1",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        verticalAlign: "middle",
      }}
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

  const errorStage = pipelineError?.stage ?? null;
  const isDone     = pipelineStatus === "ready";

  return (
    <div
      data-testid="processing-status"
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
      <p style={{ margin: "0 0 10px", fontWeight: 600, color: "#1e293b" }}>
        {isDone ? "Processing complete" : "Processing…"}
      </p>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
        {STAGES.map(({ key, label }) => {
          const state = stageState(key, pipelineStatus, errorStage);
          return (
            <li key={key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <StageIcon state={state} />
              <span style={{ color: state === "error" ? "#dc2626" : state === "pending" ? "#94a3b8" : "#1e293b" }}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>

      {pipelineError && (
        <p
          role="alert"
          style={{
            margin: "12px 0 0",
            padding: "8px 12px",
            borderRadius: "6px",
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
          }}
        >
          <strong>Error during {pipelineError.stage}:</strong> {pipelineError.message}
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
