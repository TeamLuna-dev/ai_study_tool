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
  const isLast = current === questions.length - 1;
  const [score, setScore] = useState(0); // Implementas scoring logic based on correct_index
  const [finished, setFinished] = useState(false); // this state conditionally render a "Quiz Completed" at the end of the quiz

  function handleNext() {
  if (selected === null) return;

  if (selected === q.correct_index) {
    setScore((s) => s + 1);
  }

  if (!isLast) {
    setCurrent((c) => c + 1);
    setSelected(null);
  } else {
    setFinished(true);
  }
  }

if (finished) {
  return (
    <div style={{ padding: 24 }}>
      <h2>Quiz Completed</h2>
      <p>Score: {score} / {questions.length}</p>

      <button
        onClick={() => {
          setCurrent(0);
          setSelected(null);
          setScore(0);
          setFinished(false);
        }}
        style={{ marginTop: 16 }}
      >
        Restart Quiz
      </button>
    </div>
  );
}
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

            <button
  onClick={handleNext}
  disabled={selected === null}
  style={{ marginTop: 16 }}
>
  {isLast ? "Finish" : "Next"}
</button>

    </div>
  );
};
