import React, { useState } from "react";
import { Copy } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useDocuments } from "../../hooks/useDocuments";
import { useSummarizer } from "../../hooks/useSummarizer";

// Matches the label categories used in RecentDocuments FILE_TYPE_STYLES
function getFileTypeLabel(fileType) {
  const t = (fileType ?? "").toLowerCase();
  if (t === "pdf") return "PDF";
  if (["png", "jpg", "jpeg"].includes(t)) return "Image";
  return "File";
}

export function SummarizerPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { docs, loading: docsLoading } = useDocuments(uid);
  const { summary, loading, error, generate, clearSummary } = useSummarizer();

  const [selectedDocId, setSeletedDocId] = useState("");
  const [text, setText] = useState("");
  const [summaryStyle, setSummaryStyle] = useState("study-notes");
  const [copied, setCopied] = useState(false);

  const canSubmit = !!(selectedDocId || text.trim()) && !loading;

  function handleDocSelect(e) {
    setSeletedDocId(e.target.value);
    setText("");
  }

  function handleTextChange(e) {
    setText(e.target.value);
    setSeletedDocId("");
  }

  function handleSummarize() {
    if (!canSubmit) return;
    generate(selectedDocId ? { docId: selectedDocId } : { text });
  }

  function handleClear() {
    setSeletedDocId("");
    setText("");
    setSummaryStyle("study-notes");
    clearSummary();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-gray-900 dark:bg-gray-950 dark:text-white transition-colors duration-300">

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="h-[260px] w-full bg-cover bg-center"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(37, 99, 235, 0.85), rgba(79, 70, 229, 0.75), rgba(147, 51, 234, 0.65)),
              url("/AIWepapp.jpg")
            `,
          }}
        />

        <div className="pointer-events-none absolute inset-0 bg-black/10 dark:bg-black/25" />
        <div className="pointer-events-none absolute -top-10 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl" />

        <div className="absolute inset-0 flex items-center max-w-7xl mx-auto px-6">
          <div className="text-white max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold">
              Turn your notes into clear summaries
            </h1>
            <p className="mt-3 text-lg text-blue-100 dark:text-blue-200">
              Select an uploaded document or paste your notes and generate
              a clean AI summary in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT col ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Input card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md p-8 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-none w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-7 h-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                    />
                  </svg>
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    AI Notes Summary
                  </h2>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Select a document or paste your material below.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">

                {/* Document dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select an uploaded document
                  </label>
                  <select
                    data-testid="document-select"
                    value={selectedDocId}
                    onChange={handleDocSelect}
                    disabled={docsLoading}
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                  >
                    <option value="">— Choose a document —</option>
                    {docs.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.fileName ?? "Unnamed"} [{getFileTypeLabel(doc.fileType)}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    or paste text below
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Textarea */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your notes or text
                  </label>
                  <textarea
                    data-testid="text-input"
                    value={text}
                    onChange={handleTextChange}
                    disabled={!!selectedDocId}
                    rows={10}
                    placeholder="Paste your lecture notes, textbook content, or study material here..."
                    className="w-full rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:text-gray-400"
                  />
                </div>

                {/* Summary style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Summary style
                  </label>
                  <select
                    value={summaryStyle}
                    onChange={(e) => setSummaryStyle(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="study-notes">Study Notes</option>
                    <option value="concise">Concise Summary</option>
                    <option value="bullet-points">Bullet Points</option>
                    <option value="key-concepts">Key Concepts</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    data-testid="generate-button"
                    onClick={handleSummarize}
                    disabled={!canSubmit}
                    className={`px-6 py-3 rounded-2xl font-semibold text-white transition ${
                      !canSubmit
                        ? "bg-blue-300 dark:bg-blue-800 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                    }`}
                  >
                    {loading ? "Generating..." : "Generate Summary"}
                  </button>

                  <button
                    onClick={handleClear}
                    type="button"
                    className="px-6 py-3 rounded-2xl font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Clear
                  </button>
                </div>

                {/* Error state */}
                {error && (
                  <div
                    role="alert"
                    data-testid="error-alert"
                    className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50"
                  >
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    <button
                      onClick={handleSummarize}
                      className="shrink-0 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 underline"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Result card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 transition-colors">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Generated Summary
              </h3>

              {/* Empty state */}
              {!summary && !loading && !error && (
                <div className="mt-5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-10 text-center transition-colors">
                  <div className="text-4xl mb-3">✨</div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                    Your summary will appear here
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Select a document or paste notes above and click "Generate Summary".
                  </p>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div
                  data-testid="loading-skeleton"
                  className="mt-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-6 animate-pulse space-y-3 transition-colors"
                >
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-4/6" />
                </div>
              )}

              {/* Summary result */}
              {summary && !loading && (
                <div data-testid="summary-result" className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Summary ready</span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-6 transition-colors">
                    <p className="text-gray-700 dark:text-gray-300 leading-7 whitespace-pre-line">
                      {summary}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md p-6 transition-colors">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                How it works
              </h3>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4 transition-colors">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    1. Select or paste your material
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Pick an uploaded document or add notes directly.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4 transition-colors">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    2. Choose a summary style
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Pick the format that helps you study best.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4 transition-colors">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    3. Generate and review
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    AI creates a summary you can copy and use for quick review.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/40 dark:to-blue-950/30 rounded-3xl border border-purple-100 dark:border-purple-900/40 shadow-sm p-6 transition-colors">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Tips for better summaries
              </h3>

              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Paste clean and readable notes</li>
                <li>• Use smaller sections for more focused results</li>
                <li>• Try "Bullet Points" for quick review</li>
                <li>• Use "Key Concepts" before quizzes</li>
              </ul>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
