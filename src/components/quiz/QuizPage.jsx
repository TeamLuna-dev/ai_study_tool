import { useState } from "react";
import { generateQuiz, scoreQuiz } from "../../services/quizService";

// Kept same UI structure as before for simplicity... to be improved later. 
// Note: Design is wacky now, will apply OCP later on
// Connects to the backend ans wanted!
export function QuizPage() {
  const [notes, setNotes] = useState("");
  const [quiz, setQuiz] = useState(null);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);

  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  const [loadingGen, setLoadingGen] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [error, setError] = useState("");

  const questions = quiz?.questions || [];
  const q = questions[current];
  const isLast = current === questions.length - 1;
  const isFirst = current === 0;

  async function handleGenerate() {
    if (!notes.trim()) return;
    setError("");
    setResult(null);
    setLoadingGen(true);

    try {
      const newQuiz = await generateQuiz(notes);
      setQuiz(newQuiz);

      // resets the quiz UI
      setCurrent(0);
      setSelected(null);
      setAnswers(new Array(newQuiz.questions.length).fill(null));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingGen(false);
    }
  }
    // function to persist the current selected answer into the answers array before moving next or finishing
    function persistCurrentSelection() {
      setAnswers((prev) => {
        const copy = [...prev];
        copy[current] = selected;
        return copy;
      });
    }
  function handleNext() {
    if (selected === null) return;

    persistCurrentSelection();

    if (!isLast) {
      const nextIndex = current + 1; // move to next question
      setCurrent(nextIndex);
      setSelected(answers[nextIndex] ?? null); // load previous answer if exists

    } else {
      // finish locally; scoring happens via backend
      handleFinish();
    }
  }

    function handlePrevious() {
    if (isFirst) return;

    persistCurrentSelection();

    const prevIndex = current - 1;
    setCurrent(prevIndex);

    // preload saved answer if it exists
    setSelected(answers[prevIndex] ?? null);
  }

  async function handleFinish() {
    setError("");
    setLoadingScore(true);

    try {
      const finalizedAnswers = answers.map((a, idx) =>
        idx === current ? selected : a
      );

      // backend expects ints 0..3; if any null remain, send -1 to force 400
      const normalized = finalizedAnswers.map((a) => (a === null ? -1 : a));

      const scored = await scoreQuiz(quiz, normalized);
      setResult(scored);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingScore(false);
    }
  }

  function handleRestart() {
    setQuiz(null);
    setNotes("");
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setResult(null);
    setError("");
  }

  // --- UI states ---
  if (!quiz) {
    return (
      <div style={{ padding: 24, maxWidth: 800 }}>
        <h2>Generate a Quiz</h2>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          placeholder="Paste your notes here..."
          style={{ width: "100%", padding: 12, borderRadius: 8 }}
        />

        <button
          onClick={handleGenerate}
          disabled={loadingGen || !notes.trim()}
          style={{ marginTop: 12 }}
        >
          {loadingGen ? "Generating..." : "Generate Quiz"}
        </button>

        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      </div>
    );
  }

  if (result) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Quiz Completed</h2>
        <p>
          Score: {result.score} / {result.total} ({result.percentage}%)
        </p>

        {result.incorrect?.length > 0 && (
          <>
            <h3>Review</h3>
            <ul>
              {result.incorrect.map((x) => (
                <li key={x.question_index}>
                  Q{x.question_index + 1}: {x.correct_choice}
                </li>
              ))}
            </ul>
          </>
        )}

        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

        <button onClick={handleRestart} style={{ marginTop: 16 }}>
          Start New Quiz
        </button>
      </div>
    );
  }

  // quiz in progress...
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
        Selected: {selected === null ? "None" : `${String.fromCharCode(65 + selected)}`}
      </div>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

      <button
        onClick={handleNext}
        disabled={selected === null || loadingScore}
        style={{ marginTop: 16 }}
      >
        {loadingScore ? "Scoring..." : isLast ? "Finish" : "Next"}
      </button>
    </div>
  );
}