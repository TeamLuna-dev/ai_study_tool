/**
 * DocumentCard.test.jsx
 * Unit tests for DocumentCard.jsx — tests rendering and user interactions.
 *
 * Tests are organized by concern:
 *   - Static rendering: filename, badges, meta info
 *   - Delete flow: overlay appears, cancel dismisses, confirm calls onDelete
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DocumentCard from "../DocumentCard";

// ── Default mock doc ───────────────────────────────────────────────────────
// A complete valid document object — individual tests override specific fields
const defaultDoc = {
  id: "doc-1",
  fileName: "Biology Notes.pdf",
  fileType: "pdf",
  fileSize: 4200000,
  status: "ready",
  uploadedAt: { seconds: 1712000000 },
  storagePath: "users/uid/documents/biology.pdf",
};

// ── Rendering tests ────────────────────────────────────────────────────────
describe("DocumentCard — rendering", () => {

  it("renders the filename", () => {
    render(<DocumentCard doc={defaultDoc} onDelete={vi.fn()} />);
    expect(screen.getByText("Biology Notes.pdf")).toBeTruthy();
  });

  it("renders Unnamed document when fileName is missing", () => {
    render(<DocumentCard doc={{ ...defaultDoc, fileName: null }} onDelete={vi.fn()} />);
    expect(screen.getByText("Unnamed document")).toBeTruthy();
  });

  it("renders PDF file type badge", () => {
    render(<DocumentCard doc={defaultDoc} onDelete={vi.fn()} />);
    expect(screen.getByText("PDF")).toBeTruthy();
  });

  it("renders Image badge for png files", () => {
    render(<DocumentCard doc={{ ...defaultDoc, fileType: "png" }} onDelete={vi.fn()} />);
    expect(screen.getByText("Image")).toBeTruthy();
  });

  it("renders File badge for unknown file types", () => {
    render(<DocumentCard doc={{ ...defaultDoc, fileType: "docx" }} onDelete={vi.fn()} />);
    expect(screen.getByText("File")).toBeTruthy();
  });

  it("renders Ready status badge", () => {
    render(<DocumentCard doc={defaultDoc} onDelete={vi.fn()} />);
    expect(screen.getByText("Ready")).toBeTruthy();
  });

  it("renders Processing status badge", () => {
    render(<DocumentCard doc={{ ...defaultDoc, status: "processing" }} onDelete={vi.fn()} />);
    expect(screen.getByText("Processing")).toBeTruthy();
  });

  it("renders Error status badge", () => {
    render(<DocumentCard doc={{ ...defaultDoc, status: "error" }} onDelete={vi.fn()} />);
    expect(screen.getByText("Error")).toBeTruthy();
  });

  it("renders Unknown status badge for unrecognized status", () => {
    render(<DocumentCard doc={{ ...defaultDoc, status: "weird" }} onDelete={vi.fn()} />);
    expect(screen.getByText("Unknown")).toBeTruthy();
  });

  it("renders formatted file size", () => {
    render(<DocumentCard doc={defaultDoc} onDelete={vi.fn()} />);
    expect(screen.getByText("4.0 MB")).toBeTruthy();
  });

  it("renders dash when fileSize is missing", () => {
    render(<DocumentCard doc={{ ...defaultDoc, fileSize: null }} onDelete={vi.fn()} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders dash when uploadedAt is missing", () => {
    render(<DocumentCard doc={{ ...defaultDoc, uploadedAt: null }} onDelete={vi.fn()} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders the delete button", () => {
    render(<DocumentCard doc={defaultDoc} onDelete={vi.fn()} />);
    expect(screen.getByText("Delete")).toBeTruthy();
  });

});

// ── Delete flow tests ──────────────────────────────────────────────────────
describe("DocumentCard — delete flow", () => {

  it("shows confirmation overlay when Delete is clicked", () => {
    render(<DocumentCard doc={defaultDoc} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByText("Delete this document?")).toBeTruthy();
  });

  it("shows Cancel and Yes delete buttons in overlay", () => {
    render(<DocumentCard doc={defaultDoc} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByText("Yes, delete")).toBeTruthy();
  });

  it("hides overlay when Cancel is clicked", () => {
    render(<DocumentCard doc={defaultDoc} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Delete this document?")).toBeNull();
  });

  it("calls onDelete with the doc when Yes delete is clicked", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<DocumentCard doc={defaultDoc} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Yes, delete"));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(defaultDoc));
  });

  it("shows Deleting... while onDelete is pending", async () => {
    // never resolves — simulates a slow delete
    const onDelete = vi.fn(() => new Promise(() => {}));
    render(<DocumentCard doc={defaultDoc} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Yes, delete"));
    await waitFor(() => expect(screen.getByText("Deleting...")).toBeTruthy());
  });

  it("overlay disappears after successful delete", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<DocumentCard doc={defaultDoc} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Yes, delete"));
    await waitFor(() =>
      expect(screen.queryByText("Delete this document?")).toBeNull()
    );
  });

});