# Unit Test Execution & Results

**Project:** AI Study Tool — Backend  
**Test Framework:** pytest 9.0.3  
**Python:** 3.12.13  
**Platform:** macOS (arm64)  
**Run date:** 2026-04-28  
**HTML Report:** `backend/docs/unit_test_report.html` (self-contained, committed to repo)

---

## Execution command

Run from `backend/` with the project virtualenv active:

```bash
source venv/bin/activate
python -m pytest features/summarizer/tests/test_summarizer_routes.py \
                 features/upload/tests/test_upload.py \
                 embeddings/tests/test_pipeline.py \
                 -v --html=docs/unit_test_report.html --self-contained-html
```

---

## Summary

| Metric | Value |
|--------|-------|
| Total tests | 27 |
| Passed | **27** |
| Failed | 0 |
| Errors | 0 |
| Duration | 2.36s |

---

## Results by file

### test_summarizer_routes.py — 14/14 passed

Tests `generate_summary()` (POST `/api/summarizer/generate`) and `get_summary_history()` (GET `/api/summarizer/history`) in `features/summarizer/routes.py`.

| Test | Class | Status | Assertion |
|------|-------|--------|-----------|
| `test_missing_token_returns_401` | `TestAuth` | PASSED | `status_code == 401` |
| `test_invalid_token_returns_401` | `TestAuth` | PASSED | `status_code == 401`, `response["error"]` present |
| `test_returns_200_with_summary` | `TestRawTextPath` | PASSED | `status_code == 200`, `response["summary"] == "Key points: A, B, C."` |
| `test_doc_id_is_null_for_raw_text` | `TestRawTextPath` | PASSED | `response["doc_id"] is None` |
| `test_empty_text_and_no_doc_id_returns_400` | `TestRawTextPath` | PASSED | `status_code == 400`, `response["error"]` present |
| `test_fetches_text_from_firestore_and_summarises` | `TestDocIdPath` | PASSED | `status_code == 200`, `mock_get.assert_called_once_with("doc-abc", "user-1")` |
| `test_returns_doc_id_in_response` | `TestDocIdPath` | PASSED | `response["doc_id"] == "doc-abc"` |
| `test_missing_document_returns_404` | `TestDocIdPath` | PASSED | `status_code == 404`, `"not found" in response["error"]` |
| `test_doc_id_takes_precedence_over_text` | `TestDocIdPath` | PASSED | `mock_get.assert_called_once()` |
| `test_missing_token_returns_401` | `TestHistoryEndpoint` | PASSED | `status_code == 401` |
| `test_returns_200_with_summaries_list` | `TestHistoryEndpoint` | PASSED | `status_code == 200`, `"summaries" in response` |
| `test_returns_correct_number_of_summaries` | `TestHistoryEndpoint` | PASSED | `len(response["summaries"]) == 2` |
| `test_returns_empty_list_when_no_history` | `TestHistoryEndpoint` | PASSED | `status_code == 200`, `response["summaries"] == []` |
| `test_firestore_error_returns_500` | `TestHistoryEndpoint` | PASSED | `status_code == 500`, `response["error"]` present |

---

### test_upload.py — 8/8 passed

Tests `upload_file()` (POST `/api/upload`) in `features/upload/routes.py`.

| Test | Status | Assertion |
|------|--------|-----------|
| `test_valid_pdf_upload` | PASSED | `status_code == 201`, `response["user_uid"] == "test-user-123"`, `response["filename"] == "notes.pdf"` |
| `test_valid_jpg_upload` | PASSED | `status_code == 201` |
| `test_valid_png_upload` | PASSED | `status_code == 201` |
| `test_invalid_mime_type_rejected` | PASSED | `status_code == 415`, `"Unsupported file type" in response["error"]` |
| `test_oversized_file_rejected` | PASSED | `status_code == 413`, `"size limit" in response["error"]` |
| `test_missing_file_rejected` | PASSED | `status_code == 400`, `"No file provided" in response["error"]` |
| `test_uid_associated_with_upload` | PASSED | `response["user_uid"] == "test-user-123"` |
| `test_auth_rejected_when_dev_mode_off` | PASSED | `status_code == 401` |

---

### test_pipeline.py — 5/5 passed

Tests `process_document()` in `embeddings/pipeline.py`.

| Test | Status | Assertion |
|------|--------|-----------|
| `test_pipeline_calls_stages_in_order` | PASSED | `chunk`, `embed`, `store`, `mark_ready` each called once; `mark_error` not called |
| `test_pipeline_passes_metadata_to_store` | PASSED | `call_args[1]["uid"] == "user-xyz"`, `call_args[1]["file_name"] == "slides.pdf"`, `call_args[1]["doc_id"] == "doc-99"` |
| `test_pipeline_marks_error_when_no_chunks` | PASSED | `embed/store/ready` not called; `mark_error` called once; `"No text" in call_args[1]["message"]` |
| `test_pipeline_marks_error_on_exception` | PASSED | Function does not re-raise; `mark_error` called once; `"chunker exploded" in call_args[1]["message"]` |
| `test_pipeline_skips_non_pdf` | PASSED | `chunk_pdf` not called; `mark_error` called once |

