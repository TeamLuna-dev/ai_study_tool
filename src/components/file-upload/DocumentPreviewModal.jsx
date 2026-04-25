import { useState } from "react";
import Modal from "../common/Modal";

function getStatusBadge(status) {
  if (status === "ready")      return { label: "Ready",      color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" };
  if (status === "processing") return { label: "Processing", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" };
  if (status === "error")      return { label: "Error",      color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
  return { label: "Unknown", color: "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400" };
}

function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(timestamp) {
  if (!timestamp?.seconds) return "—";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function FileTypeIcon({ fileType }) {
  if (fileType === "pdf") {
    return (
      <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    );
  }
  if (["jpg", "jpeg", "png"].includes(fileType)) {
    return (
      <div className="w-20 h-20 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

export default function DocumentPreviewModal({ doc, onClose, onRename }) {
  const status = getStatusBadge(doc.status);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(doc.fileName ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === doc.fileName || !onRename) { setEditing(false); return; }
    setSaving(true);
    await onRename(doc.id, trimmed);
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setNameInput(doc.fileName ?? "");
    setEditing(false);
  }

  return (
    <Modal open onClose={onClose} cardClassName="max-w-sm">
      <div className="p-6 flex flex-col gap-5">

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <FileTypeIcon fileType={doc.fileType} />

          {editing ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
                className="w-full text-center text-sm font-medium rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group">
              <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">
                {doc.fileName ?? "Unnamed document"}
              </p>
              <button
                onClick={() => setEditing(true)}
                className="text-gray-300 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-gray-400 dark:text-gray-500 mb-1">Size</p>
            <p className="font-medium text-gray-700 dark:text-gray-200">{formatFileSize(doc.fileSize)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-gray-400 dark:text-gray-500 mb-1">Uploaded</p>
            <p className="font-medium text-gray-700 dark:text-gray-200">{formatDate(doc.uploadedAt)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-gray-400 dark:text-gray-500 mb-1">Format</p>
            <p className="font-medium text-gray-700 dark:text-gray-200 uppercase">{doc.fileType ?? "—"}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-gray-400 dark:text-gray-500 mb-1">Status</p>
            <span className={`inline-block font-medium px-2 py-0.5 rounded-md ${status.color}`}>
              {status.label}
            </span>
          </div>
          {doc.topic && (
            <div className="col-span-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-gray-400 dark:text-gray-500 mb-1">Topic</p>
              <span className="inline-block font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {doc.topic}
              </span>
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}
