/**
 * fileValidation.js
 * Handles only file validation logic.
 * Add new types to ALLOWED_TYPES without changing validation logic.
 */

export const ALLOWED_TYPES = {
  "application/pdf": { label: "PDF", extension: ".pdf", kind: "document", maxSizeMB: 20 },
  "image/jpeg":      { label: "JPG", extension: ".jpg", kind: "image",    maxSizeMB: 20 },
  "image/png":       { label: "PNG", extension: ".png", kind: "image",    maxSizeMB: 20 },
  "audio/mpeg":      { label: "MP3", extension: ".mp3", kind: "audio",    maxSizeMB: 100 },
  "audio/mp4":       { label: "M4A", extension: ".m4a", kind: "audio",    maxSizeMB: 100 },
  "audio/x-m4a":     { label: "M4A", extension: ".m4a", kind: "audio",    maxSizeMB: 100 },
  "audio/wav":       { label: "WAV", extension: ".wav", kind: "audio",    maxSizeMB: 100 },
};

/**
 * [mime, meta] entries, optionally scoped to a set of kinds.
 * @param {string[]} [kinds]  e.g. ["image", "document"]; omit for all types
 */
export function typesForKinds(kinds) {
  const entries = Object.entries(ALLOWED_TYPES);
  if (!kinds) return entries;
  return entries.filter(([, meta]) => kinds.includes(meta.kind));
}

/** Builds the <input accept> string for a set of kinds. */
export function acceptStringFor(kinds) {
  return typesForKinds(kinds).map(([mime]) => mime).join(",");
}

/** Human-readable extension list for a set of kinds, e.g. ".pdf, .jpg". */
export function extensionsForKinds(kinds) {
  return typesForKinds(kinds).map(([, meta]) => meta.extension).join(", ");
}

/** Largest per-type size limit within a set of kinds, for hint copy. */
export function maxSizeMBForKinds(kinds) {
  const sizes = typesForKinds(kinds).map(([, meta]) => meta.maxSizeMB);
  return sizes.length ? Math.max(...sizes) : 0;
}

/**
 * Groups the registry by `kind` for "Supported files" style listings.
 * @returns {{ kind: string, labels: string[], maxSizeMB: number }[]}
 */
export function groupedByKind() {
  const groups = {};
  for (const meta of Object.values(ALLOWED_TYPES)) {
    const group = groups[meta.kind] ??= { kind: meta.kind, labels: [], maxSizeMB: meta.maxSizeMB };
    if (!group.labels.includes(meta.label)) group.labels.push(meta.label);
    group.maxSizeMB = Math.max(group.maxSizeMB, meta.maxSizeMB);
  }
  return Object.values(groups);
}

/**
 * Validates a File object against allowed types and per-type size limits.
 * @param {File} file
 * @param {string[]} [allowedKinds]  restrict validation to these kinds
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateFile(file, allowedKinds) {
  if (!file) {
    return { valid: false, error: "No file provided." };
  }

  const scoped = typesForKinds(allowedKinds);
  const entry = Object.fromEntries(scoped)[file.type];

  if (!entry) {
    const allowed = scoped.map(([, meta]) => meta.label).join(", ");
    return {
      valid: false,
      error: `Invalid file type "${file.type}". Allowed types: ${allowed}.`,
    };
  }

  const maxBytes = entry.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File exceeds the ${entry.maxSizeMB}MB size limit for ${entry.label} files.`,
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
