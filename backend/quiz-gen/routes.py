# Defines the routes for the quiz-gen service.
from flask import Blueprint, jsonify

quiz_bp = Blueprint("quiz_bp", __name__)

@quiz_bp.get("/api/quiz/health")
def quiz_health():
    return jsonify({"quiz_gen": "ok"}), 200