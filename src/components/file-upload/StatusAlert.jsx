/**
 * StatusAlert.jsx
 * Renders success/error/info alerts only.
 * Add new alert variants via ALERT_CONFIG without changing render logic.
 */

import React from "react";
import { UPLOAD_STATUS } from "../../hooks/useFileUpload";

/**
 * ALERT_CONFIG maps each upload status to its visual style and ARIA role.
 *
 * role "alert"  — announces immediately to screen readers (used for errors)
 * role "status" — announces politely when the user is idle (used for success)
 */

const ALERT_CONFIG = {
  [UPLOAD_STATUS.SUCCESS]: {
   icon: "✓",
    role: "status",
    container:
      "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300",
  },
  [UPLOAD_STATUS.ERROR]: {
    icon: "✕",
    role: "alert",
    container:
      "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
  },
  [UPLOAD_STATUS.IDLE]: {
    icon: "ℹ",
    role: "status",
    container:
      "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  },
};

/**
 * @param {{ status: string, message: string|null }} props
 */
export function StatusAlert({ status, message }) {
  const config = ALERT_CONFIG[status];

  // Render nothing if there's no matching config or no message to show
  if (!config || !message) return null;

  return (
    <div
      role={config.role}
      aria-live="polite"
      data-testid={`alert-${status}`}
      className={`
        mt-4 flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm
        ${config.container}
        transition-colors
      `}
    >
      <span className="text-base font-bold">{config.icon}</span>
      <span className="leading-5">{message}</span>
    </div>
  );
}