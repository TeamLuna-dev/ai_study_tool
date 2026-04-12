import { useState } from "react";
import { useQuizHistory } from "../../hooks/useQuizHistory";
import QuizAttemptDetail from "./QuizAttemptDetail";

export function QuizHistoryPage() {
  const {
    attempts,
    loading,
    error,
    page,
    totalPages,
    total,
    sortBy,
    order,
    topicFilter,
    startDate,
    endDate,
    setPage,
    applyFilters,
    applySort,
  } = useQuizHistory();

  const [selectedAttempt, setSelectedAttempt] = useState(null);

  if (selectedAttempt) {
    return (
      <QuizAttemptDetail
        attempt={selectedAttempt}
        onBack={() => setSelectedAttempt(null)}
      />
    );
  }

  const sortIcon = (field) => {
    if (sortBy !== field) return "";
    return order === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Quiz History</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Filter by topic..."
          value={topicFilter}
          onChange={(e) => applyFilters({ topic: e.target.value })}
          className="px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:border-blue-500"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => applyFilters({ start: e.target.value })}
          className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => applyFilters({ end: e.target.value })}
          className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      {loading && <p className="text-gray-300">Loading quiz history...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && attempts.length === 0 && (
        <p className="text-gray-400">No quiz attempts found.</p>
      )}

      {!loading && attempts.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="w-full text-left text-gray-200">
              <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
                <tr>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-white"
                    onClick={() => applySort("timestamp")}
                  >
                    Date{sortIcon("timestamp")}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-white"
                    onClick={() => applySort("topic")}
                  >
                    Topic{sortIcon("topic")}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-white"
                    onClick={() => applySort("score")}
                  >
                    Score{sortIcon("score")}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-white"
                    onClick={() => applySort("percentage")}
                  >
                    Percentage{sortIcon("percentage")}
                  </th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="border-b border-gray-700 hover:bg-gray-750 transition"
                  >
                    <td className="px-4 py-3">
                      {attempt.timestamp
                        ? new Date(attempt.timestamp).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{attempt.topic || "—"}</td>
                    <td className="px-4 py-3">
                      {attempt.score}/{attempt.total_questions}
                    </td>
                    <td className="px-4 py-3">
                      {attempt.percentage != null
                        ? `${attempt.percentage.toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedAttempt(attempt)}
                        className="text-blue-400 hover:text-blue-300 underline text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-gray-300">
            <span className="text-sm">
              Showing page {page} of {totalPages} ({total} total attempts)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
