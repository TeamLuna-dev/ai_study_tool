const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5001";

export async function getWeakTopics(userId) {
  const res = await fetch(`http://127.0.0.1:5002/weak-topics/${userId}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch weak topics (${res.status})`);
  }

  return data;

}

export async function getSessionSummary(userId) {
  const res = await fetch(`http://127.0.0.1:5000/session-summary/${userId}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch session summary (${res.status})`);
  }

  return data;
}

export async function generateQuiz({ notes, docId } = {}) {
  if (!notes && !docId) {
    throw new Error("Provide either notes or docId.");
  }

  const body = docId ? { doc_id: docId } : { notes };

  const res = await fetch(`${API_BASE}/api/quiz/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Generate failed (${res.status})`);
  return data.quiz;
}

export async function scoreQuiz(quiz, answers, topic, user_id) {
  const res = await fetch(`${API_BASE}/api/quiz/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quiz, answers, topic, user_id }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Score failed (${res.status})`);
  return data;
}