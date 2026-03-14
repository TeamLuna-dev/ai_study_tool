"""
tests/test_ocr.py
Unit tests for ocr.py.

Mocks google.cloud.vision.ImageAnnotatorClient so no real API key or
network connection is needed. Covers:

  - Happy path: multiple blocks returned as correctly indexed chunks
  - Single block with multi-paragraph text
  - Empty Vision response (no text on image)
  - Unsupported MIME type raises OCRError before any API call
  - Vision API error field raises OCRError
  - Network / client exception raises OCRError
  - Text reconstruction: words joined by spaces, paragraphs by newlines
  - Bounding box serialisation to list of {x, y} dicts
  - Confidence value is preserved in metadata
  - Whitespace-only blocks are skipped
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ocr import extract_text_from_image, OCRError


# ── Helpers to build fake Vision API objects ────────────────────────────────

def _make_symbol(text):
    s = MagicMock()
    s.text = text
    return s


def _make_word(chars):
    """chars: list of single-character strings making up the word."""
    w = MagicMock()
    w.symbols = [_make_symbol(c) for c in chars]
    return w


def _make_paragraph(words):
    p = MagicMock()
    p.words = words
    return p


def _make_vertex(x, y):
    v = MagicMock()
    v.x = x
    v.y = y
    return v


def _make_block(paragraphs, confidence=0.98, vertices=None):
    b = MagicMock()
    b.paragraphs  = paragraphs
    b.confidence  = confidence
    b.bounding_box.vertices = vertices or [
        _make_vertex(0, 0), _make_vertex(10, 0),
        _make_vertex(10, 5), _make_vertex(0, 5),
    ]
    return b


def _make_page(blocks):
    p = MagicMock()
    p.blocks = blocks
    return p


def _make_response(pages, full_text="", error_message=""):
    response = MagicMock()
    response.full_text_annotation.pages = pages
    response.full_text_annotation.text  = full_text
    response.error.message              = error_message
    return response


def _mock_client(response):
    """Returns a context patch that makes ImageAnnotatorClient return response."""
    client = MagicMock()
    client.document_text_detection.return_value = response
    return patch("ocr.vision.ImageAnnotatorClient", return_value=client)


# ── Happy path ───────────────────────────────────────────────────────────────

class TestHappyPath:

    def test_returns_list_of_dicts(self):
        word  = _make_word(list("Hello"))
        block = _make_block([_make_paragraph([word])])
        resp  = _make_response([_make_page([block])], full_text="Hello")

        with _mock_client(resp):
            chunks = extract_text_from_image(b"fake-image")

        assert isinstance(chunks, list)
        assert len(chunks) == 1

    def test_chunk_has_required_keys(self):
        word  = _make_word(list("Test"))
        block = _make_block([_make_paragraph([word])])
        resp  = _make_response([_make_page([block])], full_text="Test")

        with _mock_client(resp):
            chunk = extract_text_from_image(b"fake-image")[0]

        assert "index"    in chunk
        assert "text"     in chunk
        assert "type"     in chunk
        assert "metadata" in chunk

    def test_chunk_type_is_ocr_block(self):
        word  = _make_word(list("Note"))
        block = _make_block([_make_paragraph([word])])
        resp  = _make_response([_make_page([block])], full_text="Note")

        with _mock_client(resp):
            chunk = extract_text_from_image(b"fake-image")[0]

        assert chunk["type"] == "OCRBlock"

    def test_multiple_blocks_have_sequential_indices(self):
        block_a = _make_block([_make_paragraph([_make_word(list("First"))])])
        block_b = _make_block([_make_paragraph([_make_word(list("Second"))])])
        resp    = _make_response([_make_page([block_a, block_b])], full_text="First Second")

        with _mock_client(resp):
            chunks = extract_text_from_image(b"fake-image")

        assert [c["index"] for c in chunks] == [0, 1]

    def test_multiple_blocks_text_content(self):
        block_a = _make_block([_make_paragraph([_make_word(list("Hello"))])])
        block_b = _make_block([_make_paragraph([_make_word(list("World"))])])
        resp    = _make_response([_make_page([block_a, block_b])], full_text="Hello World")

        with _mock_client(resp):
            chunks = extract_text_from_image(b"fake-image")

        texts = [c["text"] for c in chunks]
        assert "Hello" in texts
        assert "World" in texts


# ── Text reconstruction ───────────────────────────────────────────────────────

class TestTextReconstruction:

    def test_words_joined_by_space(self):
        words = [_make_word(list("foo")), _make_word(list("bar"))]
        block = _make_block([_make_paragraph(words)])
        resp  = _make_response([_make_page([block])], full_text="foo bar")

        with _mock_client(resp):
            chunk = extract_text_from_image(b"fake-image")[0]

        assert chunk["text"] == "foo bar"

    def test_paragraphs_joined_by_newline(self):
        para_a = _make_paragraph([_make_word(list("Line1"))])
        para_b = _make_paragraph([_make_word(list("Line2"))])
        block  = _make_block([para_a, para_b])
        resp   = _make_response([_make_page([block])], full_text="Line1\nLine2")

        with _mock_client(resp):
            chunk = extract_text_from_image(b"fake-image")[0]

        assert chunk["text"] == "Line1\nLine2"

    def test_multi_character_symbols_concatenated(self):
        """Each symbol is one char; word text is their concatenation (no spaces)."""
        word  = _make_word(["H", "i"])
        block = _make_block([_make_paragraph([word])])
        resp  = _make_response([_make_page([block])], full_text="Hi")

        with _mock_client(resp):
            chunk = extract_text_from_image(b"fake-image")[0]

        assert chunk["text"] == "Hi"

    def test_leading_trailing_whitespace_stripped(self):
        word  = _make_word([" ", "A", " "])
        block = _make_block([_make_paragraph([word])])
        resp  = _make_response([_make_page([block])], full_text=" A ")

        with _mock_client(resp):
            chunk = extract_text_from_image(b"fake-image")[0]

        assert chunk["text"] == chunk["text"].strip()


# ── Metadata ──────────────────────────────────────────────────────────────────

class TestMetadata:

    def test_confidence_stored_in_metadata(self):
        word  = _make_word(list("ok"))
        block = _make_block([_make_paragraph([word])], confidence=0.95)
        resp  = _make_response([_make_page([block])], full_text="ok")

        with _mock_client(resp):
            chunk = extract_text_from_image(b"fake-image")[0]

        assert chunk["metadata"]["confidence"] == pytest.approx(0.95, abs=1e-4)

    def test_bounding_box_serialised_as_list_of_xy_dicts(self):
        vertices = [
            _make_vertex(10, 20), _make_vertex(100, 20),
            _make_vertex(100, 50), _make_vertex(10, 50),
        ]
        word  = _make_word(list("box"))
        block = _make_block([_make_paragraph([word])], vertices=vertices)
        resp  = _make_response([_make_page([block])], full_text="box")

        with _mock_client(resp):
            chunk = extract_text_from_image(b"fake-image")[0]

        bbox = chunk["metadata"]["bounding_box"]
        assert isinstance(bbox, list)
        assert len(bbox) == 4
        assert bbox[0] == {"x": 10, "y": 20}
        assert bbox[2] == {"x": 100, "y": 50}


# ── Empty / no-text responses ─────────────────────────────────────────────────

class TestEmptyResponse:

    def test_empty_full_text_returns_empty_list(self):
        resp = _make_response([], full_text="")

        with _mock_client(resp):
            result = extract_text_from_image(b"fake-image")

        assert result == []

    def test_whitespace_only_full_text_returns_empty_list(self):
        resp = _make_response([], full_text="   \n\t  ")

        with _mock_client(resp):
            result = extract_text_from_image(b"fake-image")

        assert result == []

    def test_whitespace_only_block_is_skipped(self):
        word  = _make_word([" ", " "])
        block = _make_block([_make_paragraph([word])])
        # full_text is non-empty so the annotation exists, but block text is blank
        resp  = _make_response([_make_page([block])], full_text="  ")

        with _mock_client(resp):
            result = extract_text_from_image(b"fake-image")

        assert result == []


# ── Error handling ────────────────────────────────────────────────────────────

class TestErrorHandling:

    def test_unsupported_mimetype_raises_ocr_error(self):
        with pytest.raises(OCRError, match="Unsupported image type"):
            extract_text_from_image(b"data", mimetype="application/pdf")

    def test_unsupported_mimetype_does_not_call_api(self):
        with patch("ocr.vision.ImageAnnotatorClient") as mock_cls:
            with pytest.raises(OCRError):
                extract_text_from_image(b"data", mimetype="image/gif")
            mock_cls.assert_not_called()

    def test_api_error_field_raises_ocr_error(self):
        resp = _make_response([], full_text="", error_message="PERMISSION_DENIED")

        with _mock_client(resp):
            with pytest.raises(OCRError, match="PERMISSION_DENIED"):
                extract_text_from_image(b"fake-image")

    def test_client_exception_raises_ocr_error(self):
        with patch("ocr.vision.ImageAnnotatorClient", side_effect=RuntimeError("no network")):
            with pytest.raises(OCRError, match="Vision API request failed"):
                extract_text_from_image(b"fake-image")

    def test_document_text_detection_exception_raises_ocr_error(self):
        client = MagicMock()
        client.document_text_detection.side_effect = RuntimeError("timeout")

        with patch("ocr.vision.ImageAnnotatorClient", return_value=client):
            with pytest.raises(OCRError, match="Vision API request failed"):
                extract_text_from_image(b"fake-image")


# ── MIME type acceptance ──────────────────────────────────────────────────────

class TestSupportedMimetypes:

    def _simple_response(self):
        word  = _make_word(list("hi"))
        block = _make_block([_make_paragraph([word])])
        return _make_response([_make_page([block])], full_text="hi")

    def test_jpeg_accepted(self):
        with _mock_client(self._simple_response()):
            result = extract_text_from_image(b"fake", mimetype="image/jpeg")
        assert len(result) == 1

    def test_png_accepted(self):
        with _mock_client(self._simple_response()):
            result = extract_text_from_image(b"fake", mimetype="image/png")
        assert len(result) == 1
