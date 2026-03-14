"""
chunker.py
Handles only text chunking — nothing else.

Strategy: structure-aware chunking via the `unstructured` library.
  - Partitions the PDF into typed elements (Title, NarrativeText, Table, etc.)
  - Chunks by title boundaries so each chunk stays within one section
  - Falls back to character-based chunking if unstructured is unavailable

structure-aware vs. character-based chunking:
  Character-based chunking cuts mid-sentence and mid-paragraph, producing
  chunks with no semantic coherence. Structure-aware chunking respects the
  document's natural boundaries — a chunk is a section, not an arbitrary
  slice — which significantly improves retrieval accuracy in Qdrant.

  TLDR: structure-aware chunking is better, but requires unstructured, 
  which can be heavy to install. character-based chunking is a simpler, lightweight
  failsafe.

The fallback character chunker is . Swap strategies bychanging CHUNKING_STRATEGY 
in your .env without touching callers.
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

    Preferred path: uses unstructured to detect document structure
    (headings, paragraphs, tables) and chunk by title boundaries.

    Fallback path: reads extracted text and splits by character count
    with overlap (used when unstructured is not installed).

    Arguments:
        file_path: Path to the PDF file.

    Returns:
        List of chunk dicts, each with:
          - "index":    int   position of this chunk (0-based)
          - "text":     str   chunk content
          - "type":     str   element type e.g. "NarrativeText", "Table"
          - "metadata": dict  page numbers and any other structural info
    """
    if CHUNKING_STRATEGY == "structural":
        try:
            return _structural_chunk(file_path)
        except ImportError:
            print(
                "[chunker] unstructured not installed — falling back to "
                "character chunking. Run: pip install unstructured[pdf]"
            )

    # Fallback — extract text first then character-chunk it
    from .pdf_parser import extract_text_from_pdf
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

def _structural_chunk(file_path: str) -> List[dict]:
    """
    Uses unstructured to partition the PDF by layout and chunk by title.

    partition_pdf detects element types automatically:
      - Title, NarrativeText, ListItem, Table, Header, Footer, etc.

    chunk_by_title groups elements under their nearest heading, so each
    chunk represents one coherent section of the document rather than
    an arbitrary character slice.
    """
    from unstructured.partition.pdf import partition_pdf
    from unstructured.chunking.title import chunk_by_title

    # hi_res strategy uses layout analysis for better accuracy on
    # complex PDFs (multi-column, tables, mixed content)
    elements = partition_pdf(
        filename=file_path,
        strategy="hi_res",
    )

    chunks = chunk_by_title(
        elements,
        max_characters=MAX_CHARACTERS,
        combine_text_under_n_chars=COMBINE_UNDER_N_CHARS,
    )

    return [
        {
            "index":    i,
            "text":     str(chunk),
            # element_type tells us if this is a heading, paragraph, table etc.
            "type":     type(chunk).__name__,
            "metadata": chunk.metadata.to_dict() if hasattr(chunk, "metadata") else {},
        }
        for i, chunk in enumerate(chunks)
        if str(chunk).strip()   # skip empty chunks
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