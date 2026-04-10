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
      <div className="overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
        <div className="bg-gradient-to-r from-purple-100 via-blue-50 to-pink-50 dark:from-purple-950/40 dark:via-blue-950/30 dark:to-pink-950/30 px-6 py-5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-gray-800/70" />
            <div className="flex-1">
              <div className="h-4 w-36 bg-white/70 dark:bg-gray-700 rounded mb-3" />
              <div className="h-4 w-3/4 bg-white/60 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-2/3 bg-white/60 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }
  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
        <div className="bg-gradient-to-r from-purple-100 via-blue-50 to-pink-50 dark:from-purple-950/40 dark:via-blue-950/30 dark:to-pink-950/30 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
              <Sparkles className="w-6 h-6 text-purple-500 dark:text-purple-300"  />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Daily Study Brief
              </h2>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                Your study brief is taking a moment to load. Check back soon!
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            💡 Tip: Upload notes to generate personalized study guidance.
          </p>
        </div>
      </div>
    );
  }
  // ── Loaded (including welcome fallback returned by the backend) ───────────
  const time = _formatTimestamp(generatedAt);

  return (
    <div className="overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
      <div className="bg-gradient-to-r from-purple-100 via-blue-50 to-pink-50 dark:from-purple-950/40 dark:via-blue-950/30 dark:to-pink-950/30 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-6 h-6 text-purple-500 dark:text-purple-300" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-700 dark:text-purple-300">
                Daily Study Brief
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                Your personalized study update
              </h2>
            </div>
          </div>

          {time && (
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 mt-1">
              {time}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-gray-700 dark:text-gray-300 leading-7 text-[15px]">{brief}</p>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          💡 Tip: Stay consistent by uploading notes regularly and reviewing a quiz after each summary.
        </p>
      </div>
    </div>
  );
}
