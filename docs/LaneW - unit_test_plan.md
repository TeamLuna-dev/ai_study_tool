# Unit Test Plan

**Project:** AI Study Tool — Backend  
**Test Framework:** pytest  
**Scope:** Three test files covering the summarizer routes, file upload endpoint, and document embedding pipeline.

---

## 1. test_summarizer_routes.py

**Location:** `backend/features/summarizer/tests/test_summarizer_routes.py`  
**Source under test:** `backend/features/summarizer/routes.py`

### Why this code is best suited for unit testing

`routes.py` is the integration point between HTTP concerns (auth, request parsing, response shaping) and the service layer (OpenAI calls, Firestore reads/writes). It branches on multiple conditions — missing auth, missing fields, document not found, Firestore failure — making it high-value for unit testing. Each branch produces a distinct HTTP status code and JSON response body that can be precisely asserted. Mocking the service layer keeps tests fast and deterministic with no external API calls.

### Functions under test

| Function | Route | HTTP Method |
|----------|-------|-------------|
| `generate_summary()` | `/api/summarizer/generate` | POST |
| `get_summary_history()` | `/api/summarizer/history` | GET |

### Test classes and cases

#### `TestAuth`
Verifies that `verify_firebase_token` correctly gates both endpoints.

| Test | Input fields | Return object asserted |
|------|-------------|----------------------|
| `test_missing_token_returns_401` | `{"text": "hello"}` with mocked bad token | `response.status_code == 401` |
| `test_invalid_token_returns_401` | `{"text": "hello"}` with mocked bad token message | `response.status_code == 401`, `response.get_json()["error"]` present |

**Mock:** `verify_firebase_token` patched to return `(None, "Invalid or expired token")`.

---

#### `TestRawTextPath`
Verifies the direct-text summarization path where no `doc_id` is provided.

| Test | Input fields | Return object asserted |
|------|-------------|----------------------|
| `test_returns_200_with_summary` | `{"text": "Some notes."}` | `status_code == 200`, `response.get_json()["summary"] == "Key points: A, B, C."` |
| `test_doc_id_is_null_for_raw_text` | `{"text": "Some notes."}` | `response.get_json()["doc_id"] is None` |
| `test_empty_text_and_no_doc_id_returns_400` | `{}` (no text, no doc_id) | `status_code == 400`, `response.get_json()["error"]` present |

**Mocks:** `verify_firebase_token → (uid, None)`, `summarize_text → {"summary": "Key points: A, B, C."}`, `save_summary` (no-op).

---

#### `TestDocIdPath`
Verifies the document-backed summarization path where `doc_id` is provided.

| Test | Input fields | Return object asserted |
|------|-------------|----------------------|
| `test_fetches_text_from_firestore_and_summarises` | `{"doc_id": "doc-abc"}` | `status_code == 200`, `mock_get.assert_called_once_with("doc-abc", "user-1")` |
| `test_returns_doc_id_in_response` | `{"doc_id": "doc-abc"}` | `response.get_json()["doc_id"] == "doc-abc"` |
| `test_missing_document_returns_404` | `{"doc_id": "bad-id"}` | `status_code == 404`, `"not found" in response.get_json()["error"].lower()` |
| `test_doc_id_takes_precedence_over_text` | `{"doc_id": "doc-abc", "text": "Ignored."}` | `mock_get.assert_called_once()` (text ignored) |

**Mocks:** `get_document_text` returns `(text, file_name)` or raises `DocumentNotFoundError`.

---

#### `TestHistoryEndpoint`
Verifies the `GET /api/summarizer/history` endpoint structure and error handling.

**Fixture data (`FAKE_SUMMARIES`):**
```python
[
    {"id": "s1", "summary": "Summary one.", "generated_at": "2026-04-08T10:00:00",
     "doc_id": "doc-1", "file_name": "notes.jpg"},
    {"id": "s2", "summary": "Summary two.", "generated_at": "2026-04-07T09:00:00",
     "doc_id": None, "file_name": None},
]
```

