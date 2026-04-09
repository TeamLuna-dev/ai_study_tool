/**
 * useDocuments.test.js
 * Unit tests for useDocuments.js — fetch logic and delete flow.
 * libraryService is fully mocked — no Firebase calls are made.
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDocuments } from "../useDocuments";

vi.mock("../../services/libraryService", () => ({
  getUserDocs: vi.fn(),
  deleteDoc: vi.fn(),
}));

import { getUserDocs, deleteDoc } from "../../services/libraryService";

const mockDocs = [
  { id: "doc-1", fileName: "Biology Notes.pdf", status: "ready" },
  { id: "doc-2", fileName: "History Essay.pdf", status: "ready" },
];

// ── Fetch logic ────────────────────────────────────────────────────────────
describe("useDocuments — fetch logic", () => {

  beforeEach(() => vi.clearAllMocks());

  it("sets docs on successful fetch", async () => {
    getUserDocs.mockResolvedValue(mockDocs);
    const { result } = renderHook(() => useDocuments("uid-123"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.docs).toEqual(mockDocs);
  });

  it("sets error message when fetch fails", async () => {
    getUserDocs.mockRejectedValue(new Error("Firestore error"));
    const { result } = renderHook(() => useDocuments("uid-123"));
    await waitFor(() =>
      expect(result.current.error).toBe("Failed to load documents. Please try again.")
    );
  });

  it("does not fetch when uid is undefined", () => {
    renderHook(() => useDocuments(undefined));
    expect(getUserDocs).not.toHaveBeenCalled();
  });

});

// ── Delete flow ────────────────────────────────────────────────────────────
describe("useDocuments — delete flow", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    getUserDocs.mockResolvedValue(mockDocs);
  });

  it("removes doc from state after successful delete", async () => {
    deleteDoc.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDocuments("uid-123"));
    await waitFor(() => expect(result.current.docs).toEqual(mockDocs));
    await act(async () => {
      await result.current.handleDelete(mockDocs[0]);
    });
    expect(result.current.docs).toEqual([mockDocs[1]]);
  });

  it("calls deleteDoc with the correct document", async () => {
    deleteDoc.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDocuments("uid-123"));
    await waitFor(() => expect(result.current.docs).toEqual(mockDocs));
    await act(async () => {
      await result.current.handleDelete(mockDocs[0]);
    });
    expect(deleteDoc).toHaveBeenCalledWith(mockDocs[0]);
  });

  it("sets error when delete fails", async () => {
    deleteDoc.mockRejectedValue(new Error("Storage error"));
    const { result } = renderHook(() => useDocuments("uid-123"));
    await waitFor(() => expect(result.current.docs).toEqual(mockDocs));
    await act(async () => {
      await result.current.handleDelete(mockDocs[0]);
    });
    expect(result.current.error).toBe("Failed to delete document. Please try again.");
  });

});