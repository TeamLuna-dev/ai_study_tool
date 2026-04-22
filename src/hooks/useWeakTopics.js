import { useEffect, useState } from "react";
import { getWeakTopics } from "../services/quizService.js";
import { useAuth } from "./useAuth";

export function useWeakTopics() {
  const { user } = useAuth();
  const [weakTopics, setWeakTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setWeakTopics([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getWeakTopics(user.uid)
      .then((topics) => {
        // Sort ascending by average_score
        const sorted = [...topics].sort((a, b) => (a.average_score ?? 0) - (b.average_score ?? 0));
        setWeakTopics(sorted);
      })
      .catch((err) => setError(err.message || "Failed to load weak topics"))
      .finally(() => setLoading(false));
  }, [user]);

  return { weakTopics, loading, error };
}