| Test | Input / condition | Return object asserted |
|------|------------------|----------------------|
| `test_missing_token_returns_401` | Mocked bad token | `status_code == 401` |
| `test_returns_200_with_summaries_list` | Authenticated, 2 summaries mocked | `status_code == 200`, `"summaries" in response.get_json()` |
| `test_returns_correct_number_of_summaries` | Authenticated, 2 summaries mocked | `len(response.get_json()["summaries"]) == 2` |
| `test_returns_empty_list_when_no_history` | Authenticated, empty list mocked | `status_code == 200`, `response.get_json()["summaries"] == []` |
| `test_firestore_error_returns_500` | `get_summaries` raises `RuntimeError` | `status_code == 500`, `"error" in response.get_json()` |

**Mock:** `get_summaries` patched to return the fixture list or raise a `RuntimeError`.

---

## 2. test_upload.py

**Location:** `backend/features/upload/tests/test_upload.py`  
**Source under test:** `backend/features/upload/routes.py`

### Why this code is best suited for unit testing

`upload_file()` enforces four independent validation layers — auth, file presence, MIME type, and file size — before any storage occurs. Each layer produces a distinct status code and error message. This is a textbook unit test target: clear inputs, deterministic branching, precise return values. Using `DEV_MODE=true` removes all Firebase dependencies so tests run entirely in-process against an in-memory Flask test client.

### Function under test

| Function | Route | HTTP Method |
|----------|-------|-------------|
| `upload_file()` | `/api/upload` | POST |

### Helper

`make_file(filename, mimetype, size_bytes=1024)` — creates an `io.BytesIO` in-memory file for multipart form submission without touching the filesystem.

### Test cases

#### Valid uploads

| Test | Input fields | Return object asserted |
|------|-------------|----------------------|
| `test_valid_pdf_upload` | `filename="notes.pdf"`, `mimetype="application/pdf"`, `size=1024` | `status_code == 201`, `response.json["user_uid"] == "test-user-123"`, `response.json["filename"] == "notes.pdf"` |
| `test_valid_jpg_upload` | `filename="photo.jpg"`, `mimetype="image/jpeg"` | `status_code == 201` |
| `test_valid_png_upload` | `filename="diagram.png"`, `mimetype="image/png"` | `status_code == 201` |

#### Validation rejections

| Test | Input fields | Return object asserted |
|------|-------------|----------------------|
| `test_invalid_mime_type_rejected` | `mimetype="application/vnd.openxmlformats..."` (.docx) | `status_code == 415`, `"Unsupported file type" in response.json["error"]` |
| `test_oversized_file_rejected` | `size=21 * 1024 * 1024` (21 MB) | `status_code == 413`, `"size limit" in response.json["error"]` |
| `test_missing_file_rejected` | Empty `data={}` | `status_code == 400`, `"No file provided" in response.json["error"]` |

#### Auth

| Test | Condition | Return object asserted |
|------|-----------|----------------------|
| `test_uid_associated_with_upload` | `DEV_MODE=true`, `DEV_UID="test-user-123"` | `response.json["user_uid"] == "test-user-123"` |
| `test_auth_rejected_when_dev_mode_off` | `monkeypatch` sets `auth.DEV_MODE = False`, no token header | `status_code == 401` |

### Mock / isolation strategy

- `DEV_MODE=true` set as an env var before import — Firebase Storage and Firestore are never initialized.
- `DEV_UID=test-user-123` provides a deterministic UID without a real JWT.
- `monkeypatch.setattr(auth, "DEV_MODE", False)` is the only test that activates real auth validation, verifying the 401 path.
- No background embedding thread is exercised here — `DEV_MODE` short-circuits before the `_executor.submit()` call.

---

## 3. test_pipeline.py

**Location:** `backend/embeddings/tests/test_pipeline.py`  
**Source under test:** `backend/embeddings/pipeline.py`

### Why this code is best suited for unit testing

`process_document()` orchestrates five external dependencies across three stages (extraction → embedding → storage) with Firestore status writes before each stage. Any stage can fail independently and must leave the document in an `error` state without re-raising. This complex conditional flow — with branching on MIME type, empty output, and exceptions — is exactly what unit tests are designed to verify. All five dependencies are mockable at the module level, making the pipeline logic fully testable in isolation.

### Function under test

