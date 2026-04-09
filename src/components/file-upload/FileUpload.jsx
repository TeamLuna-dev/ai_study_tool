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
import { ProcessingStatus } from "./ProcessingStatus";
import { OcrTextReview } from "./OcrTextReview";
import { useFileUpload, UPLOAD_STATUS } from "../../hooks/useFileUpload";
import { useDocumentStatus } from "../../hooks/useDocumentStatus";
import { formatFileSize } from "../../util/fileValidation";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

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

  const { pipelineStatus, pipelineError, ocrText, ocrWarning } = useDocumentStatus(docId);

  const [authToken, setAuthToken] = React.useState(null);
  React.useEffect(() => {
    getAuthToken?.().then(setAuthToken).catch(() => {});
  }, [getAuthToken]);

  const isImage = selectedFile && IMAGE_TYPES.has(selectedFile.type);
  const showOcrReview = pipelineStatus === "pending_review" && isImage && ocrText;

  React.useEffect(() => {
    if (isSuccess && message) onUploadSuccess?.(message);
  }, [isSuccess, message, onUploadSuccess]);

  React.useEffect(() => {
    if (status === UPLOAD_STATUS.ERROR && message) onUploadError?.(message);
  }, [status, message, onUploadError]);

  return (
    <section aria-label="File upload" className="max-w-2xl mx-auto text-slate-800">
      <div className="rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-8 text-center hover:border-blue-400 hover:bg-blue-100/40 transition">
        <DropZone onFileSelect={handleFileSelect} disabled={isUploading} />
      </div>

      {selectedFile && !isSuccess && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <span className="text-base">📄</span>
          <span className="truncate font-medium">{selectedFile.name}</span>
          <span className="text-slate-400">
            ({formatFileSize(selectedFile.size)})
          </span>
        </div>
      )}

      <div className="mt-4">
        <ProgressBar visible={isUploading} progress={progress} />
      </div>

      <div className="mt-4">
        <StatusAlert status={status} message={message} />
      </div>

      <div className="mt-4">
        <ProcessingStatus
          pipelineStatus={pipelineStatus}
          pipelineError={pipelineError}
        />
      </div>

      {showOcrReview && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <OcrTextReview
            docId={docId}
            extractedText={ocrText}
            authToken={authToken}
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {selectedFile && !isUploading && !isSuccess && (
          <button
            type="button"
            onClick={handleUpload}
            data-testid="upload-button"
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition"
          >
            Upload
          </button>
        )}

        {isUploading && (
          <button
            type="button"
            onClick={handleCancel}
            data-testid="cancel-button"
            className="rounded-xl bg-red-500 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-red-600 active:scale-95 transition"
          >
            Cancel
          </button>
        )}

        {(isSuccess || status === UPLOAD_STATUS.ERROR) && (
          <button
            type="button"
            onClick={reset}
            data-testid="reset-button"
            className="rounded-xl bg-slate-500 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-slate-600 active:scale-95 transition"
          >
            {isSuccess ? "Upload Another" : "Try Again"}
          </button>
        )}
      </div>
    </section>
  );
}