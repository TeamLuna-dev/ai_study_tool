/**
 * StatusAlert.jsx
 * Renders success/error/info alerts only.
 * Add new alert variants via ALERT_CONFIG without changing render logic.
 */

import React from "react";
import { UPLOAD_STATUS } from "../../hooks/useFileUpload";

const ALERT_CONFIG = {
  [UPLOAD_STATUS.SUCCESS]: {
    background: "#f0fdf4",
    border: "#86efac",
    color: "#166534",
    icon: "✓",
    role: "status",
  },
  [UPLOAD_STATUS.ERROR]: {
    background: "#fef2f2",
    border: "#fca5a5",
    color: "#991b1b",
    icon: "✕",
    role: "alert",
  },
  [UPLOAD_STATUS.IDLE]: {
    background: "#eff6ff",
    border: "#93c5fd",
    color: "#1e40af",
    icon: "ℹ",
    role: "status",
  },
};

/**
 * @param {{ status: string, message: string|null }} props
 */
export function StatusAlert({ status, message }) {
  const config = ALERT_CONFIG[status];
  if (!config || !message) return null;

  return (
    <div
      role={config.role}
      aria-live="polite"
      data-testid={`alert-${status}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginTop: "14px",
        padding: "10px 14px",
        borderRadius: "8px",
        border: `1px solid ${config.border}`,
        background: config.background,
        color: config.color,
        fontSize: "0.875rem",
      }}
    >
      <span style={{ fontWeight: 700, fontSize: "1rem" }}>{config.icon}</span>
      <span>{message}</span>
    </div>
  );
}