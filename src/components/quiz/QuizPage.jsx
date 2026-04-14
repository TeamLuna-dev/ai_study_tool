/**
 * QuizPage.jsx
 *
 * Main component for quiz generation, taking user input and displaying quiz questions.
 * Manages all state related to the quiz flow: input, questions, answers, results.
 * Delegates presentation to QuizGenerator and QuizResults components. SRP compliant.
 */

import { useState, useEffect } from "react";
import { generateQuiz, scoreQuiz, getWeakTopics } from "../../services/quizService";
import { shuffleArray } from "../../utils/shuffleArray";
import { useAuth } from "../../hooks/useAuth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import QuizGenerator from "./QuizGenerator"
import QuizResults from "./QuizResults";
import QuizLoadingScreen from "./QuizLoadingScreen";
import { BRAND_BLUE, primaryButtonStyle, secondaryButtonStyle, disabledButtonStyle, layoutStyle } from "./quizStyles";

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

  const [questionCount, setQuestionCount] = useState(5); // defaults to 5 — matches backend default

  useEffect(() => { // fetch user's uploaded documents on component mount, if user is logged in
  if (!user) return;

  async function fetchDocs() {
    const q = query(
      collection(db, "documents"),
      where("ownerId", "==", user.uid),
      where("status", "==", "ready")
    );
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setUserDocs(docs);
  }

  fetchDocs();
}, [user]);

  const questions = quiz?.questions || [];
  const q = questions[current];
  const isLast = current === questions.length - 1;
  const isFirst = current === 0;

  async function handleGenerate() {
    if (inputMode === "docs" && !selectedDocId) return;
    if (inputMode === "notes" && !notes.trim()) return;
    if (!topic) return;
    setWeakTopics([]);
    setLoadingAnalysis(false);
    setError("");
    setResult(null);
    setLoadingGen(true);

    try {
      const newQuiz = inputMode === "docs"
        ? await generateQuiz({ docId: selectedDocId, questionCount })
        : await generateQuiz({ notes, questionCount });
      // resets the quiz UI

      setQuiz(newQuiz);
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
    setSelectedDocId("");
    setInputMode("docs");
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setResult(null);
    setError("");
    setTopic(""); // reset topic selection as well
    setWeakTopics([]);
    setLoadingAnalysis(false);
    setQuestionCount(5); // reset to default
  }

  function handleRetake() {
    setResult(null);
    setCurrent(0);
    setSelected(null);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setError("");
    setWeakTopics([]);
    setLoadingAnalysis(false);
    setQuiz({ ...quiz, questions: shuffleArray(quiz.questions) });
  }

  if (loadingGen) {
  return <QuizLoadingScreen topic={topic} questionCount={questionCount} />;
} // loading state while quiz is being generated


  // --- UI states ---
  if (!quiz) {
  return (
    <QuizGenerator
      user={user}
      inputMode={inputMode}
      setInputMode={setInputMode}
      notes={notes}
      setNotes={setNotes}
      userDocs={userDocs}
      selectedDocId={selectedDocId}
      setSelectedDocId={setSelectedDocId}
      topic={topic}
      setTopic={setTopic}
      loadingGen={loadingGen}
      error={error}
      handleGenerate={handleGenerate}
      questionCount={questionCount}
      setQuestionCount={setQuestionCount}
    />
  );
}

  if (result) {
    return (
      <QuizResults
        result={result}
        quiz={quiz}
        weakTopics={weakTopics}
        loadingAnalysis={loadingAnalysis}
        error={error}
        handleRestart={handleRestart}
        handleRetake={handleRetake}
      />
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