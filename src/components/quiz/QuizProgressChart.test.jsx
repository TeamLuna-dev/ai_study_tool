import { render, screen, waitFor } from "@testing-library/react";
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

  it("renders loading, then chart with data", async () => {
    quizService.getQuizHistory.mockResolvedValue([
      { score: 60, timestamp: "2024-03-01T10:00:00Z" },
      { score: 80, timestamp: "2024-03-10T10:00:00Z" },
    ]);
    renderWithAuth(<QuizProgressChart />);
    expect(screen.getByText(/loading progress chart/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/quiz attempt progress/i)).toBeInTheDocument());
    expect(screen.getByText(/quiz score/i)).toBeInTheDocument();
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
});
