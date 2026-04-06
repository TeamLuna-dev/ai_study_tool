/**
 * QuizGenerator.jsx (Refactored QuizPage.jsx component)
 * Handles the quiz generation UI: document picker, notes input,
 * topic selector, and generate button.
 *
 * Receives all state and handlers as props from QuizPage.jsx.
 * Has no state of its own — purely presentational.
 */

import { collection, query, where, getDocs } from "firebase/firestore";
import {
  BRAND_BLUE,
  baseButtonStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  disabledButtonStyle,
  layoutStyle,
  TOPIC_OPTIONS,
} from "./quizStyles";

export default function QuizGenerator({
// auth
  user,
  // input mode
  inputMode,
  setInputMode,
  // notes
  notes,
  setNotes,
  // doc picker
  userDocs,
  selectedDocId,
  setSelectedDocId,
  // topic
  topic,
  setTopic,
  // generation
  loadingGen,
  error,
  handleGenerate,
  // question count
  questionCount,     
  setQuestionCount, 
}) {
  return (
    <div style={layoutStyle}>
      <div style={{ padding: 28, maxWidth: 800, width: "100%" }}>
        <h2>Generate Quiz</h2>

        {/* Mode toggle:  switches between document picker and notes input */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setInputMode("docs")}
            style={{
              ...baseButtonStyle,
              ...(inputMode === "docs" ? primaryButtonStyle : secondaryButtonStyle),
            }}
          >
            My Documents
          </button>
          <button
            type="button"
            onClick={() => setInputMode("notes")}
            style={{
              ...baseButtonStyle,
              ...(inputMode === "notes" ? primaryButtonStyle : secondaryButtonStyle),
            }}
          >
            Paste Notes
          </button>
        </div>

        {/* Document picker: shown when inputMode is "docs" */}
        {inputMode === "docs" && (
          <div>
            <p style={{ color: "#6b7280", marginBottom: 12 }}>
              Select a document you've already uploaded to generate a quiz from.
            </p>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                marginBottom: 12,
                backgroundColor: "white",
              }}
            >
              <option value="">Select a document…</option>
              {userDocs.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fileName}
                </option>
              ))}
            </select>

            {userDocs.length === 0 && (
              <p style={{ color: "#9ca3af", fontSize: 14 }}>
                No documents found. Upload a file first.
              </p>
            )}
          </div>
        )}

        {/* Notes textarea: shown when inputMode is "notes" */}
        {inputMode === "notes" && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            placeholder="Paste your notes here..."
            style={{ width: "100%", padding: 12, borderRadius: 8 }}
          />
        )}

        {/* Question count selector — options match backend accepted values (3, 5, 10, 15).
            Defaults to 5. Changing this updates questionCount in QuizPage state. */}
        <div style={{ marginBottom: "12px" }}>
        <label style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 500,
            color: "#6b7280",
            marginBottom: "6px",
        }}>
            Number of questions
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
            {[3, 5, 10, 15].map((count) => (
            <button
                key={count}
                type="button"
                onClick={() => setQuestionCount(count)}
                style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: questionCount === count ? BRAND_BLUE : "white",
                color: questionCount === count ? "white" : "#374151",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.15s",
                }}
            >
                {count}
            </button>
            ))}
        </div>
        </div>

        {/* Topic selector */}
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

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loadingGen || (!notes.trim() && !selectedDocId) || !topic}
          style={{
            ...primaryButtonStyle,
            marginTop: 12,
            ...(loadingGen || (!notes.trim() && !selectedDocId) || !topic
              ? disabledButtonStyle
              : {}),
          }}
        >
          {loadingGen ? "Generating..." : "Generate"}
        </button>

        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  );
}
