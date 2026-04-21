/**
 * QuizAnswerReview.jsx
 * Presentational component, it displays incorrect answers with a show/hide toggle.
 * Owns the showAnswers toggle state. Returns null when there are no incorrect answers.
 */

import { useState } from "react";

export default function QuizAnswerReview({ incorrectAnswers = [], questions = [] }) {
  const [showAnswers, setShowAnswers] = useState(false);

  if (incorrectAnswers.length === 0) return null;

  return (
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
        {incorrectAnswers.map((x) => (
          <div
            key={x.question_index}
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
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
                      {questions?.[x.question_index]?.choices?.[x.your_index]}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
