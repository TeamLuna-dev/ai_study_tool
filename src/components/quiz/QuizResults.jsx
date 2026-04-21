/**
 * QuizResults.jsx
 * Displays quiz results: score summary, incorrect answer review,
 * weak topic analysis, and restart button.
 *
 * Receives all data and handlers as props from QuizPage.jsx.
 * Has no state of its own: purely presentational.
 */

import QuizScoreBanner from "./QuizScoreBanner";
import QuizAnswerReview from "./QuizAnswerReview";

export default function QuizResults({
  result,
  quiz,
  weakTopics,
  loadingAnalysis,
  error,
  handleRestart,
  handleRetake,
  handleRegenerate,
}) {
  const pct = result.percentage;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
      <div className="w-full max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold">Quiz Completed</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Here's how you did and what to focus on next
          </p>
        </div>

        <QuizScoreBanner pct={pct} score={result.score} total={result.total} />

        <QuizAnswerReview
          incorrectAnswers={result.incorrect ?? []}
          questions={quiz?.questions ?? []}
        />

        {/* Weak topic analysis — loading */}
        {loadingAnalysis && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-300">
              Loading quiz analysis...
            </p>
          </div>
        )}

        {/* Weak topic analysis — results */}
        {!loadingAnalysis && weakTopics.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Topic Performance
            </h3>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-5">
              <ul className="space-y-3">
                {weakTopics.map((item) => (
                  <li
                    key={item.topic}
                    className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="text-gray-800 dark:text-gray-200 font-medium">
                      {item.topic}
                    </span>

                    <span
                      className={
                        item.is_weak
                          ? "text-red-600 dark:text-red-400 text-sm font-semibold"
                          : "text-green-600 dark:text-green-400 text-sm font-semibold"
                      }
                    >
                      {item.average_score}% {item.is_weak ? "(Weak)" : "(Strong)"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {error && (
          <p className="mb-6 text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex gap-3">
          {handleRetake && (
            <button onClick={handleRetake} className="flex-1 rounded-2xl border border-gray-300 px-5 py-3 font-semibold hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
              Retake Quiz
            </button>
          )}
          {handleRegenerate && (
            <button onClick={handleRegenerate} className="flex-1 rounded-2xl border border-gray-300 px-5 py-3 font-semibold hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
              Regenerate
            </button>
          )}
          <button onClick={handleRestart} className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400">
            Start New Quiz
          </button>
        </div>


      </div>
    </div>
  );
}