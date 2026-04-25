/**
 * SharedDocumentPanel.test.jsx
 * Unit tests for SharedDocumentPanel.jsx — document rendering, file type
 * mapping, and upload button state.
 * uploadRoomDocument is mocked — no Firebase Storage or Firestore calls.
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SharedDocumentPanel } from "../SharedDocumentPanel";

// Mock the service so the import resolves without Firebase
vi.mock("../../../services/roomService", () => ({
  uploadRoomDocument: vi.fn(),
}));

// ── Test data ────────────────────────────────────────────────────────────────

const mockDocuments = [
  {
    id: "doc-1",
    fileName: "Biology Notes.pdf",
    fileType: "pdf",
    uploaderName: "Alice",
    uploadedAt: new Date(2026, 3, 24, 10, 15),
    status: "ready",
  },
  {
    id: "doc-2",
    fileName: "Presentation.pptx",
    fileType: "pptx",
    uploaderName: "Bob",
    uploadedAt: new Date(2026, 3, 24, 11, 0),
    status: "ready",
  },
  {
    id: "doc-3",
    fileName: "Photo.png",
    fileType: "png",
    uploaderName: "Charlie",
    uploadedAt: new Date(2026, 3, 24, 12, 30),
    status: "ready",
  },
];

const defaultUser = { uid: "user-1", displayName: "Alice" };

// ── Document rendering ───────────────────────────────────────────────────────

describe("SharedDocumentPanel — document rendering", () => {
  it("renders each document's fileName and uploaderName fields", () => {
    render(
      <SharedDocumentPanel
        documents={mockDocuments}
        roomId="room-1"
        user={defaultUser}
      />
    );

    // fileName fields
    expect(screen.getByText("Biology Notes.pdf")).toBeInTheDocument();
    expect(screen.getByText("Presentation.pptx")).toBeInTheDocument();
    expect(screen.getByText("Photo.png")).toBeInTheDocument();

    // uploaderName fields
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("renders the correct file type badge from the fileType field", () => {
    render(
      <SharedDocumentPanel
        documents={mockDocuments}
        roomId="room-1"
        user={defaultUser}
      />
    );

    // fileType badge is rendered as uppercase text
    expect(screen.getByText("pdf")).toBeInTheDocument();
    expect(screen.getByText("pptx")).toBeInTheDocument();
    expect(screen.getByText("png")).toBeInTheDocument();
  });

  it("applies correct color classes from getFileColor() per file type", () => {
    render(
      <SharedDocumentPanel
        documents={[mockDocuments[0]]} // pdf only
        roomId="room-1"
        user={defaultUser}
      />
    );

    // getFileColor("pdf") returns "text-red-500 bg-red-50 dark:bg-red-900/20"
    // This class is applied to the icon wrapper div
    const iconWrapper = document.querySelector(".text-red-500.bg-red-50");
    expect(iconWrapper).toBeInTheDocument();
  });

  it("shows empty state when documents array is empty", () => {
    render(
      <SharedDocumentPanel
        documents={[]}
        roomId="room-1"
        user={defaultUser}
      />
    );

    expect(screen.getByText("No documents shared yet")).toBeInTheDocument();
    expect(screen.getByText("Upload a file to share with your group")).toBeInTheDocument();
  });
});

// ── Upload button state ──────────────────────────────────────────────────────

describe("SharedDocumentPanel — upload button", () => {
  it("is disabled when user is null", () => {
    render(
      <SharedDocumentPanel
        documents={[]}
        roomId="room-1"
        user={null}
      />
    );

    // The button's disabled attr is derived from: uploading || !user?.uid
    const uploadBtn = screen.getByRole("button");
    expect(uploadBtn).toBeDisabled();
  });

  it("is disabled when user object has no uid", () => {
    render(
      <SharedDocumentPanel
        documents={[]}
        roomId="room-1"
        user={{ displayName: "Ghost" }}
      />
    );

    const uploadBtn = screen.getByRole("button");
    expect(uploadBtn).toBeDisabled();
  });

  it("is enabled when a valid user with uid is provided", () => {
    render(
      <SharedDocumentPanel
        documents={[]}
        roomId="room-1"
        user={defaultUser}
      />
    );

    const uploadBtn = screen.getByRole("button");
    expect(uploadBtn).not.toBeDisabled();
  });
});