---

## Full terminal output

```
============================= test session starts ==============================
platform darwin -- Python 3.12.13, pytest-9.0.3, pluggy-1.6.0
rootdir: backend/
plugins: metadata-3.1.1, html-4.2.0, anyio-4.13.0
collected 27 items

features/summarizer/tests/test_summarizer_routes.py::TestAuth::test_missing_token_returns_401 PASSED [  3%]
features/summarizer/tests/test_summarizer_routes.py::TestAuth::test_invalid_token_returns_401 PASSED [  7%]
features/summarizer/tests/test_summarizer_routes.py::TestRawTextPath::test_returns_200_with_summary PASSED [ 11%]
features/summarizer/tests/test_summarizer_routes.py::TestRawTextPath::test_doc_id_is_null_for_raw_text PASSED [ 14%]
features/summarizer/tests/test_summarizer_routes.py::TestRawTextPath::test_empty_text_and_no_doc_id_returns_400 PASSED [ 18%]
features/summarizer/tests/test_summarizer_routes.py::TestDocIdPath::test_fetches_text_from_firestore_and_summarises PASSED [ 22%]
features/summarizer/tests/test_summarizer_routes.py::TestDocIdPath::test_returns_doc_id_in_response PASSED [ 25%]
features/summarizer/tests/test_summarizer_routes.py::TestDocIdPath::test_missing_document_returns_404 PASSED [ 29%]
features/summarizer/tests/test_summarizer_routes.py::TestDocIdPath::test_doc_id_takes_precedence_over_text PASSED [ 33%]
features/summarizer/tests/test_summarizer_routes.py::TestHistoryEndpoint::test_missing_token_returns_401 PASSED [ 37%]
features/summarizer/tests/test_summarizer_routes.py::TestHistoryEndpoint::test_returns_200_with_summaries_list PASSED [ 40%]
features/summarizer/tests/test_summarizer_routes.py::TestHistoryEndpoint::test_returns_correct_number_of_summaries PASSED [ 44%]
features/summarizer/tests/test_summarizer_routes.py::TestHistoryEndpoint::test_returns_empty_list_when_no_history PASSED [ 48%]
features/summarizer/tests/test_summarizer_routes.py::TestHistoryEndpoint::test_firestore_error_returns_500 PASSED [ 51%]
features/upload/tests/test_upload.py::test_valid_pdf_upload PASSED       [ 55%]
features/upload/tests/test_upload.py::test_valid_jpg_upload PASSED       [ 59%]
features/upload/tests/test_upload.py::test_valid_png_upload PASSED       [ 62%]
features/upload/tests/test_upload.py::test_invalid_mime_type_rejected PASSED [ 66%]
features/upload/tests/test_upload.py::test_oversized_file_rejected PASSED [ 70%]
features/upload/tests/test_upload.py::test_missing_file_rejected PASSED  [ 74%]
features/upload/tests/test_upload.py::test_uid_associated_with_upload PASSED [ 77%]
features/upload/tests/test_upload.py::test_auth_rejected_when_dev_mode_off PASSED [ 81%]
embeddings/tests/test_pipeline.py::test_pipeline_calls_stages_in_order PASSED [ 85%]
embeddings/tests/test_pipeline.py::test_pipeline_passes_metadata_to_store PASSED [ 88%]
embeddings/tests/test_pipeline.py::test_pipeline_marks_error_when_no_chunks PASSED [ 92%]
embeddings/tests/test_pipeline.py::test_pipeline_marks_error_on_exception PASSED [ 96%]
embeddings/tests/test_pipeline.py::test_pipeline_skips_non_pdf PASSED   [100%]

- Generated html report: backend/docs/unit_test_report.html -
============================== 27 passed in 2.36s ==============================
```

---

## Notes on fixes applied before execution

Two import issues existed in the test files that prevented collection. Both were minimal fixes with no effect on test logic:

**`test_summarizer_routes.py`**  
`DEV_MODE` was set to `"false"` at module level. This caused `auth.py` to import `firebase_admin_config.py`, which raises a `RuntimeError` if `FIREBASE_STORAGE_BUCKET` is not set. Since every test in this file patches `verify_firebase_token` directly at the route level, `DEV_MODE` has no effect on test behavior. Changed to `"true"` so Firebase is never initialized during test collection.

**`test_upload.py`**  
The test imported `create_app` from `upload/main.py`, which contained a broken relative import (`from .routes import upload_bp`) left over from an earlier refactor that merged the upload feature into the unified backend. Updated to import from `backend/app.py` — the current app factory. The `auth` monkeypatch target was also updated from `import auth` to `import features.upload.auth as auth` to match the new sys.path root.
