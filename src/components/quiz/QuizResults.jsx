/**
 * QuizResults.jsx
 * Displays quiz results: score summary, incorrect answer review,
 * weak topic analysis, and restart button.
 *
 * Receives all data and handlers as props from QuizPage.jsx.
 * Has no state of its own: purely presentational.
 */

import { useState } from "react";

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
  const [showAnswers, setShowAnswers] = useState(false);

  const pct = result.percentage;

  const scoreStyle =
    pct >= 80
      ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
      : pct >= 60
      ? "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300"
      : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300";

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

        {/* Score summary */}
        <div
          className={`mb-8 rounded-2xl border p-6 text-center ${scoreStyle}`}
        >
          <p className="text-5xl font-extrabold">{pct}%</p>
          <p className="mt-2 text-lg font-semibold">
            {pct >= 80
              ? "Excellent!"
              : pct >= 60
              ? "Good job!"
              : "Keep practicing!"}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {result.score} / {result.total} correct
          </p>
        </div>

        {/* Incorrect answer review */}
        {result.incorrect?.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Review Incorrect Answers</h3>
              <button
                onClick={() => setShowAnswers((prev) => !prev)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {showAnswers ? "Hide answers" : "Show answers"}
              </button>
            </div>

            <div className="space-y-4">
            {result.incorrect.map((x) => (
              <div key={x.question_index} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Question {x.question_index + 1}: {x.question}
                </p>

                {showAnswers && (
                  <div className="mt-2 text-sm">
                      <p>
                        <span className="font-medium">Correct: </span>
                        <span className="text-green-600 dark:text-green-400">
                          {x.correct_choice}
                        </span>
                      </p>

                    {x.your_index !== undefined && x.your_index >= 0 && (
                      <p>
                        <span className="font-medium">Your answer: </span>
                        <span className="text-red-600 dark:text-red-400">
                          {quiz?.questions?.[x.question_index]?.choices?.[x.your_index]}
                        </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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