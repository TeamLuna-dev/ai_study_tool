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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white px-6 py-8 transition-colors">
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Quiz History</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Filter by topic..."
          value={topicFilter}
          onChange={(e) => applyFilters({ topic: e.target.value })}
          className="
              px-3 py-2 rounded-xl border
              border-gray-300 bg-white text-gray-900
              placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              dark:border-gray-700 dark:bg-gray-900 dark:text-white
              dark:placeholder-gray-500
            "
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => applyFilters({ start: e.target.value })}
          className="
              px-3 py-2 rounded-xl border
              border-gray-300 bg-white text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              dark:border-gray-700 dark:bg-gray-900 dark:text-white
            "
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => applyFilters({ end: e.target.value })}
          className="
              px-3 py-2 rounded-xl border
              border-gray-300 bg-white text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              dark:border-gray-700 dark:bg-gray-900 dark:text-white
            "
        />
      </div>

      {loading && (
          <p className="text-gray-500 dark:text-gray-400">
            Loading quiz history...
          </p>
        )}

        {error && (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        )}

        {!loading && !error && attempts.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500">
            No quiz attempts found.
          </p>
        )}

      {!loading && attempts.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase text-xs">
                <tr>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    onClick={() => applySort("timestamp")}
                  >
                    Date{sortIcon("timestamp")}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    onClick={() => applySort("topic")}
                  >
                    Topic{sortIcon("topic")}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    onClick={() => applySort("score")}
                  >
                    Score{sortIcon("score")}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-gray-900 dark:hover:text-white"
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
                    className="
                        border-t border-gray-200 hover:bg-gray-50
                        dark:border-gray-700 dark:hover:bg-gray-800
                        transition
                      "
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
                        className="
                            text-blue-600 hover:text-blue-700 underline text-sm
                            dark:text-blue-400 dark:hover:text-blue-300
                          "
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
          <div className="flex items-center justify-between mt-4 text-gray-500 dark:text-gray-400">
            <span className="text-sm">
              Showing page {page} of {totalPages} ({total} total attempts)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="
                    rounded-xl px-3 py-1
                    bg-gray-200 hover:bg-gray-300
                    dark:bg-gray-800 dark:hover:bg-gray-700
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="
                    rounded-xl px-3 py-1
                    bg-gray-200 hover:bg-gray-300
                    dark:bg-gray-800 dark:hover:bg-gray-700
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
              >
                Next
              </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}