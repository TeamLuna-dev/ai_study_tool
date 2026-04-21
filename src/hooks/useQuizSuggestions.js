import { useState, useEffect } from "react";
import { getDocsByTopic } from "../services/libraryService";

export function useQuizSuggestions(weakTopics = [], uid) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid || weakTopics.length === 0) {
      setSuggestions([]);
      return;
    }

    async function fetchSuggestions() {
      setLoading(true);
      try {
        const results = await Promise.all(
          weakTopics.map((topic) => getDocsByTopic(uid, topic))
        );

        const seenIds = new Set();
        const deduped = [];

        weakTopics.forEach((topic, i) => {
          const docs = (results[i] || []).filter((d) => {
            if (seenIds.has(d.id)) return false;
            seenIds.add(d.id);
            return true;
          });
          if (docs.length > 0) deduped.push({ topic, docs });
        });

        setSuggestions(deduped);
      } catch (e) {
        console.warn("[useQuizSuggestions] Failed to fetch suggestions:", e.message);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [uid, weakTopics]);

  return { suggestions, loading };
}
