/**
 * ChatArea.test.jsx
 * Unit tests for ChatArea.jsx — message rendering, initials logic, and send flow.
 * No Firebase or service calls — pure component tests via props.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChatArea } from "../ChatArea";

// ── Test data ────────────────────────────────────────────────────────────────

const mockMessages = [
  {
    id: "msg-1",
    sender: "Alice Smith",
    text: "Hey everyone!",
    timestamp: new Date(2026, 3, 24, 14, 30), // Apr 24 2026, 2:30 PM
  },
  {
    id: "msg-2",
    sender: "Bob Lee",
    text: "Ready to study?",
    timestamp: new Date(2026, 3, 24, 14, 35), // Apr 24 2026, 2:35 PM
  },
];

// ── Rendering messages ───────────────────────────────────────────────────────

describe("ChatArea — message rendering", () => {
  it("renders each message's sender name, text, and formatted timestamp", () => {
    render(<ChatArea messages={mockMessages} onSend={vi.fn()} />);

    // Verify sender fields
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Lee")).toBeInTheDocument();

    // Verify text fields
    expect(screen.getByText("Hey everyone!")).toBeInTheDocument();
    expect(screen.getByText("Ready to study?")).toBeInTheDocument();

    // Verify formatTime() return value — toLocaleTimeString with hour:numeric, minute:2-digit
    expect(screen.getByText("2:30 PM")).toBeInTheDocument();
    expect(screen.getByText("2:35 PM")).toBeInTheDocument();
  });

  it("renders correct initials from getInitials() for each sender avatar", () => {
    render(<ChatArea messages={mockMessages} onSend={vi.fn()} />);

    // getInitials("Alice Smith") → "AS", getInitials("Bob Lee") → "BL"
    expect(screen.getByText("AS")).toBeInTheDocument();
    expect(screen.getByText("BL")).toBeInTheDocument();
  });

  it("shows empty state when messages array is empty", () => {
    render(<ChatArea messages={[]} onSend={vi.fn()} />);

    expect(screen.getByText("No messages yet")).toBeInTheDocument();
    expect(screen.getByText("Start the conversation!")).toBeInTheDocument();
  });
});

// ── Send flow ────────────────────────────────────────────────────────────────

describe("ChatArea — send flow", () => {
  it("calls onSend with the message and clears the input on submit", () => {
    const onSend = vi.fn();
    render(<ChatArea messages={[]} onSend={onSend} />);

    const input = screen.getByPlaceholderText("Type a message...");

    // Type a message and submit the form
    fireEvent.change(input, { target: { value: "Hello world" } });
    fireEvent.submit(input.closest("form"));

    // onSend receives the raw message string
    expect(onSend).toHaveBeenCalledWith("Hello world");

    // Input is cleared after send
    expect(input.value).toBe("");
  });

  it("does not call onSend when the input is empty or whitespace", () => {
    const onSend = vi.fn();
    render(<ChatArea messages={[]} onSend={onSend} />);

    const input = screen.getByPlaceholderText("Type a message...");

    // Submit with empty input
    fireEvent.submit(input.closest("form"));
    expect(onSend).not.toHaveBeenCalled();

    // Submit with only whitespace
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(input.closest("form"));
    expect(onSend).not.toHaveBeenCalled();
  });
});
