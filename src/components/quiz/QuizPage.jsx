import { useState } from "react";
import { generateQuiz, scoreQuiz, getWeakTopics } from "../../services/quizService";
import { useAuth } from "../../hooks/useAuth";

// Kept same UI structure as before for simplicity... to be improved later. 
// Note: Design is wacky now, will apply OCP later on
// Connects to the backend ans wanted!

// center the quiz container vertically and horizontally, with some padding on smaller screens

const BRAND_BLUE = "#2563eb"; // consistent brand color for primary actions 

const layoutStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 24,            
  backgroundColor: "#f9fafb",
};


  const resultCardStyle = {
    width: "100%",
    maxWidth: 760,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 32,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  };

  const resultHeaderStyle = {
    textAlign: "center",
    marginBottom: 24,
  };

  const scoreSummaryStyle = {
    textAlign: "center",
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    marginBottom: 24,
  };

  const resultSectionStyle = {
    marginTop: 24,
  };

  const resultSectionTitleStyle = {
    marginBottom: 12,
    fontSize: 20,
    fontWeight: 600,
    color: "#111827",
  };

  const restartButtonWrapperStyle = {
    display: "flex",
    justifyContent: "center",
    marginTop: 28,
  };

const baseButtonStyle = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  cursor: "pointer",
  fontWeight: 500,
};

const primaryButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: BRAND_BLUE,
  color: "white",
  border: `1px solid ${BRAND_BLUE}`,
};

const secondaryButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "white",
  color: "#111827",
};

const disabledButtonStyle = {
  opacity: 0.6,
  cursor: "not-allowed",
};

  const TOPIC_OPTIONS = [
  "Calculus",
  "Biology",
  "Chemistry",
  "Physics",
  "History",
  "Computer Science",
  "Psychology",
  "English",
  "Economics",
  "Other",
]; // predefined topics for user to select from, can be extended as needed

  const reviewCardStyle = {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  };

  const reviewQuestionStyle = {
    fontWeight: 600,
    color: "#111827",
    marginBottom: 8,
  };

  const reviewLabelStyle = {
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
  };

  const correctAnswerStyle = {
    color: "#16a34a",
    fontWeight: 600,
  };

  const incorrectAnswerStyle = {
    color: "#dc2626",
    fontWeight: 600,
  };

