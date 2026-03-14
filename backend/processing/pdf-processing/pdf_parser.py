"""
pdf_parser.py
Handles only PDF text extraction — nothing else.

Uses pdfminer.six directly since unstructured already installs it,
avoiding the pdfplumber version conflict.

This is the fallback path — only called when unstructured is unavailable.
When unstructured is installed, chunker.py uses partition_pdf directly
and never calls this file.
"""

import io
from pdfminer.high_level import extract_text
from pdfminer.pdfparser import PDFSyntaxError


class PDFParseError(Exception):
    """
    Raised when text cannot be extracted from a PDF.
    Callers catch this to return a meaningful error response to the frontend.
    """


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts all readable text from a PDF file using pdfminer.six.

    Args:
        file_path: Path to the PDF file.

    Returns:
        Full extracted text as a single string.

    Raises:
        PDFParseError: If the file can't be opened, is encrypted,
                       or contains no extractable text.
    """
    try:
        text = extract_text(file_path)
    except PDFSyntaxError as exc:
        raise PDFParseError(f"Could not open PDF: {exc}") from exc
    except Exception as exc:
        raise PDFParseError(f"Could not open PDF: {exc}") from exc

    if not text or not text.strip():
        raise PDFParseError(
            "No readable text found. The PDF may be image-based. "
            "OCR support is not yet enabled."
        )

    return text.strip()