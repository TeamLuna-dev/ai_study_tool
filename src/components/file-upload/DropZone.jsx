/**
 * DropZone.jsx
 * Renders the drag-and-drop / click-to-browse file input UI only.
 */

import React, { useRef, useState, useCallback } from "react";
import {
  acceptStringFor,
  extensionsForKinds,
  maxSizeMBForKinds,
} from "../../util/fileValidation";

/**
 * @param {{
 *   onFileSelect: (file: File) => void,
 *   disabled?:    boolean,
 *   allowedKinds?: string[],  - restricts accept/hint copy to these kinds
 * }} props
 */

export function DropZone({ onFileSelect, disabled = false, allowedKinds }) {
  // Registry-derived per-zone copy — never hand-write type lists here
  const acceptAttr = acceptStringFor(allowedKinds);
  const allowedExtensions = extensionsForKinds(allowedKinds);
  const maxSizeMB = maxSizeMBForKinds(allowedKinds);
  // Ref to the hidden file input so we can trigger it on click
  const inputRef = useRef(null);
  // Track whether the user is dragging a file over the zone
  const [isDragging, setIsDragging] = useState(false);

  // Grab the first file from a FileList and pass it to the parent
  const handleFiles = useCallback(
    (files) => {
      if (files?.[0]) onFileSelect(files[0]);
    },
    [onFileSelect]
  );

  // Prevent the browser's default behaviour (opening the file) and
  // highlight the drop zone while dragging
  const onDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  // Handle file drop — extract files from the drag event
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  // Handle file selection via the hidden input
  const onInputChange = (e) => handleFiles(e.target.files);

  return (
    <div
      role="region"
      aria-label="File drop zone"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-2xl
        p-10 text-center transition-all duration-200
        ${
          isDragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        }
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"}
      `}
    >
      {/* Hidden input */}
      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={onInputChange}
        aria-label="File upload input"
      />

      {/* Main text */}
      <p className="text-base text-gray-700 dark:text-gray-200">
        {isDragging
          ? "Drop your file here…"
          : "Drag & drop or click to browse"}
      </p>

      {/* Sub text */}
      <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
        Accepts {allowedExtensions.toUpperCase()} · Max {maxSizeMB} MB
      </p>
    </div>
  );
}