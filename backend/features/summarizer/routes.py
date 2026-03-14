from flask import Blueprint, jsonify, request
from .service import summarize_text

summarizer_bp = Blueprint("summarizer_bp", __name__)


@summarizer_bp.get("/health")
def summarizer_health():
    return jsonify({"summarizer": "ok"}), 200


@summarizer_bp.post("/generate")
def generate_summary():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()

    try:
        result = summarize_text(text)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal server error"}), 500