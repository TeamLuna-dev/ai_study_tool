"""
pipeline.py
Orchestrates the full document processing pipeline:
  file bytes → chunk → embed → Qdrant → Firestore status update

Each stage updates the Firestore doc status so the React frontend can
display live progress via an onSnapshot listener.

Status progression:
  processing → extracting → embedding → storing → ready
                                               ↘ error (at any stage)

Designed to run in a background thread after the upload route returns.
All dependencies are imported at module level so tests can mock them via
  pipeline.chunk_pdf = MagicMock(...)
"""

import os
import sys
import tempfile

# ── Path setup (module level so imports below resolve correctly) ──────────────


def process_document(
    file_bytes: bytes,
    uid: str,
    file_name: str,
    doc_id: str,
    mimetype: str = "application/pdf",
) -> None:
    """
    Full pipeline: raw file bytes → chunks → embeddings → Qdrant → Firestore.

    Writes a status update to Firestore before each stage so the frontend
    can show live progress. On failure, writes a structured error with the
    stage name and a human-readable message.

    Arguments:
        file_bytes: Raw bytes of the uploaded file.
        uid:        Firebase UID of the uploading user.
        file_name:  Original filename as uploaded.
        doc_id:     Firestore document ID to update throughout processing.
        mimetype:   Only "application/pdf" is processed; others are rejected.
    """
   

    from features.upload.firebase_storage import mark_document_ready, mark_document_error

    # Only PDFs can be chunked; skip other types gracefully
    if mimetype != "application/pdf":
        print(f"[PIPELINE] Skipping non-PDF file '{file_name}' (mimetype: {mimetype}).")
        mark_document_error(doc_id, f"Embedding pipeline only supports PDFs, got {mimetype}.")
        return

    try:
        from processing.chunker import chunk_pdf
        from .embedder import embed_chunks
        from .qdrant_store import store_embeddings

            try:
                print(f"[PIPELINE] Extracting '{file_name}' …")
                chunks = chunk_pdf(tmp_path)
            finally:
                os.unlink(tmp_path)

            if not chunks:
                mark_document_error(
                    doc_id,
                    stage="extraction",
                    message="No text could be extracted. The PDF may be image-based or empty.",
                )
                return

    except Exception as exc:
        print(f"[PIPELINE] Extraction failed for '{file_name}': {exc}")
        mark_document_error(doc_id, stage="extraction", message=str(exc))
        return

    # ── Stage 2: Embedding ────────────────────────────────────────────────
    update_document_status(doc_id, "embedding")
    try:
        print(f"[PIPELINE] Embedding {len(chunks)} chunks …")
        chunks = embed_chunks(chunks)

    except Exception as exc:
        print(f"[PIPELINE] Embedding failed for '{file_name}': {exc}")
        mark_document_error(doc_id, stage="embedding", message=str(exc))
        return

    # ── Stage 3: Qdrant Storage ───────────────────────────────────────────
    update_document_status(doc_id, "storing")
    try:
        print(f"[PIPELINE] Storing embeddings in Qdrant …")
        vector_ids = store_embeddings(
            chunks,
            uid=uid,
            file_name=file_name,
            doc_id=doc_id,
        )

    except Exception as exc:
        print(f"[PIPELINE] Storage failed for '{file_name}': {exc}")
        mark_document_error(doc_id, stage="storage", message=str(exc))
        return

    # ── Done ──────────────────────────────────────────────────────────────
    mark_document_ready(doc_id, vector_ids)
    print(f"[PIPELINE] Done — '{file_name}': {len(vector_ids)} vectors stored.")
