import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import QuizProgressChart from "./QuizProgressChart";
import * as quizService from "../../services/quizService";
import { AuthContext } from "../../context/AuthContext";
import React from "react";

jest.mock("../../services/quizService");

describe("QuizProgressChart", () => {
  const user = { uid: "test-user-1" };
  function renderWithAuth(children) {
    return render(
      <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
    );
  }

  it("renders loading, then chart with percentage scores", async () => {
    quizService.getQuizHistory.mockResolvedValue([
      { score: 3, total_questions: 5, percentage: 60, topic: "Biology", timestamp: "2024-03-01T10:00:00Z" },
      { score: 4, total_questions: 5, percentage: 80, topic: "Biology", timestamp: "2024-03-10T10:00:00Z" },
    ]);
    renderWithAuth(<QuizProgressChart />);
    expect(screen.getByText(/loading progress chart/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/quiz score trend/i)).toBeInTheDocument());
  });

  it("shows error if fetch fails", async () => {
    quizService.getQuizHistory.mockRejectedValue(new Error("Failed to fetch"));
    renderWithAuth(<QuizProgressChart />);
    await waitFor(() => expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument());
  });

  it("shows no attempts message if history is empty", async () => {
    quizService.getQuizHistory.mockResolvedValue([]);
    renderWithAuth(<QuizProgressChart />);
    await waitFor(() => expect(screen.getByText(/no quiz attempts/i)).toBeInTheDocument());
  });

  it("renders subject filter dropdown with predefined topics", async () => {
    quizService.getQuizHistory.mockResolvedValue([
      { score: 3, total_questions: 5, percentage: 60, topic: "Calculus", timestamp: "2024-03-01T10:00:00Z" },
    ]);
    renderWithAuth(<QuizProgressChart />);
    await waitFor(() => expect(screen.getByText(/quiz score trend/i)).toBeInTheDocument());
    const dropdown = screen.getByRole("combobox");
    expect(dropdown).toBeInTheDocument();
    expect(dropdown.value).toBe("all");
    // Predefined topics should appear as options
    expect(screen.getByText("Biology")).toBeInTheDocument();
    expect(screen.getByText("Chemistry")).toBeInTheDocument();
    expect(screen.getByText("Calculus")).toBeInTheDocument();
  });

  it("filters chart data when a topic is selected", async () => {
    quizService.getQuizHistory.mockResolvedValue([
      { score: 3, total_questions: 5, percentage: 60, topic: "Biology", timestamp: "2024-03-01T10:00:00Z" },
      { score: 4, total_questions: 5, percentage: 80, topic: "Calculus", timestamp: "2024-03-05T10:00:00Z" },
    ]);
    renderWithAuth(<QuizProgressChart />);
    await waitFor(() => expect(screen.getByText(/quiz score trend/i)).toBeInTheDocument());
    const dropdown = screen.getByRole("combobox");
    fireEvent.change(dropdown, { target: { value: "Biology" } });
    expect(dropdown.value).toBe("Biology");
  });
});
