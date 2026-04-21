/**
 * QuizTopicAnalysis.jsx
 * Presentational component — displays topic performance as color-coded progress bars.
 * Returns null when not loading and no topics exist.
 */

export default function QuizTopicAnalysis({ weakTopics = [], loading }) {
  if (loading) {
    return (
      <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-300">Loading quiz analysis...</p>
      </div>
    );
  }

  if (weakTopics.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Topic Performance
      </h3>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-5 space-y-4">
        {weakTopics.map((item) => {
          const score = Math.round(item.average_score);
          const color =
            score > 60
              ? { bar: "bg-green-400 dark:bg-green-500", text: "text-green-600 dark:text-green-400" }
              : score > 30
              ? { bar: "bg-yellow-400 dark:bg-yellow-500", text: "text-yellow-600 dark:text-yellow-400" }
              : { bar: "bg-red-400 dark:bg-red-500", text: "text-red-600 dark:text-red-400" };

          return (
            <div key={item.topic}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {item.topic}
                </span>
                <span className={`text-sm font-semibold ${color.text}`}>
                  {score}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${color.bar}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
