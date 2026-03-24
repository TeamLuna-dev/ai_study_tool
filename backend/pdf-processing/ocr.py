"""
ocr.py
Extracts text from image files using the Google Cloud Vision API.

Returns chunks in the same format as chunker.py so the rest of the
pipeline (embedder, qdrant_store) can handle images without changes.

Supported input: JPEG, PNG image bytes.

Each detected text block on the page becomes one chunk:
  - "index":    int   — position of this block (0-based, reading order)
  - "text":     str   — block content
  - "type":     str   — always "OCRBlock"
  - "metadata": dict  — confidence score and bounding-box vertices

Raises OCRError for any Vision API or parsing failure.
"""

import os
from typing import List

from google.cloud import vision


SUPPORTED_MIMETYPES = {"image/jpeg", "image/png"}


class OCRError(Exception):
    """Raised when the Vision API returns an error or text cannot be extracted."""


# ── Public API ──────────────────────────────────────────────────────────────

def extract_text_from_image(image_bytes: bytes, mimetype: str = "image/jpeg") -> List[dict]:
    """
    Sends image bytes to the Google Vision API and returns detected text
    as a list of structured chunks, one per text block.

    Arguments:
        image_bytes: Raw bytes of the image file.
        mimetype:    MIME type of the image ("image/jpeg" or "image/png").

    Returns:
        List of chunk dicts — same schema as chunker.chunk_pdf output:
            index, text, type ("OCRBlock"), metadata (confidence, bounding_box).
        Returns an empty list if no text is detected.

    Raises:
        OCRError: If the mimetype is unsupported, the API returns an error,
                  or the response cannot be parsed.
    """
    if mimetype not in SUPPORTED_MIMETYPES:
        raise OCRError(
            f"Unsupported image type '{mimetype}'. "
            f"Supported types: {', '.join(sorted(SUPPORTED_MIMETYPES))}"
        )

    try:
        client   = vision.ImageAnnotatorClient()
        image    = vision.Image(content=image_bytes)
        response = client.document_text_detection(image=image)
    except Exception as exc:
        raise OCRError(f"Vision API request failed: {exc}") from exc

    if response.error.message:
        raise OCRError(f"Vision API error: {response.error.message}")

    annotation = response.full_text_annotation
    if not annotation or not annotation.text.strip():
        return []

    chunks = []
    block_index = 0

    for page in annotation.pages:
        for block in page.blocks:
            block_text = _block_to_text(block)
            if not block_text.strip():
                continue
            chunks.append({
                "index":    block_index,
                "text":     block_text.strip(),
                "type":     "OCRBlock",
                "metadata": {
                    "confidence":   round(block.confidence, 4),
                    "bounding_box": _vertices_to_list(block.bounding_box),
                },
            })
            block_index += 1

    return chunks


# ── Internal helpers ─────────────────────────────────────────────────────────

def _block_to_text(block) -> str:
    """
    Reconstructs the plain text of a Vision API block by walking
    paragraphs → words → symbols.

    Inserts a space between words and a newline between paragraphs so the
    text reads naturally without losing line-break context.
    """
    paragraph_texts = []
    for paragraph in block.paragraphs:
        word_texts = []
        for word in paragraph.words:
            word_texts.append("".join(sym.text for sym in word.symbols))
        paragraph_texts.append(" ".join(word_texts))
    return "\n".join(paragraph_texts)


def _vertices_to_list(bounding_box) -> List[dict]:
    """
    Converts a Vision API BoundingPoly into a plain list of {x, y} dicts
    for JSON serialisation.
    """
    return [{"x": v.x, "y": v.y} for v in bounding_box.vertices]
