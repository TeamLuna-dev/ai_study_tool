/**
 * QuizGenerator.jsx (Refactored QuizPage.jsx component)
 * Handles the quiz generation UI: document picker, notes input,
 * topic selector, and generate button.
 *
 * Receives all state and handlers as props from QuizPage.jsx.
 * Has no state of its own — purely presentational.
 */

import { useState } from "react";
import { TOPIC_OPTIONS } from "./quizStyles"

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

return (
  <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-white">
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
    <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left — multi-step quiz generator */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-gray-200 bg-white shadow-md transition-colors dark:border-gray-700 dark:bg-gray-900">
              {/* Progress */}
              <div className="px-6 pt-6">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300 dark:bg-blue-500"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-6 md:p-8">
                {/* Step indicator */}
                <div className="mb-8 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                          s < step
                            ? "bg-blue-600 text-white dark:bg-blue-500"
                            : s === step
                            ? "border-2 border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300"
                            : "border border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                        }`}
                      >
                        {s < step ? "✓" : s}
                      </div>
                    ))}
                  </div>

                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Step {step} of 3
                  </span>
                </div>

              {/* Step 1 */}
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Choose your source
                    </h2>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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
                              ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-900/20"
                              : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-500"
                          }`}
                        >
                          <div className="text-2xl">{icon}</div>
                          <div className="mt-3 font-semibold text-gray-900 dark:text-white">
                            {label}
                          </div>
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
                        className="
                            w-full rounded-2xl border px-4 py-3 text-sm
                            border-gray-300 bg-white text-gray-900
                            outline-none transition
                            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                            dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100
                            dark:focus:border-blue-400 dark:focus:ring-blue-400/20
                          "
                        >
                        <option value="">Select a document…</option>
                        {userDocs.map((doc) => (
                          <option key={doc.id} value={doc.id}>{doc.fileName}</option>
                        ))}
                      </select>

                      {userDocs.length === 0 && (
                        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
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
                      className="
                          mt-6 w-full rounded-2xl border px-4 py-3 text-sm
                          border-gray-300 bg-white text-gray-900
                          outline-none transition resize-none
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                          dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100
                          dark:placeholder:text-gray-500
                          dark:focus:border-blue-400 dark:focus:ring-blue-400/20
                        "
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={inputMode === "docs" ? !selectedDocId : !notes.trim()}
                    className={`mt-6 rounded-2xl px-5 py-3 font-semibold text-white transition ${
                        !canContinueStep1
                          ? "cursor-not-allowed bg-blue-300 dark:bg-blue-800"
                          : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                      }`}
                    >
                    Continue →
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Configure your quiz
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Pick a topic and how many questions you want.
                    </p>

                    <label className="mt-6 mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Topic
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {TOPIC_OPTIONS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTopic(t)}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                            topic === t
                              ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          {t}
                        </button>
                    ))}
                  </div>
                  
                  <label className="mt-6 mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
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
                              ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          {count}
                        </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="
                          rounded-2xl border px-5 py-3 font-semibold transition
                          border-gray-300 bg-white text-gray-700 hover:bg-gray-50
                          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700
                        "
                      >
                        ← Back
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        disabled={!topic}
                        className={`rounded-2xl px-5 py-3 font-semibold text-white transition ${
                          !topic
                            ? "cursor-not-allowed bg-blue-300 dark:bg-blue-800"
                            : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                        }`}
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                )}

              {/* Step 3 */}
              {step === 3 && (
                 <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Ready to generate
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Here&apos;s a summary of your quiz settings.
                    </p>

                    <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Source
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {inputMode === "docs"
                          ? userDocs.find((d) => d.id === selectedDocId)?.fileName || "Document"
                          : "Pasted notes"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Topic
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {topic}
                        </span>
                      </div>

                      <div className="flex items-center justify-between px-4 py-4">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Questions
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {questionCount}
                        </span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={loadingGen}
                        className={`rounded-2xl px-5 py-3 font-semibold text-white transition ${
                          loadingGen
                            ? "cursor-not-allowed bg-blue-300 dark:bg-blue-800"
                            : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                        }`}
                      >
                    {loadingGen ? "Generating..." : "Generate Quiz 🚀"}
                  </button>
                  <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="
                          rounded-2xl border px-5 py-3 font-semibold transition
                          border-gray-300 bg-white text-gray-700 hover:bg-gray-50
                          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700
                        "
                      >
                        ← Back
                      </button>
                    </div>

                    {error && (
                      <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Right panel */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">How it works</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>1. Upload a document</p>
              <p>2. Choose a topic</p>
              <p>3. Generate quiz instantly</p>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-purple-50 to-blue-50 p-6 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100"> 💡 Tips </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Use clear notes</li>
              <li>• Pick focused topics</li>
              <li>• Upload documents first</li>
            </ul>
          </div>
        {user && (
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Your quiz setup
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 dark:text-gray-400">Mode</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {inputMode === "docs" ? "Documents" : "Notes"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 dark:text-gray-400">Topic</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {topic || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 dark:text-gray-400">
                      Questions
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {questionCount}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}