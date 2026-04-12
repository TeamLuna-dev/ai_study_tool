export default function QuizAttemptDetail({ attempt, onBack }) {
  if (!attempt) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={onBack}
        className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
      >
        ← Back to Quiz History
      </button>

      <h1 className="text-3xl font-bold text-white mb-2">Quiz Attempt Details</h1>

      <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow">
        <div className="grid grid-cols-2 gap-4 text-gray-200">
          <div>
            <span className="text-gray-400 text-sm">Topic</span>
            <p className="text-lg font-semibold">{attempt.topic || "—"}</p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Date</span>
            <p className="text-lg font-semibold">
              {attempt.timestamp
                ? new Date(attempt.timestamp).toLocaleString()
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Score</span>
            <p className="text-lg font-semibold">
              {attempt.score}/{attempt.total_questions}
            </p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Percentage</span>
            <p className="text-lg font-semibold">
              {attempt.percentage != null
                ? `${attempt.percentage.toFixed(1)}%`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {attempt.incorrect && attempt.incorrect.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-3">Incorrect Answers</h2>
          <div className="space-y-4">
            {attempt.incorrect.map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-800 rounded-lg p-4 border-l-4 border-red-500"
              >
                <p className="text-gray-200 font-medium mb-2">
                  Q{item.question_index + 1}: {item.question}
                </p>
                <p className="text-red-400 text-sm">
                  Your answer: {item.your_answer || `Choice ${item.your_index + 1}`}
                </p>
                <p className="text-green-400 text-sm">
                  Correct answer: {item.correct_choice}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!attempt.incorrect || attempt.incorrect.length === 0) && (
        <p className="text-gray-400">
          {attempt.score === attempt.total_questions
            ? "Perfect score! All answers were correct."
            : "Detailed question data is not available for this attempt."}
        </p>
      )}
    </div>
  );
}
