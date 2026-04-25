/**
 * RecentDocuments.jsx
 * Displays the user's 3 most recently accessed documents.
 *
 * Single Responsibility: render the "Recent Activity" section only.
 * Dependency Inversion: data comes from useRecentDocuments hook, not Firebase.
 * Open/Closed: route targets and card fields can be extended without rewriting.
 */

import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { useRecentDocuments } from "../../hooks/useRecentDocuments";

// ── File-type badge styles ──────────────────────────────────────────────────

const FILE_TYPE_STYLES = {
  pdf:  { bg: "bg-red-100 dark:bg-red-900/30",    text: "text-red-700 dark:text-red-300" },
  pptx: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  docx: { bg: "bg-blue-100 dark:bg-blue-900/30",   text: "text-blue-700 dark:text-blue-300" },
  png:  { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  jpg:  { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  jpeg: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
};

const DEFAULT_BADGE = { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" };

function FileTypeBadge({ fileType }) {
  const type = (fileType ?? "").toLowerCase();
  const { bg, text } = FILE_TYPE_STYLES[type] ?? DEFAULT_BADGE;
  return (
    <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${bg} ${text}`}>
      {type || "file"}
    </span>
  );
}

// ── Relative time helper ────────────────────────────────────────────────────

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function formatRelativeTime(timestamp) {
  if (!timestamp) return "Unknown";
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return "Unknown";
  const diffMs   = Date.now() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays  = Math.floor(diffHours / 24);

  if (diffSecs < 60)   return rtf.format(-diffSecs,  "second");
  if (diffMins < 60)   return rtf.format(-diffMins,  "minute");
  if (diffHours < 24)  return rtf.format(-diffHours, "hour");
  return rtf.format(-diffDays, "day");
}

// ── Document card ───────────────────────────────────────────────────────────

function RecentDocumentCard({ doc, onResume }) {
  return (
    <div className="
      flex items-center justify-between gap-4 p-4 rounded-2xl
      border border-gray-100 dark:border-gray-700
      bg-white dark:bg-gray-900
      hover:shadow-md hover:-translate-y-[2px]
      transition-all duration-300
    ">
      <div className="flex items-center gap-4 flex-1 min-w-0">

        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl">
          📄
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {doc.fileName ?? "Untitled document"}
          </p>

        <div className="flex items-center gap-2 mt-1">
          <FileTypeBadge fileType={doc.fileType} />
          {doc.topic && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {doc.topic}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatRelativeTime(doc.uploadedAt)}
          </span>
        </div>
      </div>
    </div>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyRecentDocuments() {
  return (
    <div className="
      flex flex-col items-center justify-center py-12 text-center
      border-2 border-dashed border-gray-200 dark:border-gray-700
      rounded-2xl
    ">
      <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-4xl mb-4">
        📚
      </div>

      <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        No recent activity yet
      </p>

      <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
        Upload your first document to start generating summaries and quizzes.
      </p>
    </div>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

export function RecentDocuments() {
  const { documents, loading } = useRecentDocuments();
  const navigate = useNavigate();

  const handleResume = (docId) => {
    if (!docId) return;
    navigate(`/documents/${docId}`);
  };

  return (
    <div className="
      bg-white dark:bg-gray-900
      rounded-3xl
      border border-gray-200 dark:border-gray-700
      shadow-sm
      p-6
      transition-colors
    ">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Recent Activity
        </h2>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
              </div>
              <div className="h-8 w-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyRecentDocuments />
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <RecentDocumentCard key={doc.id} doc={doc} onResume={handleResume} />
          ))}
        </div>
      )}
    </div>
  );
}
