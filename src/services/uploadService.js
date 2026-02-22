/**
 * uploadService.js
 * Handles only file upload API communication.
 * Swap out the implementation (e.g. S3, backend API) without touching UI components.
 */

/**
 * Uploads a file with progress tracking.
 * @param {File} file
 * @param {(progress: number) => void} onProgress  - called with 0-100
 * @param {AbortSignal} [signal]                   - optional cancellation
 * @param {string}      [authToken]                - Firebase ID token (optional until auth is wired up)
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function uploadFile(file, onProgress, signal, authToken) {
  const formData = new FormData();
  formData.append("file", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ success: true, message: data.message ?? "File uploaded successfully." });
        } catch {
          resolve({ success: true, message: "File uploaded successfully." });
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.detail ?? `Upload failed with status ${xhr.status}.`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}.`));
        }
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload."))
    );

    xhr.addEventListener("abort", () =>
      reject(new DOMException("Upload cancelled.", "AbortError"))
    );

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.open("POST", "/api/upload");

    // Attach Firebase token when available — no-op until auth is integrated
    if (authToken) {
      xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
    }

    xhr.send(formData);
  });
}