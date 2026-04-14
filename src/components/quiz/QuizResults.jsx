/**
 * QuizResults.jsx
 * Displays quiz results: score summary, incorrect answer review,
 * weak topic analysis, and restart button.
 *
 * Receives all data and handlers as props from QuizPage.jsx.
 * Has no state of its own: purely presentational.
 */

import {
  layoutStyle,
  primaryButtonStyle,
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
}) {
  return (
    <div style={layoutStyle}>
      <div style={resultCardStyle}>

        {/* Header */}
        <div style={resultHeaderStyle}>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>Quiz Completed</h2>
          <p style={{ color: "#6b7280" }}>
            Here's how you did and what to focus on next
          </p>
        </div>

        {/* Score summary */}
        <div style={scoreSummaryStyle}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            Score: {result.score} / {result.total} ({result.percentage}%)
          </p>
        </div>

        {/* Incorrect answer review */}
        {result.incorrect?.length > 0 && (
          <div style={resultSectionStyle}>
            <h3 style={resultSectionTitleStyle}>Review Incorrect Answers</h3>
            {result.incorrect.map((x) => (
              <div key={x.question_index} style={reviewCardStyle}>
                <p style={reviewQuestionStyle}>
                  Question {x.question_index + 1}: {x.question}
                </p>
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
              </div>
            ))}
          </div>
        )}

        {/* Weak topic analysis — loading state */}
        {loadingAnalysis && (
          <div style={resultSectionStyle}>
            <p>Loading quiz analysis...</p>
          </div>
        )}

        {/* Weak topic analysis — results */}
        {!loadingAnalysis && weakTopics.length > 0 && (
          <div style={resultSectionStyle}>
            <h3 style={resultSectionTitleStyle}>Topic Performance</h3>
            <ul>
              {weakTopics.map((item) => (
                <li key={item.topic}>
                  {item.topic}: {item.average_score}%{" "}
                  {item.is_weak ? "(Weak)" : "(Strong)"}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

        <div style={restartButtonWrapperStyle}>
          {handleRetake && (
            <button onClick={handleRetake} style={primaryButtonStyle}>
              Retake Quiz
            </button>
          )}
          <button onClick={handleRestart} style={primaryButtonStyle}>
            Start New Quiz
          </button>
        </div>


      </div>
    </div>
  );
}