export function QuizPage() {
  const { user } = useAuth(); // get current user for personalized analysis
  console.log("Current user:", user); // debug log to verify user object
  console.log("User UID:", user?.uid); 
  
  const analyticsUserId = user?.uid || "test-user-123"; // for  a temporary measure to connect to the backend
  const [notes, setNotes] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [topic, setTopic] = useState(""); // for topic-based quiz generation, needed for two user storie

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);

  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  const [loadingGen, setLoadingGen] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [error, setError] = useState("");
  const [weakTopics, setWeakTopics] = useState([]); // new states for personalized quiz-generation. (wll use in future tasks)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false); // state to track loading 

  const [userDocs, setUserDocs] = useState([]); // state to hold user's uploaded documents for doc-based quiz generation
  const [selectedDocId, setSelectedDocId] = useState(""); // state to track which document the user has selected for quiz generation
  const [inputMode, setInputMode] = useState("docs"); // "docs" | "notes"

  const questions = quiz?.questions || [];
  const q = questions[current];
  const isLast = current === questions.length - 1;
  const isFirst = current === 0;

  async function handleGenerate() {
    if (!notes.trim() || !topic) return;
    setWeakTopics([]);
    setLoadingAnalysis(false);
    setError("");
    setResult(null);
    setLoadingGen(true);

    try {
      const newQuiz = await generateQuiz({ notes });
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
    setLoadingAnalysis(true);
    try {
      const finalizedAnswers = answers.map((a, idx) =>
        idx === current ? selected : a
      );

      // backend expects ints 0..3; if any null remain, send -1 to force 400
      const normalized = finalizedAnswers.map((a) => (a === null ? -1 : a));

      const scored = await scoreQuiz(quiz, normalized, topic, analyticsUserId);
      setResult(scored);

        try {
        const weak = await getWeakTopics(analyticsUserId);
        console.log("Weak topics fetched:", weak);
        setWeakTopics(weak);
          } catch (e) {
          console.warn("Failed to fetch weak topics"); // debug log to verify whehter weak topics are being fetched
          setWeakTopics([]); // if no user, set to empty array to avoid confusion
          }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingScore(false);
        setLoadingAnalysis(false);
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
    setTopic(""); // reset topic selection as well
    setWeakTopics([]);
    setLoadingAnalysis(false);
  }

  // --- UI states ---
  if (!quiz) {

    return (
      
      <div style={layoutStyle}>
        <div style={{ padding: 28, maxWidth: 800, width: "100%" }}>
        <h2>Generate Quiz from Notes</h2>

          <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                marginTop: 12,
                marginBottom: 12,
                backgroundColor: "white",
              }}
            >
              <option value="">Select a topic</option>
              {TOPIC_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          placeholder="Paste your notes here..."
          style={{ width: "100%", padding: 12, borderRadius: 8 }}
        />

        <button
          onClick={handleGenerate}
          disabled={loadingGen || !notes.trim() || !topic}
          style={{...primaryButtonStyle, marginTop: 12, ...(loadingGen || !notes.trim() || !topic ? disabledButtonStyle : {}),
}}
        >
          {loadingGen ? "Generating..." : "Generate"}
        </button>

        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      </div>
      </div>
    );
  }


  if (result) {
    return (
      <div style={layoutStyle}>
        <div style={resultCardStyle}>
          <div style={resultHeaderStyle}>
            <h2 style={{ fontSize: 28, marginBottom: 8}}>Quiz Completed</h2>
            <p style={{ color: "#6b7280" }}>Here's how you did and what to focus on next</p>
          </div>

          <div style={scoreSummaryStyle}>
            <p style ={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          Score: {result.score} / {result.total} ({result.percentage}%)
        </p>

          </div>

        {result.incorrect?.length > 0 && (
  <div style={resultSectionStyle}>
    <h3 style={resultSectionTitleStyle}>Review Incorrect Answers</h3>

    {result.incorrect.map((x) => (
      <div key={x.question_index} style={reviewCardStyle}>
        <p style={reviewQuestionStyle}>
          Question {x.question_index + 1}: {x.question}
        </p>

        <p style={{ margin: "6px 0" }}>
          <span style={reviewLabelStyle}>Correct Answer: </span>
          <span style={correctAnswerStyle}>{x.correct_choice}</span>
        </p>

        {x.your_index !== undefined && x.your_index >= 0 && (
          <p style={{ margin: "6px 0" }}>
            <span style={reviewLabelStyle}>Your Answer: </span>
            <span style={incorrectAnswerStyle}>
              {quiz?.questions?.[x.question_index]?.choices?.[x.your_index]}
            </span>
          </p>
        )}
      </div>
    ))}
  </div>
)}


        {loadingAnalysis && (
          <div style={resultSectionStyle}>
            <p>Loading quiz analysis...</p>
          </div>
        )}

        {!loadingAnalysis && weakTopics.length > 0 && (
          <div style={resultSectionStyle}>
            <h3 style={resultSectionTitleStyle}>Topic Performance</h3>
            <ul>
              {weakTopics.map((item) => (
                <li key={item.topic}>
                  {item.topic}: {item.average_score}% {item.is_weak ? "(Weak)" : "(Strong)"}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

        <div style={restartButtonWrapperStyle}>
          <button onClick={handleRestart} style={primaryButtonStyle}>
            Start New Quiz
          </button>
        </div>
      </div>
    </div>
    );
  }

  // quiz in progress...
  return (
    <div style={layoutStyle}>
      <div style={{ padding: 24, maxWidth: 700, width: "100%" }}>
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
              backgroundColor: selected === idx ? BRAND_BLUE : "#f3f4f6",
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
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          onClick={handlePrevious}
          disabled={isFirst || loadingScore}
          style={{...secondaryButtonStyle, ...(isFirst || loadingScore ? disabledButtonStyle : {}),}}
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={selected === null || loadingScore}
          style={{...primaryButtonStyle, ...(selected === null || loadingScore ? disabledButtonStyle : {}),}}
        >
          {loadingScore ? "Scoring..." : isLast ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  </div>
  );
}