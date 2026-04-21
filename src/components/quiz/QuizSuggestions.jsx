export default function QuizSuggestions({ suggestions = [], onSelectDoc }) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        Suggested for you
      </h3>

      <div className="space-y-3">
        {suggestions.map(({ topic, docs }) =>
          docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
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
          ))
        )}
      </div>
    </div>
  );
}
