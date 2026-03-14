"""
pipeline.py
Orchestrates the full document processing pipeline:
  file bytes → chunk → embed → Qdrant → Firestore status update

Designed to run in a background thread after the upload route returns.
Does not handle HTTP concerns — call process_document() from routes.py.
"""

import os
import sys
import tempfile



def process_document(
    file_bytes: bytes,
    uid: str,
    file_name: str,
    doc_id: str,
    mimetype: str = "application/pdf",
) -> None:
    """
    Full pipeline: raw file bytes → chunks → embeddings → Qdrant → Firestore.

    Only processes PDFs. Other MIME types are skipped with a log message.

    Arguments:
        file_bytes: Raw bytes of the uploaded file (already in Firebase Storage).
        uid:        Firebase UID of the uploading user.
        file_name:  Original filename as uploaded.
        doc_id:     Firestore document ID to update when done (or on error).
        mimetype:   MIME type of the file. Non-PDF types are skipped.

    This function catches all exceptions internally so a background thread
    crash does not go silently — errors are logged and written to Firestore.
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

        # 1. Write bytes to a temp file — chunker.py requires a file path
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            print(f"[PIPELINE] Chunking '{file_name}' (doc: {doc_id}) …")
            chunks = chunk_pdf(tmp_path)
        finally:
            os.unlink(tmp_path)  # always clean up temp file

        if not chunks:
            mark_document_error(doc_id, "No text could be extracted from the PDF.")
            return

        print(f"[PIPELINE] Embedding {len(chunks)} chunks …")
        chunks = embed_chunks(chunks)

        print(f"[PIPELINE] Storing embeddings in Qdrant …")
        vector_ids = store_embeddings(
            chunks,
            uid=uid,
            file_name=file_name,
            doc_id=doc_id,
        )

        mark_document_ready(doc_id, vector_ids)
        print(f"[PIPELINE] Done — '{file_name}': {len(vector_ids)} vectors stored.")

    except Exception as exc:
        print(f"[PIPELINE] Error processing '{file_name}': {exc}")
        mark_document_error(doc_id, str(exc))
