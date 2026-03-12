/**
 * FileUpload.jsx
 *
 * Orchestrates the upload UI — composes sub-components and connects
 * them to the useFileUpload hook. Contains no business logic itself.
 *
 * The upload mechanism is injectable via the uploadFn prop, to allow
 * swaping the transport layer (e.g. for tests or a different API) without
 * changing this component.
 */

import React from "react";
import { DropZone } from "./DropZone";
import { ProgressBar } from "./ProgressBar";
import { StatusAlert } from "./StatusAlert";
import { useFileUpload, UPLOAD_STATUS } from "../../hooks/useFileUpload";
import { formatFileSize } from "../../util/fileValidation";

/**
 * @param {{
 *   onUploadSuccess?: (message: string) => void; - called when upload completes
 *   onUploadError?:   (message: string) => void; - called when upload fails
 *   uploadFn?:        Function;                  - injectable transport (for testing)
 *   getAuthToken?:    () => Promise<string>;      - e.g. () => currentUser.getIdToken()
 * }} props
 */
export function FileUpload({ onUploadSuccess, onUploadError, uploadFn, getAuthToken }) {
  const {
    status,
    progress,
    message,
    selectedFile,
    docId,
    handleFileSelect,
    handleUpload,
    handleCancel,
    reset,
  } = useFileUpload({ uploadFn, getAuthToken });

  const isUploading = status === UPLOAD_STATUS.UPLOADING;
  const isSuccess   = status === UPLOAD_STATUS.SUCCESS;

  React.useEffect(() => {
    if (isSuccess && message) onUploadSuccess?.(message, docId);
  }, [isSuccess, message, docId, onUploadSuccess]);

  React.useEffect(() => {
    if (status === UPLOAD_STATUS.ERROR && message) onUploadError?.(message);
  }, [status, message, onUploadError]);

  return (
    <section
      aria-label="File upload"
      style={{
        maxWidth: "480px",
        fontFamily: "system-ui, sans-serif",
        color: "#1e293b",
        margin: "0 auto",
      }}
    >
      {/* File picker — disabled while an upload is in progress */}
      <DropZone onFileSelect={handleFileSelect} disabled={isUploading} />

      {/* Show the selected file name and size once a file is chosen */}
      {selectedFile && !isSuccess && (
        <p style={{ margin: "10px 0 0", fontSize: "0.85rem", color: "#475569" }}>
          📄 {selectedFile.name} ({formatFileSize(selectedFile.size)})
        </p>
      )}

      {/* Animated progress bar — only visible during upload */}
      <ProgressBar visible={isUploading} progress={progress} />

      {/* Success / error / info alert — driven by upload status */}
      <StatusAlert status={status} message={message} />

      {/* Action buttons — only one set is visible at a time */}
      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>

        {/* Upload button — shown when a file is ready but not yet uploading */}
        {selectedFile && !isUploading && !isSuccess && (
          <button
            onClick={handleUpload}
            data-testid="upload-button"
            style={btnStyle("#6366f1", "#fff")}
          >
            Upload
          </button>
        )}

        {/* Cancel button — shown only while uploading */}
        {isUploading && (
          <button
            onClick={handleCancel}
            data-testid="cancel-button"
            style={btnStyle("#ef4444", "#fff")}
          >
            Cancel
          </button>
        )}

        {/* Reset button — shown after success or failure */}
        {(isSuccess || status === UPLOAD_STATUS.ERROR) && (
          <button
            onClick={reset}
            data-testid="reset-button"
            style={btnStyle("#64748b", "#fff")}
          >
            {/* Label changes based on outcome */}
            {isSuccess ? "Upload Another" : "Try Again"}
          </button>
        )}
      </div>
    </section>
  );
}

function btnStyle(bg, color) {
  return {
    padding: "9px 20px",
    borderRadius: "8px",
    border: "none",
    background: bg,
    color,
    fontWeight: 600,
    fontSize: "0.875rem",
    cursor: "pointer",
  };
}