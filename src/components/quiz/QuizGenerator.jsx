/**
 * QuizGenerator.jsx (Refactored QuizPage.jsx component)
 * Handles the quiz generation UI: document picker, notes input,
 * topic selector, and generate button.
 *
 * Receives all state and handlers as props from QuizPage.jsx.
 * Has no state of its own — purely presentational.
 */

import { useState } from "react";
import {
  generatorRootStyle,
  generatorCardStyle,
  generatorInnerStyle,
  progressTrackStyle,
  progressFillStyle,
  stepIndicatorRowStyle,
  stepNumbersStyle,
  stepCircleStyle,
  stepLabelStyle,
  sourceCardsRowStyle,
  sourceCardStyle,
  sourceCardIconStyle,
  sourceCardLabelStyle,
  sourceCardDescStyle,
  stepTitleStyle,
  stepSubtitleStyle,
  docPickerStyle,
  notesTextareaStyle,
  continueButtonStyle,
  pillsRowStyle,
  pillStyle,
  countPillStyle,
  backButtonStyle,
  summaryCardStyle,
  summaryRowStyle,
  summaryLabelStyle,
  summaryValueStyle,
  generateButtonStyle,
} from "./quizGeneratorStyles";

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
  const [step, setStep] = useState(1);
return (
  <div style={generatorRootStyle}>
    <style>{`
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>

    <div style={generatorCardStyle}>

      {/* Progress bar */}
      <div style={progressTrackStyle}>
        <div style={progressFillStyle(step, 3)} />
      </div>

      <div style={generatorInnerStyle}>

        {/* Step indicator */}
        <div style={stepIndicatorRowStyle}>
          <div style={stepNumbersStyle}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={stepCircleStyle(s, step)}>
                {s < step ? "✓" : s}
              </div>
            ))}
          </div>
          <span style={stepLabelStyle}>Step {step} of 3</span>
        </div>

        {/* Step 1: Choose your source */}
        {step === 1 && (
          <div>
            <h2 style={stepTitleStyle}>Choose your source</h2>
            <p style={stepSubtitleStyle}>
              Where should we pull your study material from?
            </p>

            {/* Source cards */}
            <div style={sourceCardsRowStyle}>
              {[
                { mode: "docs", icon: "📄", label: "My Documents", desc: "Use an uploaded PDF or image" },
                { mode: "notes", icon: "✏️", label: "Paste Notes", desc: "Type or paste your own notes" },
              ].map(({ mode, icon, label, desc }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setInputMode(mode)}
                  style={sourceCardStyle(inputMode === mode)}
                >
                  <div style={sourceCardIconStyle}>{icon}</div>
                  <div style={sourceCardLabelStyle}>{label}</div>
                  <div style={sourceCardDescStyle}>{desc}</div>
                </button>
              ))}
            </div>

            {/* Doc picker */}
            {inputMode === "docs" && (
              <div>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  style={docPickerStyle}
                >
                  <option value="">Select a document…</option>
                  {userDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>{doc.fileName}</option>
                  ))}
                </select>
                {userDocs.length === 0 && (
                  <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                    No documents found. Upload a file first.
                  </p>
                )}
              </div>
            )}

            {/* Notes textarea */}
            {inputMode === "notes" && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                placeholder="Paste your notes here..."
                style={notesTextareaStyle}
              />
            )}

            {/* Continue button */}
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={inputMode === "docs" ? !selectedDocId : !notes.trim()}
              style={continueButtonStyle(inputMode === "docs" ? !selectedDocId : !notes.trim())}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Configure your quiz */}
        {step === 2 && (
          <div>
            <h2 style={stepTitleStyle}>Configure your quiz</h2>
            <p style={stepSubtitleStyle}>
              Pick a topic and how many questions you want.
            </p>

            {/* Topic pills */}
            <label style={{ ...stepSubtitleStyle, marginBottom: "8px", fontWeight: 600, color: "#1a1a2e" }}>
              Topic
            </label>
            <div style={pillsRowStyle}>
              {TOPIC_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  style={pillStyle(topic === t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Question count pills */}
            <label style={{ ...stepSubtitleStyle, marginBottom: "8px", fontWeight: 600, color: "#1a1a2e" }}>
              Number of questions
            </label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
              {[3, 5, 10, 15].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  style={countPillStyle(questionCount === count)}
                >
                  {count}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={backButtonStyle}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!topic}
                style={continueButtonStyle(!topic)}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Confirm and generate */}
        {step === 3 && (
          <div>
            <h2 style={stepTitleStyle}>Ready to generate</h2>
            <p style={stepSubtitleStyle}>
              Here's a summary of your quiz settings.
            </p>

            {/* Summary card */}
            <div style={summaryCardStyle}>
              <div style={summaryRowStyle}>
                <span style={summaryLabelStyle}>Source</span>
                <span style={summaryValueStyle}>
                  {inputMode === "docs"
                    ? userDocs.find((d) => d.id === selectedDocId)?.fileName || "Document"
                    : "Pasted notes"}
                </span>
              </div>
              <div style={summaryRowStyle}>
                <span style={summaryLabelStyle}>Topic</span>
                <span style={summaryValueStyle}>{topic}</span>
              </div>
              <div style={{ ...summaryRowStyle, borderBottom: "none" }}>
                <span style={summaryLabelStyle}>Questions</span>
                <span style={summaryValueStyle}>{questionCount}</span>
              </div>
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loadingGen}
              style={generateButtonStyle(loadingGen)}
            >
              {loadingGen ? "Generating..." : "Generate Quiz 🚀"}
            </button>

            {/* Back button */}
            <button
              type="button"
              onClick={() => setStep(2)}
              style={backButtonStyle}
            >
              ← Back
            </button>

            {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
          </div>
        )}

      </div>
    </div>
  </div>
);
}
