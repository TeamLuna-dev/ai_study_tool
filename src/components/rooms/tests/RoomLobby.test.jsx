/**
 * RoomLobby.test.jsx
 * Unit tests for RoomLobby.jsx — room metadata rendering, member initials,
 * and owner-only remove permission logic.
 * navigator.clipboard is mocked — no real clipboard access.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoomLobby } from "../RoomLobby";

// ── Test data ────────────────────────────────────────────────────────────────

const mockRoom = {
  name: "Biology Study Group",
  description: "Midterm prep for BIO 301",
  inviteCode: "ABC123",
};

const mockMembers = [
  { id: "user-1", name: "Alice Smith", isHost: true, isOnline: true },
  { id: "user-2", name: "Bob Lee", isHost: false, isOnline: false },
  { id: "user-3", name: "Charlie Day", isHost: false, isOnline: true },
];

// Stub clipboard API so tests don't throw
beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

// ── Room metadata rendering ──────────────────────────────────────────────────

describe("RoomLobby — room metadata", () => {
  it("renders the room name, description, and inviteCode fields", () => {
    render(
      <RoomLobby
        room={mockRoom}
        members={mockMembers}
        currentUserId="user-1"
        onRemoveMember={vi.fn()}
      />
    );

    // room.name rendered as heading
    expect(screen.getByText("Biology Study Group")).toBeInTheDocument();

    // room.description rendered as paragraph
    expect(screen.getByText("Midterm prep for BIO 301")).toBeInTheDocument();

    // room.inviteCode rendered in the code display
    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("displays the correct member count from the members array", () => {
    render(
      <RoomLobby
        room={mockRoom}
        members={mockMembers}
        currentUserId="user-1"
        onRemoveMember={vi.fn()}
      />
    );

    // members.length drives the "Members (N)" heading
    expect(screen.getByText("Members (3)")).toBeInTheDocument();
  });
});

// ── Initials logic ───────────────────────────────────────────────────────────

describe("RoomLobby — getInitials", () => {
  it("renders correct uppercase initials for each member avatar", () => {
    render(
      <RoomLobby
        room={mockRoom}
        members={mockMembers}
        currentUserId="user-1"
        onRemoveMember={vi.fn()}
      />
    );

    // getInitials("Alice Smith") → "AS"
    expect(screen.getByText("AS")).toBeInTheDocument();
    // getInitials("Bob Lee") → "BL"
    expect(screen.getByText("BL")).toBeInTheDocument();
    // getInitials("Charlie Day") → "CD"
    expect(screen.getByText("CD")).toBeInTheDocument();
  });
});

// ── Permission logic ─────────────────────────────────────────────────────────

describe("RoomLobby — remove member permissions", () => {
  it("owner sees remove buttons for non-host members only", () => {
    render(
      <RoomLobby
        room={mockRoom}
        members={mockMembers}
        currentUserId="user-1" // Alice is the owner (isHost: true)
        onRemoveMember={vi.fn()}
      />
    );

    // canRemove = currentUserIsOwner && !member.isHost && onRemoveMember
    // Owner should NOT have a remove button on themselves (isHost: true)
    expect(screen.queryByLabelText("Remove Alice Smith")).not.toBeInTheDocument();

    // Owner SHOULD see remove buttons for non-host members
    expect(screen.getByLabelText("Remove Bob Lee")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove Charlie Day")).toBeInTheDocument();
  });

  it("non-owner does NOT see any remove buttons", () => {
    render(
      <RoomLobby
        room={mockRoom}
        members={mockMembers}
        currentUserId="user-2" // Bob is NOT the owner
        onRemoveMember={vi.fn()}
      />
    );

    // currentUserIsOwner is false → canRemove is always false
    expect(screen.queryByLabelText("Remove Alice Smith")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Remove Bob Lee")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Remove Charlie Day")).not.toBeInTheDocument();
  });

  it("clicking remove calls onRemoveMember with the correct member id", () => {
    const onRemoveMember = vi.fn();
    render(
      <RoomLobby
        room={mockRoom}
        members={mockMembers}
        currentUserId="user-1"
        onRemoveMember={onRemoveMember}
      />
    );

    fireEvent.click(screen.getByLabelText("Remove Bob Lee"));

    // onRemoveMember receives the target member's id field
    expect(onRemoveMember).toHaveBeenCalledWith("user-2");
  });
});