| Function | Signature |
|----------|-----------|
| `process_document()` | `(file_bytes: bytes, uid: str, file_name: str, doc_id: str, mimetype: str) -> None` |

### Fixture data

```python
FAKE_CHUNKS = [
    {"index": 0, "text": "chunk one", "type": "NarrativeText", "embedding": [0.1] * 1536},
    {"index": 1, "text": "chunk two", "type": "NarrativeText", "embedding": [0.2] * 1536},
]
FAKE_VECTOR_IDS = ["id-aaa", "id-bbb"]
FAKE_FILE_BYTES = b"%PDF-1.4 fake content"
```

### Mocked dependencies

| Mock target | Replaces |
|-------------|---------|
| `pipeline.chunk_pdf` | Unstructured API call — returns `FAKE_CHUNKS` or `[]` |
| `pipeline.embed_chunks` | OpenAI Embeddings API call — returns `FAKE_CHUNKS` |
| `pipeline.store_embeddings` | Qdrant write — returns `FAKE_VECTOR_IDS` |
| `pipeline.mark_document_ready` | Firestore status write |
| `pipeline.mark_document_error` | Firestore status write |
| `pipeline.tempfile.NamedTemporaryFile` | Disk I/O — returns a no-op context manager |
| `pipeline.os.unlink` | File deletion |

### Test cases

#### Happy path

| Test | Input fields | Return object / call asserted |
|------|-------------|------------------------------|
| `test_pipeline_calls_stages_in_order` | Default `FAKE_FILE_BYTES`, `doc_id="doc-1"` | `mock_chunk.assert_called_once()`, `mock_embed.assert_called_once_with(FAKE_CHUNKS)`, `mock_store.assert_called_once()`, `mock_ready.assert_called_once_with("doc-1", FAKE_VECTOR_IDS)`, `mock_error.assert_not_called()` |
| `test_pipeline_passes_metadata_to_store` | `uid="user-xyz"`, `file_name="slides.pdf"`, `doc_id="doc-99"` | `mock_store.call_args[1]["uid"] == "user-xyz"`, `mock_store.call_args[1]["file_name"] == "slides.pdf"`, `mock_store.call_args[1]["doc_id"] == "doc-99"` |

#### Error paths

| Test | Failure condition | Return object / call asserted |
|------|------------------|------------------------------|
| `test_pipeline_marks_error_when_no_chunks` | `chunk_pdf` returns `[]` | `mock_embed.assert_not_called()`, `mock_store.assert_not_called()`, `mock_ready.assert_not_called()`, `mock_error.assert_called_once()`, `"No text" in mock_error.call_args[1]["message"]` |
| `test_pipeline_marks_error_on_exception` | `chunk_pdf` raises `RuntimeError("chunker exploded")` | Function does not re-raise, `mock_ready.assert_not_called()`, `mock_error.assert_called_once()`, `"chunker exploded" in mock_error.call_args[1]["message"]` |
| `test_pipeline_skips_non_pdf` | `mimetype="image/png"` (non-PDF, non-image OCR path) | `mock_chunk.assert_not_called()`, `mock_ready.assert_not_called()`, `mock_error.assert_called_once()` |

### Key assertions on `call_args`

`mock_store.call_args` returns a `call` object. The test unpacks the kwargs with `mock_store.call_args[1]` to assert that `uid`, `file_name`, and `doc_id` are all propagated correctly from `process_document`'s parameters to `store_embeddings`. This verifies the metadata contract between the pipeline orchestrator and the Qdrant storage layer.

`mock_error.call_args[1]["message"]` asserts that the error message passed to Firestore contains the original exception string, ensuring meaningful error context is preserved for the frontend.

---

## Test execution command

All three test files can be run from the `backend/` directory:

```bash
# Run all three
pytest features/summarizer/tests/test_summarizer_routes.py \
       features/upload/tests/test_upload.py \
       embeddings/tests/test_pipeline.py -v

# With HTML report (for documentation)
pytest features/summarizer/tests/test_summarizer_routes.py \
       features/upload/tests/test_upload.py \
       embeddings/tests/test_pipeline.py -v --html=docs/unit_test_report.html --self-contained-html
```

> `pytest-html` must be installed: `pip install pytest-html`
