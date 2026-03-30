/**
 * StudyBriefCard
 * Displays the AI-generated daily study brief at the top of the dashboard.
 * Pure display component — no data fetching, no Firebase imports.
 *
 * Props:
 *   brief        {string|null}  - The generated recommendation text
 *   isLoading    {boolean}      - Whether the brief is still being fetched
 *   error        {string|null}  - Error message if the fetch failed
 *   generatedAt  {string|null}  - ISO timestamp string from the backend
 */

import { Sparkles } from "lucide-react";

function _formatTimestamp(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export function StudyBriefCard({ brief, isLoading, error, generatedAt }) {
  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-400 rounded-2xl p-6 mb-8 shadow-sm animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 bg-indigo-200 rounded-full" />
          <div className="h-4 w-36 bg-indigo-200 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-indigo-100 rounded w-full" />
          <div className="h-3 bg-indigo-100 rounded w-5/6" />
          <div className="h-3 bg-indigo-100 rounded w-4/6" />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-400 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
          <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
            Daily Study Brief
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          Your study brief is taking a moment to load. Check back soon!
        </p>
      </div>
    );
  }

  // ── Loaded (including welcome fallback returned by the backend) ───────────
  const time = _formatTimestamp(generatedAt);

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 rounded-2xl p-6 mb-8 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
          <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
            Daily Study Brief
          </h2>
        </div>
        {time && (
          <span className="text-xs text-indigo-400 shrink-0">
            Generated at {time}
          </span>
        )}
      </div>
      <p className="text-gray-700 leading-relaxed">{brief}</p>
    </div>
  );
}
