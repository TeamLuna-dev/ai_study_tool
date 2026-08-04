import { useState, useEffect, useCallback } from "react";
import { getQuizHistory } from "../services/quizService";
import { useAuth } from "./useAuth";

export function useQuizHistory() {
  const { user } = useAuth();

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Sorting
  const [sortBy, setSortBy] = useState("timestamp");
  const [order, setOrder] = useState("desc");

  // Filters
  const [topicFilter, setTopicFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      // uid is derived server-side from this token, not sent in the URL
      const idToken = await user.getIdToken();
      const data = await getQuizHistory(idToken, {
        topic: topicFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        order,
        page,
        perPage,
      });
      setAttempts(data.attempts || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user, topicFilter, startDate, endDate, sortBy, order, page, perPage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Reset to page 1 when filters or sorting change
  const applyFilters = useCallback(({ topic, start, end } = {}) => {
    if (topic !== undefined) setTopicFilter(topic);
    if (start !== undefined) setStartDate(start);
    if (end !== undefined) setEndDate(end);
    setPage(1);
  }, []);

  const applySort = useCallback((field) => {
    if (field === sortBy) {
      setOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setOrder("desc");
    }
    setPage(1);
  }, [sortBy]);

  return {
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
    refresh: fetchHistory,
  };
}
