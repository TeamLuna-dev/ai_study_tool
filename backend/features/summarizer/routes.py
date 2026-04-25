from flask import Blueprint, jsonify, request
from features.upload.auth import verify_firebase_token
from .service import summarize_text
from .document_text import get_document_text
from .firestore import save_summary, get_summaries, DocumentNotFoundError

summarizer_bp = Blueprint("summarizer_bp", __name__)


@summarizer_bp.get("/health")
def summarizer_health():
    return jsonify({"summarizer": "ok"}), 200


@summarizer_bp.post("/generate")
def generate_summary():
    uid, auth_error = verify_firebase_token(request)
    if auth_error:
        return jsonify({"error": auth_error}), 401

    data   = request.get_json(silent=True) or {}
    doc_id = (data.get("doc_id") or "").strip() or None
    text   = (data.get("text")   or "").strip()

    # Resolve the text to summarise
    file_name = None
    if doc_id:
        try:
            text, file_name = get_document_text(doc_id, uid)
        except DocumentNotFoundError as e:
            return jsonify({"error": str(e)}), 404
    elif not text:
        return jsonify({"error": "Provide either 'text' or a 'doc_id'."}), 400

    try:
        result = summarize_text(text)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal server error"}), 500

    # Best-effort persistence — don't fail the request if saving fails
    try:
        save_summary(uid, doc_id, result["summary"], file_name)
    except Exception as e:
        print(f"[SUMMARIZER] Warning: could not save summary to Firestore: {e}")

    return jsonify({"summary": result["summary"], "doc_id": doc_id}), 200


@summarizer_bp.get("/history")
def get_summary_history():
    uid, auth_error = verify_firebase_token(request)
    if auth_error:
        return jsonify({"error": auth_error}), 401

    try:
        summaries = get_summaries(uid)
    except Exception as e:
        print(f"[SUMMARIZER] Error fetching history for {uid}: {e}")
        return jsonify({"error": "Failed to fetch summary history."}), 500

    return jsonify({"summaries": summaries}), 200
