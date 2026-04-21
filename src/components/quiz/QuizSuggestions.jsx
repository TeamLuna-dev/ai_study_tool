/**
 * QuizSuggestions.jsx
 * Carousel of suggested document cards based on the user's weak topics.
 * Returns null when there are no suggestions.
 */

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Suggested for you
        </h3>

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
            className="shrink-0 w-64 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
            style={{ scrollSnapAlign: "start" }}
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {doc.fileName}
              </p>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {topic}
              </p>
            </div>

            <button
              onClick={() => onSelectDoc(doc)}
              className="shrink-0 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Generate Quiz →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
