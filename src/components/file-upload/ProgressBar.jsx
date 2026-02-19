/**
 * ProgressBar.jsx
 * Renders upload progress only.
 */

import React from "react";

/**
 * @param {{ progress: number, visible: boolean }} props
 */
export function ProgressBar({ progress, visible }) {
  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Upload progress"
      style={{
        background: "#e2e8f0",
        borderRadius: "999px",
        height: "8px",
        overflow: "hidden",
        margin: "16px 0 8px",
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: "100%",
          background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
          borderRadius: "999px",
          transition: "width 0.3s ease",
        }}
      />
      <p
        style={{
          margin: "4px 0 0",
          fontSize: "0.78rem",
          color: "#64748b",
          textAlign: "right",
        }}
      >
        {progress}%
      </p>
    </div>
  );
}