/**
 * QuizGenerator.test.jsx
 * Unit tests for QuizGenerator.jsx — tests React rendering and user interactions.
 *
 * Tests are organized by step:
 *   - Step 1: Source selection
 *   - Step 2: Configuration and generation
 *
 * No API calls are made — all handlers are mocked.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

function renderGenerator(props = {}) {
  return render(
    <MemoryRouter>
      <QuizGenerator {...defaultProps} {...props} />
    </MemoryRouter>
  );
}

// ── Step 1 tests ───────────────────────────────────────────────────────────
describe("QuizGenerator — Step 1: Source selection", () => {

  it("renders step 1 by default", () => {
    renderGenerator();
    expect(screen.getByText("Choose your source")).toBeTruthy();
    expect(screen.getByText("Step 1 of 2")).toBeTruthy();
  });

  it("renders both source cards", () => {
    renderGenerator();
    expect(screen.getByText("My Documents")).toBeTruthy();
    expect(screen.getByText("Paste Notes")).toBeTruthy();
  });

  it("shows doc picker when inputMode is docs", () => {
    renderGenerator({ inputMode: "docs" });
    expect(screen.getByText("Select a document…")).toBeTruthy();
  });

  it("shows notes textarea when inputMode is notes", () => {
    renderGenerator({ inputMode: "notes", notes: "" });
    expect(screen.getByPlaceholderText("Paste your notes here...")).toBeTruthy();
  });

  it("shows uploaded documents in the picker", () => {
    renderGenerator();
    expect(screen.getByText("Biology Notes.pdf")).toBeTruthy();
    expect(screen.getByText("History Essay.pdf")).toBeTruthy();
  });

  it("shows empty state linking to file upload when no documents exist", () => {
    renderGenerator({ userDocs: [] });
    expect(screen.getByText(/No documents found/)).toBeTruthy();
    const link = screen.getByText("Upload a file first.");
    expect(link.getAttribute("href")).toBe("/file-upload");
  });

  it("continue button is disabled when no doc is selected", () => {
    renderGenerator({ inputMode: "docs", selectedDocId: "" });
    const continueBtn = screen.getByText("Continue →");
    expect(continueBtn.disabled).toBe(true);
  });

  it("continue button is enabled when a doc is selected", () => {
    renderGenerator({ inputMode: "docs", selectedDocId: "doc-1" });
    const continueBtn = screen.getByText("Continue →");
    expect(continueBtn.disabled).toBe(false);
  });

  it("continue button is disabled when notes are empty", () => {
    renderGenerator({ inputMode: "notes", notes: "" });
    const continueBtn = screen.getByText("Continue →");
    expect(continueBtn.disabled).toBe(true);
  });

  it("clicking My Documents card calls setInputMode with docs", () => {
    const setInputMode = vi.fn();
    renderGenerator({ setInputMode });
    fireEvent.click(screen.getByText("My Documents"));
    expect(setInputMode).toHaveBeenCalledWith("docs");
  });

  it("clicking Paste Notes card calls setInputMode with notes", () => {
    const setInputMode = vi.fn();
    renderGenerator({ setInputMode });
    fireEvent.click(screen.getByText("Paste Notes"));
    expect(setInputMode).toHaveBeenCalledWith("notes");
  });

  it("clicking continue advances to step 2", () => {
    renderGenerator({ inputMode: "docs", selectedDocId: "doc-1" });
    fireEvent.click(screen.getByText("Continue →"));
    expect(screen.getByText("Configure your quiz")).toBeTruthy();
    expect(screen.getByText("Step 2 of 2")).toBeTruthy();
  });
});

// ── Step 2 tests ───────────────────────────────────────────────────────────
describe("QuizGenerator — Step 2: Configuration and generation", () => {

  // Helper to render at step 2
  function renderStep2(props = {}) {
    renderGenerator({ inputMode: "docs", selectedDocId: "doc-1", ...props });
    fireEvent.click(screen.getByText("Continue →"));
  }

  it("renders step 2 heading", () => {
    renderStep2();
    expect(screen.getByText("Configure your quiz")).toBeTruthy();
  });

  it("renders a free-text topic input", () => {
    renderStep2();
    expect(screen.getByPlaceholderText(/Photosynthesis/)).toBeTruthy();
  });

  it("typing a topic calls setTopic", () => {
    const setTopic = vi.fn();
    renderStep2({ setTopic });
    fireEvent.change(screen.getByPlaceholderText(/Photosynthesis/), {
      target: { value: "Cell Biology" },
    });
    expect(setTopic).toHaveBeenCalledWith("Cell Biology");
  });

  it("renders question count pills", () => {
    renderStep2();
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getByText("10")).toBeTruthy();
    expect(screen.getByText("15")).toBeTruthy();
  });

  it("clicking a question count pill calls setQuestionCount", () => {
    const setQuestionCount = vi.fn();
    renderStep2({ setQuestionCount });
    fireEvent.click(screen.getByText("10"));
    expect(setQuestionCount).toHaveBeenCalledWith(10);
  });

  it("generate button is disabled when no topic is entered", () => {
    renderStep2({ topic: "" });
    expect(screen.getByText("Generate Quiz 🚀").disabled).toBe(true);
  });

  it("generate button is enabled when topic is entered", () => {
    renderStep2({ topic: "Biology" });
    expect(screen.getByText("Generate Quiz 🚀").disabled).toBe(false);
  });

  it("back button returns to step 1", () => {
    renderStep2();
    fireEvent.click(screen.getByText("← Back"));
    expect(screen.getByText("Choose your source")).toBeTruthy();
  });

  it("generate button calls handleGenerate", () => {
    const handleGenerate = vi.fn();
    renderStep2({ topic: "Biology", handleGenerate });
    fireEvent.click(screen.getByText("Generate Quiz 🚀"));
    expect(handleGenerate).toHaveBeenCalled();
  });

  it("generate button shows loading state", () => {
    renderStep2({ topic: "Biology", loadingGen: true });
    expect(screen.getByText("Generating...")).toBeTruthy();
  });

  it("shows error message when error prop is set", () => {
    renderStep2({ error: "Something went wrong." });
    expect(screen.getByText("Something went wrong.")).toBeTruthy();
  });
});
