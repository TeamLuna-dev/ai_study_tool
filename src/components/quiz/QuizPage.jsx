import { useState } from "react";

// Mock quiz data for demonstration purposes
const mockQuiz = {
  questions: [
    {
      question: "What does a cosmological argument attempt to prove?",
      choices: [
        "The morality of human actions",
        "The existence of God",
        "The meaning of life",
        "The truth of revelation",
      ],
      correct_index: 1,
    },
    {
      question: "Which domain does a cosmological argument belong to?",
      choices: [
        "Mystical theology",
        "Natural theology",
        "Ethical philosophy",
        "Revelatory theology",
      ],
      correct_index: 1,
    },
  ],
};

// QuizPage component renders a simple quiz interface using the mockQuiz data.
export function QuizPage() {
  const questions = mockQuiz.questions;

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);

  const q = questions[current];

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2>
        Question {current + 1} / {questions.length}
      </h2>

      <p style={{ fontSize: 18 }}>{q.question}</p>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {q.choices.map((choice, idx) => (
          <button
            key={idx}
            onClick={() => setSelected(idx)}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              textAlign: "left",
              backgroundColor: selected === idx ? "#4f46e5" : "#f3f4f6",
              color: selected === idx ? "white" : "black",
              cursor: "pointer",
            }}
          >
            {choice}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16, color: "#555" }}>
        Selected:{" "}
        {selected === null ? "None" : `${String.fromCharCode(65 + selected)}`}
      </div>

    </div>
  );
}