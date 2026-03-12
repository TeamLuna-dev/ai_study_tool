"""
qdrant_store.py
Stores embedding vectors in Qdrant with per-chunk metadata.

Single responsibility: take embedded chunks and write them to Qdrant.
Does not call OpenAI, parse PDFs, or touch Firebase.

Metadata stored per point:
  - user_id      Firebase UID of the uploading user
  - file_name    Original filename as uploaded
  - doc_id       Firestore document ID (links back to the source document)
  - timestamp    ISO-8601 UTC timestamp of when the embedding was stored
  - chunk_index  Position of this chunk in the document (0-based)
  - chunk_type   Element type from unstructured (e.g. NarrativeText, Table)
  - text         The raw chunk text (enables keyword search alongside vector search)
"""

import os
import uuid
from datetime import datetime, timezone
from typing import List

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

QDRANT_URL       = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY   = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME  = os.getenv("QDRANT_COLLECTION", "study_documents")
VECTOR_SIZE      = 1536  # text-embedding-3-small output dimension


def get_client() -> QdrantClient:
    """Returns a configured Qdrant client."""
    api_key = QDRANT_API_KEY if QDRANT_API_KEY and QDRANT_API_KEY != "paste_your_key_here" else None
    return QdrantClient(url=QDRANT_URL, api_key=api_key)


def ensure_collection(client: QdrantClient) -> None:
    """
    Creates the Qdrant collection if it does not already exist.
    Safe to call on every request — no-op if the collection is already there.
    """
    existing_names = {c.name for c in client.get_collections().collections}
    if COLLECTION_NAME not in existing_names:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
        print(f"[QDRANT] Created collection '{COLLECTION_NAME}'.")


def store_embeddings(
    chunks: List[dict],
    uid: str,
    file_name: str,
    doc_id: str,
) -> List[str]:
    """
    Upserts embedded chunks into Qdrant.

    Arguments:
        chunks:    List of chunk dicts, each must have "embedding" (from embedder.py)
                   plus "index", "text", and optionally "type".
        uid:       Firebase UID of the uploading user.
        file_name: Original filename (e.g. "lecture_notes.pdf").
        doc_id:    Firestore document ID for this file.

    Returns:
        List of Qdrant point ID strings (UUIDs), one per chunk.

    Raises:
        qdrant_client.http.exceptions.UnexpectedResponse: If the upsert fails.
    """
    client = get_client()
    ensure_collection(client)

    timestamp = datetime.now(timezone.utc).isoformat()
    points: List[PointStruct] = []
    point_ids: List[str] = []

    for chunk in chunks:
        point_id = str(uuid.uuid4())
        point_ids.append(point_id)

        points.append(
            PointStruct(
                id=point_id,
                vector=chunk["embedding"],
                payload={
                    "user_id":     uid,
                    "file_name":   file_name,
                    "doc_id":      doc_id,
                    "timestamp":   timestamp,
                    "chunk_index": chunk["index"],
                    "chunk_type":  chunk.get("type", "text"),
                    "text":        chunk["text"],
                },
            )
        )

    client.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"[QDRANT] Stored {len(points)} vectors for doc '{doc_id}'.")

    return point_ids
