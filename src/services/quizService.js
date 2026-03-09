const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5001";

export async function generateQuiz(notes) {
  const res = await fetch(`${API_BASE}/api/quiz/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Generate failed (${res.status})`);
  return data.quiz;
}

export async function scoreQuiz(quiz, answers, topic) {
  const res = await fetch(`${API_BASE}/api/quiz/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quiz, answers, topic }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Score failed (${res.status})`);
  return data;
}