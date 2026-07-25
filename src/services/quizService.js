// Same-origin base avoids CORS preflights entirely
import API_BASE_URL from "../config/api";

export async function getWeakTopics(userId) {
  const res = await fetch(`${API_BASE_URL}/progress/weak-topics/${userId}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch weak topics (${res.status})`);
  }

  return data;

}

export async function getSessionSummary(userId) {
  const res = await fetch(`${API_BASE_URL}/progress/session-summary/${userId}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch session summary (${res.status})`);
  }

  return data;
}

export async function generateQuiz({ notes, docId, questionCount = 5 } = {}) {
  if (!notes && !docId) {
    throw new Error("Provide either notes or docId.");
  }

  const body = docId ? { doc_id: docId, question_count: questionCount } : { notes,  question_count: questionCount  };

  const res = await fetch(`${API_BASE_URL}/quiz/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Generate failed (${res.status})`);
  return data.quiz;
}

export async function scoreQuiz(quiz, answers, topic, user_id) {
  const res = await fetch(`${API_BASE_URL}/quiz/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quiz, answers, topic, user_id }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Score failed (${res.status})`);
  return data;
}

export async function getQuizHistory(userId, { topic, startDate, endDate, sortBy, order, page, perPage } = {}) {
  const params = new URLSearchParams();
  if (topic) params.set("topic", topic);
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  if (sortBy) params.set("sort_by", sortBy);
  if (order) params.set("order", order);
  if (page) params.set("page", page);
  if (perPage) params.set("per_page", perPage);

  const qs = params.toString();
  const res = await fetch(`${API_BASE_URL}/progress/quiz-attempts/${userId}${qs ? `?${qs}` : ""}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch quiz history (${res.status})`);
  }

  return data;
}

export async function getQuizAttemptById(userId, attemptId) {
  const res = await fetch(`${API_BASE_URL}/progress/quiz-attempts/${userId}/${attemptId}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch quiz attempt (${res.status})`);
  }

  return data;
}