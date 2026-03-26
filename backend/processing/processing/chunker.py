"""
chunker.py
Handles only text chunking — nothing else.

Two strategies, controlled by CHUNKING_STRATEGY in .env:
  "api"        → Unstructured hosted API (structure-aware, no local install)
  anything else → pdfminer character-based fallback
"""

import os
from typing import List

# ---------------------------------------------------------------------------
# Strategy selection — set CHUNKING_STRATEGY=character in .env to force
# the fallback (useful if unstructured install is too heavy for your env)
# ---------------------------------------------------------------------------
CHUNKING_STRATEGY = os.getenv("CHUNKING_STRATEGY", "structural")

# ---------------------------------------------------------------------------
# Structural chunking settings
# max_characters:         hard ceiling per chunk (matches embedding model limits)
# combine_text_under_n:   merge short orphan elements into the previous chunk
#                         avoids single-sentence chunks with little context
# ---------------------------------------------------------------------------
MAX_CHARACTERS         = int(os.getenv("CHUNK_MAX_CHARACTERS", "1500"))
COMBINE_UNDER_N_CHARS  = int(os.getenv("CHUNK_COMBINE_UNDER_N", "200"))

# ---------------------------------------------------------------------------
# Fallback character chunking settings
# ---------------------------------------------------------------------------
DEFAULT_CHUNK_SIZE = 500
DEFAULT_OVERLAP    = 100


# ── Public API ─────────────────────────────────────────────────────────────

def chunk_pdf(file_path: str) -> List[dict]:
    """
    Partitions and chunks a PDF file into semantically coherent chunks.

    Strategy is controlled by CHUNKING_STRATEGY in .env:
      "api"        → Unstructured hosted API (recommended — no local install needed)
      anything else → pdfminer character-based fallback

    Arguments:
        file_path: Path to the PDF file.

    Returns:
        List of chunk dicts, each with:
          - "index":    int   position of this chunk (0-based)
          - "text":     str   chunk content
          - "type":     str   element type e.g. "NarrativeText", "Table"
          - "metadata": dict  page numbers and any other structural info
    """
    if CHUNKING_STRATEGY == "api":
        return _api_chunk(file_path)

    # Fallback — extract text first then character-chunk it
    from pdf_parser import extract_text_from_pdf
    text = extract_text_from_pdf(file_path)
    return _character_chunk(text)


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_OVERLAP,
) -> List[dict]:
    """
    Character-based chunker exposed as a standalone function for testing
    and fail-safe chunking when unstructured isn't available.

    Arguments:
        text:       The full text to split.
        chunk_size: Max characters per chunk.
        overlap:    Characters repeated at the start of each new chunk.

    Returns:
        List of chunk dicts with index, text, char_start, char_end.
    """
    return _character_chunk(text, chunk_size, overlap)


def get_chunk_stats(chunks: List[dict]) -> dict:
    """
    Returns basic stats about a list of chunks.
    For debugging and verifying consistent chunk sizes.
    """
    if not chunks:
        return {"total": 0, "min_size": 0, "max_size": 0, "avg_size": 0}

    sizes = [len(c["text"]) for c in chunks]

    return {
        "total":    len(chunks),
        "min_size": min(sizes),
        "max_size": max(sizes),
        "avg_size": round(sum(sizes) / len(sizes), 1),
    }


# ── Internal implementations ───────────────────────────────────────────────

def _api_chunk(file_path: str) -> List[dict]:
    """
    Sends the PDF to the Unstructured hosted API for partitioning and chunking.
    Requires UNSTRUCTURED_API_KEY in the environment.

    The API handles both partitioning (detecting element types) and chunking
    (grouping by title) in a single request — no local ML models needed.
    """
    from unstructured_client import UnstructuredClient
    from unstructured_client.models import shared
    from unstructured_client.models.operations import PartitionRequest

    api_key = os.getenv("UNSTRUCTURED_API_KEY")
    if not api_key:
        raise ValueError(
            "UNSTRUCTURED_API_KEY is not set. "
            "Add it to your .env or switch CHUNKING_STRATEGY=fast."
        )

    client = UnstructuredClient(api_key_auth=api_key)

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    req = PartitionRequest(
        partition_parameters=shared.PartitionParameters(
            files=shared.Files(
                content=file_bytes,
                file_name=os.path.basename(file_path),
            ),
            strategy=shared.Strategy.HI_RES,
            chunking_strategy="by_title",
            max_characters=MAX_CHARACTERS,
            combine_under_n_chars=COMBINE_UNDER_N_CHARS,
        )
    )

    resp = client.general.partition(request=req)

    return [
        {
            "index":    i,
            "text":     element.get("text", ""),
            "type":     element.get("type", "text"),
            "metadata": element.get("metadata", {}),
        }
        for i, element in enumerate(resp.elements or [])
        if element.get("text", "").strip()
    ]


def _character_chunk(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_OVERLAP,
) -> List[dict]:
    """
    Fallback character-based chunker.
    Splits text into fixed-size windows with overlap.
    """
    if not text or not text.strip():
        return []

    chunks = []
    start  = 0
    index  = 0

    while start < len(text):
        end     = start + chunk_size
        content = text[start:end].strip()

        if content:
            chunks.append({
                "index":      index,
                "text":       content,
                "type":       "text",
                "char_start": start,
                "char_end":   min(end, len(text)),
                "metadata":   {},
            })
            index += 1

        start += chunk_size - overlap

    return chunks