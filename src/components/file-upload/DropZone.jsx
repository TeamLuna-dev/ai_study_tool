/**
 * DropZone.jsx
 * Renders the drag-and-drop / click-to-browse file input UI only.
 */

import React, { useRef, useState, useCallback } from "react";
import { ALLOWED_TYPES, MAX_FILE_SIZE_MB } from "../../util/fileValidation";

const allowedExtensions = Object.values(ALLOWED_TYPES)
  .map((t) => t.extension)
  .join(", ");

const acceptAttr = Object.keys(ALLOWED_TYPES).join(",");

/**
 * @param {{ onFileSelect: (file: File) => void, disabled?: boolean }} props
 */
export function DropZone({ onFileSelect, disabled = false }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files) => {
      if (files?.[0]) onFileSelect(files[0]);
    },
    [onFileSelect]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  const onInputChange = (e) => handleFiles(e.target.files);

  const baseStyle = {
    border: `2px dashed ${isDragging ? "#6366f1" : "#cbd5e1"}`,
    borderRadius: "12px",
    padding: "40px 24px",
    textAlign: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    background: isDragging ? "#eef2ff" : "#f8fafc",
    transition: "all 0.2s ease",
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <div
      role="region"
      aria-label="File drop zone"
      style={baseStyle}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept={acceptAttr}
        style={{ display: "none" }}
        onChange={onInputChange}
        aria-label="File upload input"
      />
      <p style={{ margin: 0, fontSize: "1rem", color: "#475569" }}>
        {isDragging
          ? "Drop your file here…"
          : "Drag & drop or click to browse"}
      </p>
      <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
        Accepts {allowedExtensions.toUpperCase()} · Max {MAX_FILE_SIZE_MB} MB
      </p>
    </div>
  );
}