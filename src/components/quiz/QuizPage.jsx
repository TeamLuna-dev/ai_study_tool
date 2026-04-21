/**
 * QuizPage.jsx
 *
 * Main component for quiz generation, taking user input and displaying quiz questions.
 * Manages all state related to the quiz flow: input, questions, answers, results.
 * Delegates presentation to QuizGenerator and QuizResults components. SRP compliant.
 */

import { useState, useEffect, useMemo } from "react";
import { generateQuiz, scoreQuiz, getWeakTopics } from "../../services/quizService";
import { shuffleArray } from "../../utils/shuffleArray";
import { useAuth } from "../../hooks/useAuth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import QuizGenerator from "./QuizGenerator"
import QuizResults from "./QuizResults";
import QuizLoadingScreen from "./QuizLoadingScreen";
import { useQuizSuggestions } from "../../hooks/useQuizSuggestions";
import { BRAND_BLUE, primaryButtonStyle, secondaryButtonStyle, disabledButtonStyle, layoutStyle } from "./quizStyles";
import { useLocation, useNavigate } from "react-router-dom";

const TOPIC_OPTIONS = [
  "Math",
  "Science",
  "History",
  "Programming",
  "Biology",
  "Chemistry",
  "Physics",
  "English",
];

export function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // get current user for personalized analysis
 
  
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
  const [weakTopics, setWeakTopics] = useState([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [preQuizWeakTopics, setPreQuizWeakTopics] = useState([]);

  const weakTopicNames = useMemo(
    () => weakTopics.filter((t) => t.is_weak).map((t) => t.topic),
    [weakTopics]
  );
  const { suggestions, loading: suggestionsLoading } = useQuizSuggestions(weakTopicNames, user?.uid);

  const [userDocs, setUserDocs] = useState([]); // state to hold user's uploaded documents for doc-based quiz generation
  const [selectedDocId, setSelectedDocId] = useState(""); // state to track which document the user has selected for quiz generation
  const [inputMode, setInputMode] = useState("docs"); // "docs" | "notes"

  const [questionCount, setQuestionCount] = useState(5); // defaults to 5 — matches backend default

  useEffect(() => {
    if (!user) return;
    getWeakTopics(user.uid)
      .then(setPreQuizWeakTopics)
      .catch(() => {});
  }, [user]);

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

  // On mount, check for retake state
  useEffect(() => {
    if (location.state && location.state.questions) {
      setQuiz({ questions: location.state.questions, topic: location.state.topic });
      setTopic(location.state.topic || "");
      setCurrent(0);
      setSelected(null);
      setAnswers(new Array(location.state.questions.length).fill(null));
      // Clear state so back/forward doesn't keep reusing it
      navigate("/quiz", { replace: true, state: {} });
    }
    // eslint-disable-next-line
  }, []);

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

  async function handleRegenerate() {
    setResult(null);
    setQuiz(null);
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setError("");
    setWeakTopics([]);
    setLoadingAnalysis(false);
    await handleGenerate();
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
        suggestions={suggestions}
        suggestionsLoading={suggestionsLoading}
        onSelectDoc={() => navigate("/quiz")}
        error={error}
        handleRestart={handleRestart}
        handleRetake={handleRetake}
        handleRegenerate={handleRegenerate}
      />
    );
  }
  

  // quiz in progress...
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-3xl border border-gray-200 bg-white p-8 shadow-md transition-colors dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Question {current + 1} / {questions.length}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Topic: {topic || "General"}
            </span>
          </div>

        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>

        <p className="text-lg md:text-xl font-medium text-gray-900 dark:text-white">
          {q.question}
        </p>

        <div className="grid gap-3 mt-6">
          {q.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 ${
                selected === idx
                  ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                  : "bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700"
              }`}
            >
              <span className="font-semibold mr-2">
                {String.fromCharCode(65 + idx)}.
              </span>
              {choice}
            </button>
          ))}
        </div>

        <div className="mt-5 text-sm text-gray-500 dark:text-gray-400">
          Selected:{" "}
          {selected === null ? "None" : String.fromCharCode(65 + selected)}
        </div>

        {error && (
          <p className="text-red-500 dark:text-red-400 mt-4">{error}</p>
        )}

        <div className="flex gap-3 mt-8">
          <button
            onClick={handlePrevious}
            disabled={isFirst || loadingScore}
            className={`px-5 py-3 rounded-2xl font-semibold border transition ${
              isFirst || loadingScore
                ? "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={selected === null || loadingScore}
            className={`px-5 py-3 rounded-2xl font-semibold text-white transition ${
              selected === null || loadingScore
                ? "bg-blue-300 dark:bg-blue-800 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            }`}
          >
            {loadingScore ? "Scoring..." : isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}