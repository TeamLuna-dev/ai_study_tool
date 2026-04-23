/**
 * QuizSuggestionCard.jsx
 * Suggests a document to quiz on based on the user's worst-performing topic.
 * Returns null while loading or when no matching document exists.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useQuizSuggestions } from "../../hooks/useQuizSuggestions";
import { getWeakTopics } from "../../services/quizService";

export function QuizSuggestionCard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [weakTopics, setWeakTopics] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    getWeakTopics(user.uid)
      .then((data) => {
        const sorted = (Array.isArray(data) ? data : []).sort(
          (a, b) => a.average_score - b.average_score
        );
        setWeakTopics(sorted);
      })
      .catch(() => {});
  }, [user?.uid]);

  const weakTopicNames = useMemo(
    () => weakTopics.map((t) => t.topic),
    [weakTopics]
  );

  const { suggestions, loading } = useQuizSuggestions(weakTopicNames, user?.uid);

  const topSuggestion = suggestions[0];
  const doc = topSuggestion?.docs?.[0];
  const weakEntry = weakTopics.find((t) => t.topic === topSuggestion?.topic);
  const score = weakEntry ? Math.round(weakEntry.average_score) : null;

  if (loading || !doc) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 transition-colors duration-300">
      <p className="text-xs font-semibold uppercase tracking-wide text-red-500 dark:text-red-400 mb-1">
        Suggested Quiz
      </p>

      {score !== null && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          You scored{" "}
          <span className="font-semibold text-red-600 dark:text-red-400">{score}%</span>{" "}
          on <span className="font-semibold">{topSuggestion.topic}</span> try reinforcing it
        </p>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {doc.fileName}
          </p>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {topSuggestion.topic}
          </span>
        </div>
      </div>

      <button
        onClick={() => navigate("/quiz", { state: { doc } })}
        className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Generate Quiz
      </button>
    </div>
  );
}
