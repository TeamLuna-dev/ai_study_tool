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
  <div className="min-h-screen bg-[#f5f7fb]">

    <style>{`
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>

    {/* Hero */}
    <section className="relative">
      <div
        className="h-[240px] w-full bg-cover bg-center"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(37, 99, 235, 0.85), rgba(79, 70, 229, 0.75), rgba(147, 51, 234, 0.65)),
            url("/AIWepapp.jpg")
          `,
        }}
      />
      <div className="absolute inset-0 flex items-center max-w-7xl mx-auto px-6">
        <div className="text-white max-w-2xl">
          <h1 className="text-4xl font-bold">Turn your notes into a quiz</h1>
          <p className="mt-3 text-blue-100">
            Choose one of your uploaded documents or paste notes to instantly generate practice questions.
          </p>
        </div>
      </div>
    </section>

    {/* Content */}
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — multi-step quiz generator */}
        <div className="lg:col-span-2">
          <div style={generatorCardStyle}>
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

              {/* Step 1 */}
              {step === 1 && (
                <div>
                  <h2 style={stepTitleStyle}>Choose your source</h2>
                  <p style={stepSubtitleStyle}>
                    Where should we pull your study material from?
                  </p>
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
                  {inputMode === "notes" && (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={6}
                      placeholder="Paste your notes here..."
                      style={notesTextareaStyle}
                    />
                  )}
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

              {/* Step 2 */}
              {step === 2 && (
                <div>
                  <h2 style={stepTitleStyle}>Configure your quiz</h2>
                  <p style={stepSubtitleStyle}>Pick a topic and how many questions you want.</p>
                  <label style={{ ...stepSubtitleStyle, marginBottom: "8px", fontWeight: 600, color: "#1a1a2e" }}>
                    Topic
                  </label>
                  <div style={pillsRowStyle}>
                    {TOPIC_OPTIONS.map((t) => (
                      <button key={t} type="button" onClick={() => setTopic(t)} style={pillStyle(topic === t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <label style={{ ...stepSubtitleStyle, marginBottom: "8px", fontWeight: 600, color: "#1a1a2e" }}>
                    Number of questions
                  </label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                    {[3, 5, 10, 15].map((count) => (
                      <button key={count} type="button" onClick={() => setQuestionCount(count)} style={countPillStyle(questionCount === count)}>
                        {count}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button type="button" onClick={() => setStep(1)} style={backButtonStyle}>← Back</button>
                    <button type="button" onClick={() => setStep(3)} disabled={!topic} style={continueButtonStyle(!topic)}>
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div>
                  <h2 style={stepTitleStyle}>Ready to generate</h2>
                  <p style={stepSubtitleStyle}>Here's a summary of your quiz settings.</p>
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
                  <button type="button" onClick={handleGenerate} disabled={loadingGen} style={generateButtonStyle(loadingGen)}>
                    {loadingGen ? "Generating..." : "Generate Quiz 🚀"}
                  </button>
                  <button type="button" onClick={() => setStep(2)} style={backButtonStyle}>← Back</button>
                  {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-md border">
            <h3 className="text-xl font-bold">How it works</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <p>1. Upload a document</p>
              <p>2. Choose a topic</p>
              <p>3. Generate quiz instantly</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-6 border">
            <h3 className="text-xl font-bold">💡 Tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>• Use clear notes</li>
              <li>• Pick focused topics</li>
              <li>• Upload documents first</li>
            </ul>
          </div>
        </div>

      </div>
    </main>
  </div>
);
}