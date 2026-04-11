/**
 * QuizResults.jsx
 * Displays quiz results: score summary, incorrect answer review,
 * weak topic analysis, and restart button.
 *
 * Receives all data and handlers as props from QuizPage.jsx.
 * Has no state of its own: purely presentational.
 */

import { useState } from "react";
import {
  layoutStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  resultCardStyle,
  resultHeaderStyle,
  scoreSummaryStyle,
  resultSectionStyle,
  resultSectionTitleStyle,
  restartButtonWrapperStyle,
  reviewCardStyle,
  reviewQuestionStyle,
  reviewLabelStyle,
  correctAnswerStyle,
  incorrectAnswerStyle,
} from "./quizStyles";


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

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-md p-8 transition-colors">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Quiz Completed
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Here's how you did and what to focus on next
          </p>
        </div>

        {/* Score summary */}
        {(() => {
          const pct = result.percentage;
          const color = pct >= 80 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626";
          const bg   = pct >= 80 ? "#f0fdf4" : pct >= 60 ? "#fffbeb" : "#fef2f2";
          const border = pct >= 80 ? "#bbf7d0" : pct >= 60 ? "#fde68a" : "#fecaca";
          return (
            <div style={{ ...scoreSummaryStyle, backgroundColor: bg, borderColor: border }}>
              <p style={{ margin: 0, fontSize: 52, fontWeight: 800, color, lineHeight: 1 }}>
                {pct}%
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 18, fontWeight: 600, color }}>
                {pct >= 80 ? "Excellent!" : pct >= 60 ? "Good job!" : "Keep practicing!"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b7280" }}>
                {result.score} / {result.total} questions correct
              </p>
            </div>
          );
        })()}

        {/* Incorrect answer review */}
        {result.incorrect?.length > 0 && (
          <div style={resultSectionStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ ...resultSectionTitleStyle, marginBottom: 0 }}>Review Incorrect Answers</h3>
              <button
                onClick={() => setShowAnswers((prev) => !prev)}
                style={{ fontSize: 13, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
              >
                {showAnswers ? "Hide answers" : "Show answers"}
              </button>
            </div>
            {result.incorrect.map((x) => (
              <div key={x.question_index} style={reviewCardStyle}>
                <p style={reviewQuestionStyle}>
                  Question {x.question_index + 1}: {x.question}
                </p>
                {showAnswers && (
                  <>
                    <p style={{ margin: "6px 0" }}>
                      <span style={reviewLabelStyle}>Correct Answer: </span>
                      <span style={correctAnswerStyle}>{x.correct_choice}</span>
                    </p>
                    {x.your_index !== undefined && x.your_index >= 0 && (
                      <p style={{ margin: "6px 0" }}>
                        <span style={reviewLabelStyle}>Your Answer: </span>
                        <span style={incorrectAnswerStyle}>
                          {quiz?.questions?.[x.question_index]?.choices?.[x.your_index]}
                        </span>
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Weak topic analysis — loading */}
        {loadingAnalysis && (
          <div className="mb-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-5">
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
          <p className="text-red-500 dark:text-red-400 mt-3 mb-6">{error}</p>
        )}

        <div style={restartButtonWrapperStyle}>
          {handleRetake && (
            <button onClick={handleRetake} style={{ ...secondaryButtonStyle, flex: 1 }}>
              Retake Quiz
            </button>
          )}
          {handleRegenerate && (
            <button onClick={handleRegenerate} style={{ ...secondaryButtonStyle, flex: 1 }}>
              Regenerate
            </button>
          )}
          <button onClick={handleRestart} style={{ ...primaryButtonStyle, flex: 1 }}>
            Start New Quiz
          </button>
        </div>


      </div>
    </div>
  );
}