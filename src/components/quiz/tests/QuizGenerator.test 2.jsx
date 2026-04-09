/**
 * QuizGenerator.test.jsx
 * Unit tests for QuizGenerator.jsx — tests React rendering and user interactions.
 * 
 * Tests are organized by step:
 *   - Step 1: Source selection
 *   - Step 2: Quiz configuration
 *   - Step 3: Confirmation and generation
 * 
 * No API calls are made — all handlers are mocked.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import QuizGenerator from "../QuizGenerator";

// ── Default props ──────────────────────────────────────────────────────────
// Minimal valid props to render the component without errors.
// Individual tests override specific props as needed.
const defaultProps = {
  user: { uid: "test-uid" },
  inputMode: "docs",
  setInputMode: vi.fn(),
  notes: "",
  setNotes: vi.fn(),
  userDocs: [
    { id: "doc-1", fileName: "Biology Notes.pdf" },
    { id: "doc-2", fileName: "History Essay.pdf" },
  ],
  selectedDocId: "",
  setSelectedDocId: vi.fn(),
  topic: "",
  setTopic: vi.fn(),
  loadingGen: false,
  error: "",
  handleGenerate: vi.fn(),
  questionCount: 5,
  setQuestionCount: vi.fn(),
};

// ── Step 1 tests ───────────────────────────────────────────────────────────
describe("QuizGenerator — Step 1: Source selection", () => {

  it("renders step 1 by default", () => {
    render(<QuizGenerator {...defaultProps} />);
    expect(screen.getByText("Choose your source")).toBeTruthy();
    expect(screen.getByText("Step 1 of 3")).toBeTruthy();
  });

  it("renders both source cards", () => {
    render(<QuizGenerator {...defaultProps} />);
    expect(screen.getByText("My Documents")).toBeTruthy();
    expect(screen.getByText("Paste Notes")).toBeTruthy();
  });

  it("shows doc picker when inputMode is docs", () => {
    render(<QuizGenerator {...defaultProps} inputMode="docs" />);
    expect(screen.getByText("Select a document…")).toBeTruthy();
  });

  it("shows notes textarea when inputMode is notes", () => {
    render(<QuizGenerator {...defaultProps} inputMode="notes" notes="" />);
    expect(screen.getByPlaceholderText("Paste your notes here...")).toBeTruthy();
  });

  it("shows uploaded documents in the picker", () => {
    render(<QuizGenerator {...defaultProps} />);
    expect(screen.getByText("Biology Notes.pdf")).toBeTruthy();
    expect(screen.getByText("History Essay.pdf")).toBeTruthy();
  });

  it("shows empty state when no documents exist", () => {
    render(<QuizGenerator {...defaultProps} userDocs={[]} />);
    expect(screen.getByText("No documents found. Upload a file first.")).toBeTruthy();
  });

  it("continue button is disabled when no doc is selected", () => {
    render(<QuizGenerator {...defaultProps} inputMode="docs" selectedDocId="" />);
    const continueBtn = screen.getByText("Continue →");
    expect(continueBtn.disabled).toBe(true);
  });

  it("continue button is enabled when a doc is selected", () => {
    render(<QuizGenerator {...defaultProps} inputMode="docs" selectedDocId="doc-1" />);
    const continueBtn = screen.getByText("Continue →");
    expect(continueBtn.disabled).toBe(false);
  });

  it("continue button is disabled when notes are empty", () => {
    render(<QuizGenerator {...defaultProps} inputMode="notes" notes="" />);
    const continueBtn = screen.getByText("Continue →");
    expect(continueBtn.disabled).toBe(true);
  });

  it("clicking My Documents card calls setInputMode with docs", () => {
    const setInputMode = vi.fn();
    render(<QuizGenerator {...defaultProps} setInputMode={setInputMode} />);
    fireEvent.click(screen.getByText("My Documents"));
    expect(setInputMode).toHaveBeenCalledWith("docs");
  });

  it("clicking Paste Notes card calls setInputMode with notes", () => {
    const setInputMode = vi.fn();
    render(<QuizGenerator {...defaultProps} setInputMode={setInputMode} />);
    fireEvent.click(screen.getByText("Paste Notes"));
    expect(setInputMode).toHaveBeenCalledWith("notes");
  });

  it("clicking continue advances to step 2", () => {
    render(<QuizGenerator {...defaultProps} inputMode="docs" selectedDocId="doc-1" />);
    fireEvent.click(screen.getByText("Continue →"));
    expect(screen.getByText("Configure your quiz")).toBeTruthy();
    expect(screen.getByText("Step 2 of 3")).toBeTruthy();
  });
});

// ── Step 2 tests ───────────────────────────────────────────────────────────
describe("QuizGenerator — Step 2: Quiz configuration", () => {

  // Helper to render at step 2
  function renderStep2(props = {}) {
    render(<QuizGenerator {...defaultProps} inputMode="docs" selectedDocId="doc-1" {...props} />);
    fireEvent.click(screen.getByText("Continue →"));
  }

  it("renders step 2 heading", () => {
    renderStep2();
    expect(screen.getByText("Configure your quiz")).toBeTruthy();
  });

  it("renders topic pills", () => {
    renderStep2();
    expect(screen.getByText("Biology")).toBeTruthy();
    expect(screen.getByText("Computer Science")).toBeTruthy();
  });

  it("renders question count pills", () => {
    renderStep2();
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getByText("10")).toBeTruthy();
    expect(screen.getByText("15")).toBeTruthy();
  });

  it("clicking a topic pill calls setTopic", () => {
    const setTopic = vi.fn();
    renderStep2({ setTopic });
    fireEvent.click(screen.getByText("Biology"));
    expect(setTopic).toHaveBeenCalledWith("Biology");
  });

  it("clicking a question count pill calls setQuestionCount", () => {
    const setQuestionCount = vi.fn();
    renderStep2({ setQuestionCount });
    fireEvent.click(screen.getByText("10"));
    expect(setQuestionCount).toHaveBeenCalledWith(10);
  });

  it("continue button is disabled when no topic selected", () => {
    renderStep2({ topic: "" });
    const btns = screen.getAllByText("Continue →");
    expect(btns[btns.length - 1].disabled).toBe(true);
  });

  it("continue button is enabled when topic is selected", () => {
    renderStep2({ topic: "Biology" });
    const btns = screen.getAllByText("Continue →");
    expect(btns[btns.length - 1].disabled).toBe(false);
  });

  it("back button returns to step 1", () => {
    renderStep2();
    fireEvent.click(screen.getByText("← Back"));
    expect(screen.getByText("Choose your source")).toBeTruthy();
  });

  it("continue advances to step 3 when topic is selected", () => {
    renderStep2({ topic: "Biology" });
    const btns = screen.getAllByText("Continue →");
    fireEvent.click(btns[btns.length - 1]);
    expect(screen.getByText("Ready to generate")).toBeTruthy();
  });
});

// ── Step 3 tests ───────────────────────────────────────────────────────────
describe("QuizGenerator — Step 3: Confirmation", () => {

  // Helper to render at step 3
  function renderStep3(props = {}) {
    render(<QuizGenerator
      {...defaultProps}
      inputMode="docs"
      selectedDocId="doc-1"
      topic="Biology"
      questionCount={5}
      {...props}
    />);
    fireEvent.click(screen.getByText("Continue →")); // step 1 → 2
    const btns = screen.getAllByText("Continue →");
    fireEvent.click(btns[btns.length - 1]); // step 2 → 3
  }

  it("renders step 3 heading", () => {
    renderStep3();
    expect(screen.getByText("Ready to generate")).toBeTruthy();
  });

  it("shows correct source in summary", () => {
    renderStep3();
    expect(screen.getByText("Biology Notes.pdf")).toBeTruthy();
  });

  it("shows correct topic in summary", () => {
    renderStep3();
    expect(screen.getByText("Biology")).toBeTruthy();
  });

  it("shows correct question count in summary", () => {
    renderStep3();
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("shows Pasted notes when inputMode is notes", () => {
    render(<QuizGenerator
      {...defaultProps}
      inputMode="notes"
      notes="Some notes here"
      topic="Biology"
      questionCount={5}
    />);
    // advance to step 2 then step 3
    fireEvent.click(screen.getByText("Continue →"));
    const btns = screen.getAllByText("Continue →");
    fireEvent.click(btns[btns.length - 1]);
    expect(screen.getByText("Pasted notes")).toBeTruthy();
  });

  it("generate button calls handleGenerate", () => {
    const handleGenerate = vi.fn();
    renderStep3({ handleGenerate });
    fireEvent.click(screen.getByText("Generate Quiz 🚀"));
    expect(handleGenerate).toHaveBeenCalled();
  });

  it("generate button shows loading state", () => {
    renderStep3({ loadingGen: true });
    expect(screen.getByText("Generating...")).toBeTruthy();
  });

  it("back button returns to step 2", () => {
    renderStep3();
    fireEvent.click(screen.getByText("← Back"));
    expect(screen.getByText("Configure your quiz")).toBeTruthy();
  });

  it("shows error message when error prop is set", () => {
    renderStep3({ error: "Something went wrong." });
    expect(screen.getByText("Something went wrong.")).toBeTruthy();
  });
});