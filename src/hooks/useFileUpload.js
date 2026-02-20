/**
 * useFileUpload.js
 *
 * A custom React hook — hooks are just JavaScript functions that:
 *   1. Start with the word "use" (React's convention for identifying hooks)
 *   2. Can call other hooks (useState, useRef, useCallback, etc.)
 *   3. Encapsulate stateful logic so components stay clean
 *
 */

/**
 * Usage in a component:
 *   const { status, progress, message, handleFileSelect, handleUpload } =
 *     useFileUpload({ getAuthToken: () => currentUser.getIdToken() });
 */

import { useState, useRef, useCallback } from "react";
import { validateFile } from "../utils/fileValidation";
import { uploadFile } from "../services/uploadService";

/**
 * UPLOAD_STATUS — the possible states the upload flow can be in.
 * Exported so components can compare against these values without
 * hardcoding strings like "uploading" or "success" themselves.
 */
export const UPLOAD_STATUS = {
  IDLE:      "idle",       // nothing happening, waiting for a file
  UPLOADING: "uploading",  // request in flight
  SUCCESS:   "success",    // upload completed successfully
  ERROR:     "error",      // something went wrong
};

/**
 * @param {{
 *   uploadFn?:     typeof uploadFile;        - injectable for testing
 *   getAuthToken?: () => Promise<string>;    - e.g. () => currentUser.getIdToken()
 * }} options
 *
 * @returns {{
 *   status:           string;         - current UPLOAD_STATUS value
 *   progress:         number;         - 0–100, only meaningful while UPLOADING
 *   message:          string|null;    - success or error text to display
 *   selectedFile:     File|null;      - the file the user has chosen
 *   handleFileSelect: (file: File) => void;
 *   handleUpload:     () => Promise<void>;
 *   handleCancel:     () => void;
 *   reset:            () => void;
 * }}
 */
export function useFileUpload({ uploadFn = uploadFile, getAuthToken } = {}) {

  // ── State ──────────────────────────────────────────────────────────────────

  const [status, setStatus]           = useState(UPLOAD_STATUS.IDLE);
  const [progress, setProgress]       = useState(0);
  const [message, setMessage]         = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // useRef stores the AbortController so we can cancel an in-flight upload.
  // We use a ref (not state) because changing it shouldn't trigger a re-render.
  const abortRef = useRef(null);


  // ── Handlers ───────────────────────────────────────────────────────────────

  /**
   * reset — clears all state back to the initial idle condition.
   * Called when the user clicks "Upload Another" or "Try Again".
   * Also cancels any in-flight request just in case.
   */
  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStatus(UPLOAD_STATUS.IDLE);
    setProgress(0);
    setMessage(null);
    setSelectedFile(null);
  }, []);

  /**
   * handleFileSelect — runs when the user picks a file via DropZone.
   * Validates the file immediately so the user gets instant feedback
   * before they even click Upload.
   */
  const handleFileSelect = useCallback((file) => {
    const { valid, error } = validateFile(file);

    if (!valid) {
      // Show the validation error and clear any previously selected file
      setStatus(UPLOAD_STATUS.ERROR);
      setMessage(error);
      setSelectedFile(null);
      return;
    }

    // File is valid — store it and wait for the user to click Upload
    setStatus(UPLOAD_STATUS.IDLE);
    setMessage(null);
    setSelectedFile(file);
  }, []);

  /**
   * handleUpload — fires when the user clicks the Upload button.
   * Creates an AbortController so the request can be cancelled,
   * then delegates to uploadFn (the actual HTTP call).
   */
  const handleUpload = useCallback(async () => {
    // Guard: do nothing if no file has been selected
    if (!selectedFile) return;

    // Create a new AbortController for this upload and store it in the ref
    const controller = new AbortController();
    abortRef.current = controller;

    // Reset progress and move to uploading state
    setStatus(UPLOAD_STATUS.UPLOADING);
    setProgress(0);
    setMessage(null);

    try {
      // Fetch the Firebase token if an auth getter was provided
      // This is a no-op (undefined) until Firebase is wired up
      const authToken = getAuthToken ? await getAuthToken() : undefined;

      // Delegate the actual HTTP request to uploadService.js
      // setProgress is passed in so the service can update progress as it goes
      const result = await uploadFn(
        selectedFile,
        setProgress,
        controller.signal,
        authToken
      );

      setStatus(UPLOAD_STATUS.SUCCESS);
      setMessage(result.message);

    } catch (err) {
      if (err.name === "AbortError") {
        // User cancelled — return to idle rather than showing an error
        setStatus(UPLOAD_STATUS.IDLE);
        setMessage("Upload cancelled.");
      } else {
        setStatus(UPLOAD_STATUS.ERROR);
        setMessage(err.message ?? "An unexpected error occurred.");
      }
    }
  }, [selectedFile, uploadFn, getAuthToken]);

  /**
   * handleCancel — aborts the in-flight XHR request.
   * The AbortError thrown by the XHR is caught in handleUpload above.
   */
  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);


  // ── Return ─────────────────────────────────────────────────────────────────

  // Expose state and handlers to the component — nothing else leaks out
  return {
    status,
    progress,
    message,
    selectedFile,
    handleFileSelect,
    handleUpload,
    handleCancel,
    reset,
  };
}