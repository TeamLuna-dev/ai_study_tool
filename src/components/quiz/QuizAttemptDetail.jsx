import { useNavigate } from "react-router-dom";

export default function QuizAttemptDetail({ attempt, onBack }) {
  const navigate = useNavigate();
  if (!attempt) return null;

  function handleRetakeQuiz() {
    if (Array.isArray(attempt.questions) && attempt.questions.length > 0) {
      navigate("/quiz", { state: { questions: attempt.questions, topic: attempt.topic } });
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">Quiz Attempt Details</h1>
        {Array.isArray(attempt.questions) && attempt.questions.length > 0 && (
          <button
            onClick={handleRetakeQuiz}
            className="ml-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow"
          >
            Retake Quiz
          </button>
        )}
      </div>
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

      {Array.isArray(attempt.questions) && Array.isArray(attempt.answers) ? (
        <div>
          <h2 className="text-xl font-bold text-white mb-3">All Questions</h2>
          <div className="space-y-4">
            {attempt.questions.map((q, idx) => {
              const userIdx = Array.isArray(attempt.answers) ? attempt.answers[idx] : null;
              const correctIdx = q.correct_index;
              const isCorrect = userIdx === correctIdx;
              return (
                <div
                  key={idx}
                  className={`bg-gray-800 rounded-lg p-4 border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}
                >
                  <p className="text-gray-200 font-medium mb-2">
                    Q{idx + 1}: {q.question}
                  </p>
                  <ul className="mb-2">
                    {q.choices.map((choice, cidx) => (
                      <li
                        key={cidx}
                        className={
                          cidx === correctIdx
                            ? 'text-green-400 font-semibold'
                            : cidx === userIdx
                            ? 'text-red-400'
                            : 'text-gray-300'
                        }
                      >
                        {String.fromCharCode(65 + cidx)}. {choice}
                        {cidx === correctIdx ? ' (Correct)' : ''}
                        {cidx === userIdx && cidx !== correctIdx ? ' (Your answer)' : ''}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm">
                    Your answer: {userIdx != null && userIdx >= 0 ? q.choices[userIdx] : <span className="text-gray-400">No answer</span>}
                  </p>
                  <p className="text-sm">
                    Correct answer: {q.choices[correctIdx]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-gray-400">
          Detailed question data is not available for this attempt.
        </p>
      )}
    </div>
  );
}
