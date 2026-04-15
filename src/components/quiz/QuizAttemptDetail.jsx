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
    <div className="min-h-screen bg-gray-50 px-6 py-8 text-gray-900 transition-colors dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-3xl">
       <div className="mb-2 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quiz Attempt Details
          </h1>

        {Array.isArray(attempt.questions) && attempt.questions.length > 0 && (
          <button
            onClick={handleRetakeQuiz}
            className="
                ml-4 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow
                transition hover:bg-blue-700
                dark:bg-blue-500 dark:hover:bg-blue-400
              "
          >
            Retake Quiz
          </button>
        )}
      </div>
      <button
        onClick={onBack}
        className="
            mb-4 inline-block text-blue-600 transition hover:text-blue-700
            dark:text-blue-400 dark:hover:text-blue-300
          "
      >
        ← Back to Quiz History
      </button>

      <h1 className="text-3xl font-bold text-white mb-2">Quiz Attempt Details</h1>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 text-gray-800 dark:text-gray-200 sm:grid-cols-2">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Topic</span>
            <p className="text-lg font-semibold">{attempt.topic || "—"}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Date</span>
            <p className="text-lg font-semibold">
              {attempt.timestamp
                ? new Date(attempt.timestamp).toLocaleString()
                : "—"}
            </p>
          </div>

          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Score</span>
            <p className="text-lg font-semibold">
              {attempt.score}/{attempt.total_questions}
            </p>
          </div>

          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
                Percentage
              </span>
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

          <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
              All Questions
            </h2>

          <div className="space-y-4">
            {attempt.questions.map((q, idx) => {
              const userIdx = Array.isArray(attempt.answers) ? attempt.answers[idx] : null;
              const correctIdx = q.correct_index;
              const isCorrect = userIdx === correctIdx;

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border-l-4 border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 ${
                      isCorrect
                        ? "border-l-green-500"
                        : "border-l-red-500"
                    }`}
                >
                  <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                    Q{idx + 1}: {q.question}
                  </p>
                  <ul className="mb-2 space-y-1">
                    {q.choices.map((choice, cidx) => (
                      <li
                        key={cidx}
                        className={
                          cidx === correctIdx
                            ? "font-semibold text-green-600 dark:text-green-400"
                            : cidx === userIdx
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-700 dark:text-gray-300"
                        }
                      >
                        {String.fromCharCode(65 + cidx)}. {choice}
                        {cidx === correctIdx ? ' (Correct)' : ''}
                        {cidx === userIdx && cidx !== correctIdx ? ' (Your answer)' : ''}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Your answer:{" "}
                      {userIdx != null && userIdx >= 0 ? (
                        q.choices[userIdx]
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          No answer
                        </span>
                      )}
                    </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Correct answer: {q.choices[correctIdx]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
          

      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Detailed question data is not available for this attempt.
        </p>
      )}
      </div>
    </div>
  );
}
