/**
 * DocumentCard.jsx
 * Renders a single document in the Document Library.
 * Display one document's info and a delete button. (SRP)
 *
 * Props:
 *   doc      - Firestore document object
 *   onDelete - handler called when user confirms delete
 */

import { useState } from "react";
import Modal from "../common/Modal";
import DocumentPreviewModal from "./DocumentPreviewModal";
// maps file type to a label and Tailwind color classes
function getFileTypeBadge(fileType) {
  if (fileType === "pdf") return { label: "PDF", color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
  if (["png", "jpg", "jpeg"].includes(fileType)) return { label: "Image", color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
  return { label: "File", color: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300" };
}

// maps status to a label and Tailwind color classes
function getStatusBadge(status) {
  if (status === "ready")      return { label: "Ready",      color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" };
  if (status === "processing") return { label: "Processing", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" };
  if (status === "error")      return { label: "Error",      color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
  return { label: "Unknown", color: "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400" };
}

// formats bytes into a human readable size string
function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// formats a Firestore timestamp into a readable date
function formatDate(timestamp) {
  if (!timestamp?.seconds) return "—";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DocumentCard({ doc, onDelete, onRename }) {
  const fileType = getFileTypeBadge(doc.fileType);
  const status = getStatusBadge(doc.status);

  // Local state for delete confirmation and loading state during deletion
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // two-click delete: first click asks for confirmation, second executes
  async function handleDeleteClick() {
    setConfirming(true);
  }

  return (
    <div onClick={() => setPreviewing(true)} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-4 flex flex-col gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer">

      {/* Header — file type badge + filename */}
      <div className="flex items-start gap-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-md ${fileType.color}`}>
          {fileType.label}
        </span>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
          {doc.fileName ?? "Unnamed document"}
        </p>
      </div>

      {/* Meta — file size and upload date */}
      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
        <span>{formatFileSize(doc.fileSize)}</span>
        <span>{formatDate(doc.uploadedAt)}</span>
      </div>

      {/* Footer — status badge + delete button (wired in next commit) */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-1 rounded-md ${status.color}`}>
          {status.label}
        </span>
        <button
          onClick={e => { e.stopPropagation(); handleDeleteClick(); }}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-lg transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>

      {previewing && <DocumentPreviewModal doc={doc} onClose={() => setPreviewing(false)} onRename={onRename} />}

      {/* Delete confirmation modal — centered on screen with frosted backdrop */}
      <Modal
        open={confirming}
        onClose={() => { if (!deleting) setConfirming(false); }}
        cardClassName="max-w-xs"
      >
        <div className="flex flex-col gap-3 p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Delete this document?</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            This removes the file permanently from storage.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setDeleting(true);
                await onDelete(doc);
                setDeleting(false);
                setConfirming(false);
              }}
              disabled={deleting}
              className="flex-1 text-xs px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
          </div>
        </div>
      </Modal>      
    </div>
  );
}