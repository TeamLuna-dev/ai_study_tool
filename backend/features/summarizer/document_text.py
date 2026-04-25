"""
document_text.py — Summarizer feature
Resolves the text for a document from available sources.

Single responsibility: answer "give me the text for this document."
Source priority: Firestore ocr_text → Qdrant vector search.
"""

from .firestore import get_document_metadata, DocumentNotFoundError
from .qdrant import search_document_chunks


def get_document_text(doc_id: str, uid: str) -> tuple[str, str]:
    """
    Returns (text, file_name) for a document, trying Firestore then Qdrant.

    Arguments:
        doc_id: Firestore document ID.
        uid:    Firebase UID of the requesting user.

    Returns:
        (text, file_name) tuple.

    Raises:
        DocumentNotFoundError: If the document does not exist, is not owned
                               by the user, or has no extractable text.
    """
    meta = get_document_metadata(doc_id, uid)

    text = meta.get("ocr_text", "").strip()
    if not text:
        try:
            text = search_document_chunks(doc_id)
        except Exception as exc:
            print(f"[SUMMARIZER] Warning: Qdrant search failed for {doc_id}: {exc}")

    if not text:
        raise DocumentNotFoundError(
            "No extracted text is available for this document."
        )

    return text, meta.get("file_name", "")
