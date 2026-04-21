"""
pipeline.py
Orchestrates the full document processing pipeline:
  file bytes → chunk → embed → Qdrant → Firestore status update

Each stage updates the Firestore doc status so the React frontend can
display live progress via an onSnapshot listener.

PDF status progression:
  processing → extracting → embedding → storing → ready

Image status progression:
  processing → extracting → pending_review
    (user confirms OCR text)
  pending_review → embedding → storing → ready

Designed to run in a background thread after the upload route returns.
"""

import os
import sys
import tempfile

# ── Path setup (module level so imports below resolve correctly) ──────────────

def _add_to_path(directory: str) -> None:
    abs_dir = os.path.abspath(directory)
    if abs_dir not in sys.path:
        sys.path.insert(0, abs_dir)

_base = os.path.dirname(__file__)
for _rel in [".", "..", "../pdf-processing", "../file-upload"]:
    _add_to_path(os.path.join(_base, _rel))

# ── Module-level imports (patchable by tests) ─────────────────────────────────

from processing.processing.chunker import chunk_pdf, chunk_text
from processing.processing.ocr import extract_text_from_image
from embeddings.embedder import embed_chunks
from embeddings.qdrant_store import store_embeddings
from features.upload.firebase_storage import (
    update_document_status,
    mark_document_ready,
    mark_document_error,
    store_ocr_text,
    store_document_topic,
)

IMAGE_MIME_TYPES = {"image/jpeg", "image/png"}

LOW_CONFIDENCE_THRESHOLD = 0.70


def _mean_confidence(chunks: list) -> float:
    """Returns the average OCR confidence across all blocks, or 1.0 if unavailable."""
    scores = [
        c["metadata"]["confidence"]
        for c in chunks
        if isinstance(c.get("metadata"), dict) and "confidence" in c["metadata"]
    ]
    return sum(scores) / len(scores) if scores else 1.0

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
    if mimetype not in IMAGE_MIME_TYPES and mimetype != "application/pdf":
        mark_document_error(
            doc_id,
            stage="extraction",
            message=f"Unsupported file type: {mimetype}. Only PDF, JPEG, and PNG are accepted.",
        )
        return

    # Stage 1: Extraction
    update_document_status(doc_id, "extracting")
    try:
        if mimetype in IMAGE_MIME_TYPES:
            # ── Image path: OCR via Google Vision API ─────────────────────
            print(f"[PIPELINE] Running OCR on '{file_name}' …")
            chunks = extract_text_from_image(file_bytes, mimetype)

            if not chunks:
                mark_document_error(
                    doc_id,
                    stage="extraction",
                    message="No text could be extracted from the image.",
                )
                return

            # Write combined text to Firestore and wait for user confirmation.
            # Embedding happens in process_confirmed_ocr_text() once confirmed.
            ocr_text = "\n\n".join(c["text"] for c in chunks)
            store_ocr_text(doc_id, ocr_text)

            avg_conf = _mean_confidence(chunks)
            extra = None
            if avg_conf < LOW_CONFIDENCE_THRESHOLD:
                extra = {
                    "ocr_warning": (
                        f"Low OCR confidence ({avg_conf:.0%}). "
                        "The extracted text may contain errors — review carefully before confirming."
                    )
                }
            update_document_status(doc_id, "pending_review", extra)
            print(f"[PIPELINE] OCR complete for '{file_name}' — awaiting user review.")
            return

        else:
            # ── PDF path: chunk via Unstructured API ──────────────────────
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

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

    # Stage 2: Embedding
    update_document_status(doc_id, "embedding")
    try:
        print(f"[PIPELINE] Embedding {len(chunks)} chunks ...")
        chunks = embed_chunks(chunks)

    except Exception as exc:
        print(f"[PIPELINE] Embedding failed for '{file_name}': {exc}")
        mark_document_error(doc_id, stage="embedding", message=str(exc))
        return

    # Stage 3: Storage
    update_document_status(doc_id, "storing")
    try:
        print(f"[PIPELINE] Storing embeddings in Qdrant ...")
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

    # Done
    mark_document_ready(doc_id, vector_ids)
    print(f"[PIPELINE] Done — '{file_name}': {len(vector_ids)} vectors stored.")

    try:
        from features.quizgen.topic_classifier import classify_document_topic
        topic = classify_document_topic(doc_id)
        store_document_topic(doc_id, topic)
    except Exception as exc:
        print(f"[PIPELINE] Warning: topic classification failed for '{file_name}': {exc}")


def process_confirmed_ocr_text(
    text: str,
    uid: str,
    file_name: str,
    doc_id: str,
) -> None:
    """
    Entry point for the embedding pipeline after a user confirms their OCR text.

    Chunks the confirmed text with chunk_text(), then passes the result through
    the same embed_chunks() → store_embeddings() stages used by the PDF path,
    ensuring identical chunk structure and embedding behaviour across both types.

    Arguments:
        text:      Confirmed (possibly edited) OCR text.
        uid:       Firebase UID of the document owner.
        file_name: Original image filename.
        doc_id:    Firestore document ID to update throughout.
    """
    # ── Stage 2: Embedding ────────────────────────────────────────────────
    update_document_status(doc_id, "embedding")
    try:
        chunks = chunk_text(text)
        if not chunks:
            mark_document_error(
                doc_id,
                stage="embedding",
                message="No text to embed. The confirmed text may be empty.",
            )
            return

        print(f"[PIPELINE] Embedding {len(chunks)} confirmed OCR chunks for '{file_name}' …")
        chunks = embed_chunks(chunks)

    except Exception as exc:
        print(f"[PIPELINE] Embedding failed for '{file_name}': {exc}")
        mark_document_error(doc_id, stage="embedding", message=str(exc))
        return

    # ── Stage 3: Qdrant Storage ───────────────────────────────────────────
    update_document_status(doc_id, "storing")
    try:
        print(f"[PIPELINE] Storing confirmed OCR embeddings for '{file_name}' …")
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

    mark_document_ready(doc_id, vector_ids)
    print(f"[PIPELINE] Done — '{file_name}': {len(vector_ids)} confirmed OCR vectors stored.")

    try:
        from features.quizgen.topic_classifier import classify_document_topic
        topic = classify_document_topic(doc_id)
        store_document_topic(doc_id, topic)
    except Exception as exc:
        print(f"[PIPELINE] Warning: topic classification failed for '{file_name}': {exc}")
