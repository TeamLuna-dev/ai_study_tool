/**
 * QuizSuggestions.jsx
 * Carousel of suggested document cards for one weak topic at a time.
 * Shows topic pills to switch between topics when multiple exist.
 * Returns null when there are no suggestions.
 */

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

export default function QuizSuggestions({ suggestions = [], weakTopics = [], onSelectDoc }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeTopic, setActiveTopic] = useState(suggestions[0]?.topic ?? null);

  if (suggestions.length === 0) return null;

  const activeEntry = suggestions.find((s) => s.topic === activeTopic) ?? suggestions[0];
  const activeDocs = activeEntry?.docs ?? [];

  const weakEntry = weakTopics.find((t) => t.topic === activeEntry?.topic);
  const score = weakEntry ? Math.round(weakEntry.average_score) : null;

  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 288, behavior: "smooth" });
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  function handleTopicChange(topic) {
    setActiveTopic(topic);
    scrollRef.current?.scrollTo({ left: 0 });
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Suggested for you
        </h3>

        {activeDocs.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {score !== null && (
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          You scored <span className="font-semibold text-red-600 dark:text-red-400">{score}%</span> on <span className="font-semibold">{activeEntry?.topic}</span> here are some materials to help you improve:
        </p>
      )}

      {/* Topic pills: only when multiple topics have suggestions */}
      {suggestions.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {suggestions.map(({ topic }) => (
            <button
              key={topic}
              onClick={() => handleTopicChange(topic)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                topic === activeEntry?.topic
                  ? "bg-red-600 text-white"
                  : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex justify-center gap-4 overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
      >
        {activeDocs.map((doc) => (
          <div
            key={doc.id}
            className="shrink-0 w-64 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex flex-col gap-4 shadow-sm"
            style={{ scrollSnapAlign: "start" }}
          >
            <span className="self-start text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {activeEntry?.topic}
            </span>

            <div className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug">
                {doc.fileName}
              </p>
            </div>

            <button
              onClick={() => onSelectDoc(doc)}
              className="mt-auto w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Generate Quiz 
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
