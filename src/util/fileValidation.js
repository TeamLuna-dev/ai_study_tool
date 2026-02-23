/**
 * fileValidation.js
 * Handles only file validation logic.
 * Add new types to ALLOWED_TYPES without changing validation logic.
 */

export const ALLOWED_TYPES = {
  "application/pdf": { label: "PDF", extension: ".pdf" },
  "image/jpeg": { label: "JPG", extension: ".jpg" },
  "image/png": { label: "PNG", extension: ".png" },
};

export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Validates a File object against allowed types and size limits.
 * @param {File} file
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: "No file provided." };
  }

  if (!ALLOWED_TYPES[file.type]) {
    const allowed = Object.values(ALLOWED_TYPES)
      .map((t) => t.label)
      .join(", ");
    return {
      valid: false,
      error: `Invalid file type "${file.type}". Allowed types: ${allowed}.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Returns a human-readable file size string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}