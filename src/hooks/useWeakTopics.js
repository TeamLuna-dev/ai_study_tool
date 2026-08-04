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

    async function loadWeakTopics() {
      setLoading(true);
      try {
        // uid is derived server-side from this token, not sent in the URL
        const idToken = await user.getIdToken();
        const topics = await getWeakTopics(idToken);
        // Sort ascending by average_score
        const sorted = [...topics].sort((a, b) => (a.average_score ?? 0) - (b.average_score ?? 0));
        setWeakTopics(sorted);
      } catch (err) {
        setError(err.message || "Failed to load weak topics");
      } finally {
        setLoading(false);
      }
    }

    loadWeakTopics();
  }, [user]);

  return { weakTopics, loading, error };
}
