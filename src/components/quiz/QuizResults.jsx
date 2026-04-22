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
import QuizTopicAnalysis from "./QuizTopicAnalysis";
import QuizSuggestions from "./QuizSuggestions";

export default function QuizResults({
  result,
  quiz,
  weakTopics,
  loadingAnalysis,
  suggestions,
  suggestionsLoading,
  onSelectDoc,
  error,
  handleRestart,
  handleRetake,
  handleRegenerate,
}) {
  const pct = result.percentage;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold">Quiz Completed</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Here's how you did and what to focus on next
          </p>
        </div>

        {/* Score hero */}
        <QuizScoreBanner pct={pct} score={result.score} total={result.total} />

        {/* Actions */}
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

        {/* Answer review + topic analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <QuizAnswerReview
              incorrectAnswers={result.incorrect ?? []}
              questions={quiz?.questions ?? []}
            />
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <QuizTopicAnalysis weakTopics={weakTopics} loading={loadingAnalysis} />
          </div>
        </div>

        {/* Suggestions */}
        {suggestionsLoading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Finding study materials...</p>
        ) : (
          <QuizSuggestions suggestions={suggestions} onSelectDoc={onSelectDoc} />
        )}

        {error && (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        )}

      </div>
    </div>
  );
}