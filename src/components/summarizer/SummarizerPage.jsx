import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useDocuments } from "../../hooks/useDocuments";
import { useSummarizer } from "../../hooks/useSummarizer";
import { Card } from "../common/Card";
import { Button } from "../common/Button";

// Matches the label categories used in RecentDocuments FILE_TYPE_STYLES.
// Audio keys are the raw stored fileType per mimetype (mp3="mpeg", m4a
// comes in as either "mp4" or "x-m4a" depending on how the browser reports it).
function getFileTypeLabel(fileType) {
  const t = (fileType ?? "").toLowerCase();
  if (t === "pdf") return "PDF";
  if (["png", "jpg", "jpeg"].includes(t)) return "Image";
  if (["mpeg", "mp4", "x-m4a", "wav"].includes(t)) return "Audio";
  return "File";
}

// Shared border/focus treatment for select + textarea controls
const FIELD_CLASS = `
  w-full rounded-xl border border-hairline dark:border-gray-700
  bg-white dark:bg-gray-800 text-ink dark:text-white
  focus:outline-none focus:border-gilt-600 focus:ring-2 focus:ring-gilt-100
  disabled:opacity-50
`;

export function SummarizerPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { docs, loading: docsLoading } = useDocuments(uid);
  const { summary, loading, error, generate, clearSummary } = useSummarizer();
  const [searchParams] = useSearchParams();

  const [selectedDocId, setSelectedDocId] = useState("");
  const [text, setText] = useState("");
  const [summaryStyle, setSummaryStyle] = useState("study-notes");
  const [copied, setCopied] = useState(false);

  const canSubmit = !!(selectedDocId || text.trim()) && !loading;

  // Preselect from ?doc=<id> once docs resolve; ignore ids not in the list.
  useEffect(() => {
    if (docsLoading) return;
    const docParam = searchParams.get("doc");
    if (!docParam) return;
    if (docs.some((d) => d.id === docParam)) {
      setSelectedDocId(docParam);
      setText("");
    }
  }, [docsLoading, docs, searchParams]);

  function handleDocSelect(e) {
    setSelectedDocId(e.target.value);
    setText("");
  }

  function handleTextChange(e) {
    setText(e.target.value);
    setSelectedDocId("");
  }

  function handleSummarize() {
    if (!canSubmit) return;
    generate({ ...(selectedDocId ? { docId: selectedDocId } : { text }), style: summaryStyle });
  }

  function handleClear() {
    setSelectedDocId("");
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
    <div className="min-h-screen bg-paper text-ink dark:bg-gray-950 dark:text-white transition-colors duration-300">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink dark:text-white">
            Turn your notes into clear summaries
          </h1>
          <p className="mt-2 text-ink-soft dark:text-gray-400">
            Select an uploaded document or paste your notes and generate a
            clean AI summary in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT col ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Input card */}
            <Card className="p-6 sm:p-8">
              <div className="space-y-5">

                {/* Document dropdown */}
                <div>
                  <label className="block text-sm font-medium text-ink-soft dark:text-gray-300 mb-2">
                    Select an uploaded document
                  </label>
                  <select
                    data-testid="document-select"
                    value={selectedDocId}
                    onChange={handleDocSelect}
                    disabled={docsLoading}
                    className={FIELD_CLASS}
                  >
                    <option value="">— Choose a document —</option>
                    {docs.map((doc) => (
                      <option key={doc.id} value={doc.id} disabled={doc.status !== "ready"}>
                        {doc.fileName ?? "Unnamed"} [{getFileTypeLabel(doc.fileType)}]
                        {doc.status !== "ready" ? ` — ${doc.status}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-hairline dark:bg-gray-700" />
                  <span className="text-xs text-ink-faint dark:text-gray-500 font-medium">
                    or paste text below
                  </span>
                  <div className="flex-1 h-px bg-hairline dark:bg-gray-700" />
                </div>

                {/* Textarea */}
                <div>
                  <label className="block text-sm font-medium text-ink-soft dark:text-gray-300 mb-2">
                    Your notes or text
                  </label>
                  <textarea
                    data-testid="text-input"
                    value={text}
                    onChange={handleTextChange}
                    disabled={!!selectedDocId}
                    rows={10}
                    placeholder="Paste your lecture notes, textbook content, or study material here..."
                    className={`${FIELD_CLASS} px-4 py-4 resize-none`}
                  />
                </div>

                {/* Summary style */}
                <div>
                  <label className="block text-sm font-medium text-ink-soft dark:text-gray-300 mb-2">
                    Summary style
                  </label>
                  <select
                    value={summaryStyle}
                    onChange={(e) => setSummaryStyle(e.target.value)}
                    className={FIELD_CLASS}
                  >
                    <option value="study-notes">Study Notes</option>
                    <option value="concise">Concise Summary</option>
                    <option value="bullet-points">Bullet Points</option>
                    <option value="key-concepts">Key Concepts</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    data-testid="generate-button"
                    onClick={handleSummarize}
                    disabled={!canSubmit}
                  >
                    {loading ? "Generating..." : "Generate Summary"}
                  </Button>

                  <Button variant="ghost" onClick={handleClear} type="button">
                    Clear
                  </Button>
                </div>

                {/* Error state */}
                {error && (
                  <div
                    role="alert"
                    data-testid="error-alert"
                    className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50"
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
            </Card>

            {/* Result card */}
            <Card className="p-6 sm:p-8">
              <h3 className="text-xl font-bold text-ink dark:text-white">
                Generated Summary
              </h3>

              {/* Empty state */}
              {!summary && !loading && !error && (
                <div className="mt-5 rounded-xl border-2 border-dashed border-hairline dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-10 text-center transition-colors">
                  <div className="text-4xl mb-3">✨</div>
                  <p className="text-lg font-medium text-ink dark:text-gray-200">
                    Your summary will appear here
                  </p>
                  <p className="mt-2 text-sm text-ink-soft dark:text-gray-400">
                    Select a document or paste notes above and click "Generate Summary".
                  </p>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div
                  data-testid="loading-skeleton"
                  className="mt-5 rounded-xl border border-hairline dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-6 animate-pulse space-y-3 transition-colors"
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
                    <span className="text-xs text-ink-faint dark:text-gray-500">Summary ready</span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-medium text-ink-soft dark:text-gray-400 hover:text-gilt-ink dark:hover:text-gilt-400 px-2.5 py-1.5 rounded-lg hover:bg-gilt-wash dark:hover:bg-gilt-950 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="rounded-xl border border-hairline dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-6 transition-colors">
                    <p className="text-ink-soft dark:text-gray-300 leading-7 whitespace-pre-line">
                      {summary}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* ── RIGHT sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-ink dark:text-white">
                How it works
              </h3>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-hairline dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4 transition-colors">
                  <p className="font-semibold text-ink dark:text-gray-200">
                    1. Select or paste your material
                  </p>
                  <p className="mt-1 text-sm text-ink-soft dark:text-gray-400">
                    Pick an uploaded document or add notes directly.
                  </p>
                </div>

                <div className="rounded-xl border border-hairline dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4 transition-colors">
                  <p className="font-semibold text-ink dark:text-gray-200">
                    2. Choose a summary style
                  </p>
                  <p className="mt-1 text-sm text-ink-soft dark:text-gray-400">
                    Pick the format that helps you study best.
                  </p>
                </div>

                <div className="rounded-xl border border-hairline dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4 transition-colors">
                  <p className="font-semibold text-ink dark:text-gray-200">
                    3. Generate and review
                  </p>
                  <p className="mt-1 text-sm text-ink-soft dark:text-gray-400">
                    AI creates a summary you can copy and use for quick review.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gilt-wash dark:bg-gilt-950/40">
              <h3 className="text-xl font-bold text-ink dark:text-white">
                Tips for better summaries
              </h3>

              <ul className="mt-4 space-y-2 text-sm text-ink-soft dark:text-gray-300">
                <li>• Paste clean and readable notes</li>
                <li>• Use smaller sections for more focused results</li>
                <li>• Try "Bullet Points" for quick review</li>
                <li>• Use "Key Concepts" before quizzes</li>
              </ul>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
