/**
 * QuizSuggestions.jsx
 * Carousel of suggested document cards based on the user's weak topics.
 * Returns null when there are no suggestions.
 */

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

export default function QuizSuggestions({ suggestions = [], onSelectDoc }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const cards = suggestions.flatMap(({ topic, docs }) =>
    docs.map((doc) => ({ topic, doc }))
  );

  if (cards.length === 0) return null;

  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 288, behavior: "smooth" });
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Suggested for you
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Based on your recent performance, you should try to reinforce your learnings on the following
          </p>
        </div>

        {cards.length > 1 && (
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

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
      >
        {cards.map(({ topic, doc }) => (
          <div
            key={doc.id}
            className="shrink-0 w-64 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex flex-col gap-4 shadow-sm"
            style={{ scrollSnapAlign: "start" }}
          >
            <span className="self-start text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {topic}
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
              Generate Quiz →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
