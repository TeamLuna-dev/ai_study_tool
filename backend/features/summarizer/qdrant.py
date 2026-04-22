"""
qdrant.py — Summarizer feature
Qdrant vector search only. No HTTP, Firestore, or AI summarization logic.
"""

import os
import sys

SUMMARY_QUERY = "main topics, key concepts, and important details"
SCORE_THRESHOLD = 0.3
TOP_K = 20


def _add_backend_to_path() -> None:
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)


def search_document_chunks(doc_id: str, top_k: int = TOP_K) -> str:
    """
    Embeds a summary-focused query and searches Qdrant for the most relevant
    chunks belonging to the given document.

    Arguments:
        doc_id: Firestore document ID to filter results by.
        top_k:  Maximum number of chunks to return.

    Returns:
        Chunks joined as a single string in document order, or "" if none found.
    """
    _add_backend_to_path()

    from openai import OpenAI
    from embeddings.qdrant_store import get_client, COLLECTION_NAME
    from embeddings.embedder import EMBEDDING_MODEL
    from qdrant_client.models import Filter, FieldCondition, MatchValue

    query_vector = (
        OpenAI()
        .embeddings.create(model=EMBEDDING_MODEL, input=SUMMARY_QUERY)
        .data[0]
        .embedding
    )

    hits = get_client().search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        query_filter=Filter(
            must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id))]
        ),
        limit=top_k,
        score_threshold=SCORE_THRESHOLD,
        with_payload=True,
    )

    if not hits:
        return ""

    hits.sort(key=lambda h: h.payload.get("chunk_index", 0))
    return "\n\n".join(h.payload["text"] for h in hits if h.payload.get("text"))
