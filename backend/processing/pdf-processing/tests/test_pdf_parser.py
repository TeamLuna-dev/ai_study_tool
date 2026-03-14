"""
tests/test_pdf_parser.py
pytest tests for Task 3 — PDF parsing and chunking.

Run from the pdf-parser/ directory:
    cd backend/pdf-parser
    pytest tests/test_pdf_parser.py -v

Covers:
  - PDF text extraction
  - Structural chunking via chunk_pdf()
  - Character chunking via chunk_text()
  - Overlap, empty input, stats
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pdf_parser import extract_text_from_pdf, PDFParseError
from chunker import chunk_text, chunk_pdf, get_chunk_stats


# ---------------------------------------------------------------------------
# Sample PDF fixture — generates a real PDF so tests are self-contained
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def sample_pdf_path(tmp_path_factory):
    """
    Creates a real PDF using reportlab.
    Falls back to a raw PDF bytestring if reportlab is not installed.
    """
    tmp_path = tmp_path_factory.mktemp("pdfs")
    pdf_path = tmp_path / "sample.pdf"

    try:
        from reportlab.pdfgen import canvas
        c = canvas.Canvas(str(pdf_path))
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, 750, "Introduction to Photosynthesis")
        c.setFont("Helvetica", 11)
        lines = [
            "Photosynthesis is the process by which plants use sunlight,",
            "water, and carbon dioxide to produce oxygen and glucose.",
            "It takes place in the chloroplasts of plant leaves.",
            "",
            "The Light Reactions",
            "During the light reactions, solar energy is captured and used",
            "to produce ATP and NADPH for the Calvin cycle.",
            "",
            "The Calvin Cycle",
            "In the Calvin cycle, ATP and NADPH convert carbon dioxide",
            "into glucose that the plant uses for energy and growth.",
        ]
        y = 720
        for line in lines:
            c.drawString(50, y, line)
            y -= 18
        c.save()

    except ImportError:
        # Minimal valid PDF as fallback
        raw = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 160>>
stream
BT /F1 12 Tf 50 750 Td
(Introduction to Photosynthesis) Tj
0 -20 Td (Plants use sunlight water and carbon dioxide.) Tj
0 -20 Td (They produce oxygen and glucose through this process.) Tj
ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000488 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
577
%%EOF"""
        pdf_path.write_bytes(raw)

    return str(pdf_path)


# ── PDF extraction ─────────────────────────────────────────────────────────

class TestExtractTextFromPDF:

    def test_extracts_non_empty_text(self, sample_pdf_path):
        text = extract_text_from_pdf(sample_pdf_path)
        assert isinstance(text, str)
        assert len(text.strip()) > 0

    def test_extracted_text_contains_expected_words(self, sample_pdf_path):
        text = extract_text_from_pdf(sample_pdf_path)
        assert any(w in text.lower() for w in ["photosynthesis", "plant", "oxygen"])

    def test_raises_on_nonexistent_file(self):
        with pytest.raises(PDFParseError, match="Could not open PDF"):
            extract_text_from_pdf("/nonexistent/path/file.pdf")

    def test_raises_on_non_pdf_file(self, tmp_path):
        fake = tmp_path / "fake.pdf"
        fake.write_text("this is not a pdf")
        with pytest.raises(PDFParseError):
            extract_text_from_pdf(str(fake))


# ── Structural chunking (chunk_pdf) ───────────────────────────────────────

class TestChunkPDF:

    def test_returns_list_of_dicts(self, sample_pdf_path):
        chunks = chunk_pdf(sample_pdf_path)
        assert isinstance(chunks, list)
        assert len(chunks) > 0

    def test_each_chunk_has_required_keys(self, sample_pdf_path):
        chunks = chunk_pdf(sample_pdf_path)
        for chunk in chunks:
            assert "index"    in chunk
            assert "text"     in chunk
            assert "type"     in chunk
            assert "metadata" in chunk

    def test_no_empty_chunks(self, sample_pdf_path):
        chunks = chunk_pdf(sample_pdf_path)
        for chunk in chunks:
            assert chunk["text"].strip() != ""

    def test_indices_are_sequential(self, sample_pdf_path):
        chunks = chunk_pdf(sample_pdf_path)
        assert [c["index"] for c in chunks] == list(range(len(chunks)))

    def test_no_chunk_exceeds_max_characters(self, sample_pdf_path, monkeypatch):
        """Chunks should respect the MAX_CHARACTERS ceiling."""
        import chunker
        monkeypatch.setattr(chunker, "MAX_CHARACTERS", 500)
        chunks = chunk_pdf(sample_pdf_path)
        for chunk in chunks:
            assert len(chunk["text"]) <= 500


# ── Character chunking (chunk_text) ───────────────────────────────────────

class TestChunkText:

    LONG_TEXT = "A" * 1000

    def test_returns_list_of_dicts(self):
        chunks = chunk_text(self.LONG_TEXT)
        assert isinstance(chunks, list)
        assert all(isinstance(c, dict) for c in chunks)

    def test_chunks_not_larger_than_chunk_size(self):
        chunks = chunk_text(self.LONG_TEXT, chunk_size=200, overlap=0)
        for chunk in chunks:
            assert len(chunk["text"]) <= 200

    def test_indices_are_sequential(self):
        chunks = chunk_text(self.LONG_TEXT)
        assert [c["index"] for c in chunks] == list(range(len(chunks)))

    def test_overlap_creates_shared_content(self):
        text   = "B" * 300
        chunks = chunk_text(text, chunk_size=100, overlap=50)
        assert len(chunks) >= 2
        assert chunks[0]["text"][-50:] == chunks[1]["text"][:50]

    def test_empty_string_returns_empty_list(self):
        assert chunk_text("") == []

    def test_whitespace_only_returns_empty_list(self):
        assert chunk_text("   \n\t  ") == []

    def test_short_text_returns_single_chunk(self):
        chunks = chunk_text("Hello world", chunk_size=500)
        assert len(chunks) == 1

    def test_consistent_chunk_sizes(self):
        chunks = chunk_text(self.LONG_TEXT, chunk_size=100, overlap=0)
        for chunk in chunks[:-1]:
            assert len(chunk["text"]) == 100


# ── Chunk stats ────────────────────────────────────────────────────────────

class TestGetChunkStats:

    def test_returns_correct_total(self):
        chunks = chunk_text("X" * 500, chunk_size=100, overlap=0)
        assert get_chunk_stats(chunks)["total"] == len(chunks)

    def test_empty_returns_zero_stats(self):
        assert get_chunk_stats([]) == {
            "total": 0, "min_size": 0, "max_size": 0, "avg_size": 0
        }

    def test_max_size_within_chunk_size(self):
        chunks = chunk_text("Y" * 300, chunk_size=100, overlap=0)
        assert get_chunk_stats(chunks)["max_size"] <= 100