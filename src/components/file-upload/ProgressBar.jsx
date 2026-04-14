/**
 * ProgressBar.jsx
 * Renders upload progress only.
 */

import React from "react";

/**
 * @param {{ progress: number, visible: boolean }} props
 */
export function ProgressBar({ progress, visible }) {
  // Render nothing when not uploading — avoids an empty gap in the layout
  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Upload progress"
      className="my-4"
    >
      {/* Track */}
      <div
        className="
          h-2 w-full overflow-hidden rounded-full
          bg-slate-200 dark:bg-slate-700
        "
    >
      {/* The filled portion — width is driven by the progress prop */}
      <div
          className="
            h-full rounded-full
            bg-gradient-to-r from-indigo-500 to-purple-500
            dark:from-indigo-400 dark:to-purple-400
            transition-all duration-300 ease-out
          "
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Percentage */}
      <p className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">
        {progress}%
      </p>
    </div>
  );
}