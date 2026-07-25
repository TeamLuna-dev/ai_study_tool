/**
 * QuizGenerator.jsx (Refactored QuizPage.jsx component)
 * Handles the quiz generation UI: document picker, notes input,
 * topic input, and generate button.
 *
 * Receives all state and handlers as props from QuizPage.jsx.
 * Has no state of its own besides the wizard step — purely presentational.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

const FIELD_CLASS = `
  w-full rounded-xl border border-hairline dark:border-gray-700
  bg-white dark:bg-gray-950 text-ink dark:text-gray-100
  focus:outline-none focus:border-gilt-600 focus:ring-2 focus:ring-gilt-100
  dark:focus:ring-gilt-400/20
`;

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

  const canContinueStep1 =
    inputMode === "docs" ? Boolean(selectedDocId) : Boolean(notes.trim());
  const canGenerate = Boolean(topic.trim()) && !loadingGen;

return (
  <div className="min-h-screen bg-paper text-ink transition-colors dark:bg-gray-950 dark:text-white">
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink dark:text-white">
          Turn your notes into a quiz
        </h1>
        <p className="mt-2 text-ink-soft dark:text-gray-400">
          Choose one of your uploaded documents or paste notes to instantly generate practice questions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — two-step quiz generator */}
        <div className="lg:col-span-2">
          <Card className="p-6 md:p-8">
            {/* Progress */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-hairline dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gilt-600 transition-all duration-300 dark:bg-gilt-400"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>

            {/* Step indicator */}
            <div className="mt-6 mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                      s < step
                        ? "bg-gilt-600 text-white dark:bg-gilt-400 dark:text-gray-950"
                        : s === step
                        ? "border-2 border-gilt-600 bg-gilt-wash text-gilt-ink dark:border-gilt-400 dark:bg-gilt-950 dark:text-gilt-400"
                        : "border border-hairline bg-white text-ink-faint dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                    }`}
                  >
                    {s < step ? "✓" : s}
                  </div>
                ))}
              </div>

              <span className="text-sm font-medium text-ink-soft dark:text-gray-400">
                Step {step} of 2
              </span>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-ink dark:text-white">
                  Choose your source
                </h2>
                <p className="mt-2 text-sm text-ink-soft dark:text-gray-400">
                  Where should we pull your study material from?
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    { mode: "docs", icon: "📄", label: "My Documents", desc: "Use an uploaded PDF or image" },
                    { mode: "notes", icon: "✏️", label: "Paste Notes", desc: "Type or paste your own notes" },
                  ].map(({ mode, icon, label, desc }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setInputMode(mode)}
                      className={`rounded-2xl border p-5 text-left transition ${
                          inputMode === mode
                            ? "border-gilt-600 bg-gilt-wash ring-2 ring-gilt-600/20 dark:border-gilt-400 dark:bg-gilt-950"
                            : "border-hairline bg-white hover:border-gilt-600/50 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gilt-400/50"
                        }`}
                      >
                        <div className="text-2xl">{icon}</div>
                        <div className="mt-3 font-semibold text-ink dark:text-white">
                          {label}
                        </div>
                        <div className="mt-1 text-sm text-ink-soft dark:text-gray-400">
                          {desc}
                        </div>
                      </button>
                  ))}
                </div>

                {inputMode === "docs" && (
                  <div className="mt-6">
                    <select
                      value={selectedDocId}
                      onChange={(e) => setSelectedDocId(e.target.value)}
                      className={`${FIELD_CLASS} px-4 py-3 text-sm`}
                      >
                      <option value="">Select a document…</option>
                      {userDocs.map((doc) => (
                        <option key={doc.id} value={doc.id}>{doc.fileName}</option>
                      ))}
                    </select>

                    {userDocs.length === 0 && (
                      <p className="mt-2 text-sm text-ink-faint dark:text-gray-500">
                        No documents found. <Link to="/file-upload" className="text-gilt-ink dark:text-gilt-400 underline">Upload a file first.</Link>
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
                    className={`${FIELD_CLASS} mt-6 px-4 py-3 text-sm resize-none dark:placeholder:text-gray-500`}
                  />
                )}
                <Button
                  className="mt-6"
                  onClick={() => setStep(2)}
                  disabled={!canContinueStep1}
                >
                  Continue →
                </Button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-ink dark:text-white">
                  Configure your quiz
                </h2>
                <p className="mt-2 text-sm text-ink-soft dark:text-gray-400">
                  Name a topic and choose how many questions you want.
                </p>

                <label htmlFor="quiz-topic" className="mt-6 mb-2 block text-sm font-semibold text-ink dark:text-gray-100">
                  Topic
                </label>
                <Input
                  id="quiz-topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, World War II…"
                />

                <label className="mt-6 mb-2 block text-sm font-semibold text-ink dark:text-gray-100">
                  Number of questions
                </label>

                <div className="mb-6 flex flex-wrap gap-2">
                  {[3, 5, 10, 15].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          questionCount === count
                            ? "border-gilt-600 bg-gilt-600 text-white dark:border-gilt-400 dark:bg-gilt-400 dark:text-gray-950"
                            : "border-hairline bg-white text-ink-soft hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {count}
                      </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                      type="button"
                      onClick={() => setStep(1)}
                      variant="ghost"
                    >
                      ← Back
                    </Button>

                    <Button
                      type="button"
                      onClick={handleGenerate}
                      disabled={!canGenerate}
                    >
                      {loadingGen ? "Generating..." : "Generate Quiz 🚀"}
                    </Button>
                  </div>

                  {error && (
                    <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                      {error}
                    </p>
                  )}
                </div>
              )}
          </Card>
        </div>

      {/* Right panel */}
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-xl font-bold text-ink dark:text-gray-100">How it works</h3>
          <div className="mt-4 space-y-3 text-sm text-ink-soft dark:text-gray-400">
            <p>1. Upload a document</p>
            <p>2. Name a topic</p>
            <p>3. Generate quiz instantly</p>
          </div>
        </Card>
        <Card className="p-6 bg-gilt-wash dark:bg-gilt-950/40">
          <h3 className="text-xl font-bold text-ink dark:text-gray-100"> 💡 Tips </h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft dark:text-gray-400">
            <li>• Use clear notes</li>
            <li>• Pick a focused topic</li>
            <li>• Upload documents first</li>
          </ul>
        </Card>
      {user && (
            <Card className="p-6">
              <h3 className="text-xl font-bold text-ink dark:text-gray-100">
                Your quiz setup
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-ink-soft dark:text-gray-400">Mode</span>
                  <span className="font-medium text-ink dark:text-gray-100">
                    {inputMode === "docs" ? "Documents" : "Notes"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-ink-soft dark:text-gray-400">Topic</span>
                  <span className="font-medium text-ink dark:text-gray-100">
                    {topic || "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-ink-soft dark:text-gray-400">
                    Questions
                  </span>
                  <span className="font-medium text-ink dark:text-gray-100">
                    {questionCount}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  </div>
  );
}
