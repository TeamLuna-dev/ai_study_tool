# Defines the routes for the quiz-gen service.
import os
import sys

from flask import Blueprint, jsonify, request
import requests
from qdrant_client.models import Filter, FieldCondition, MatchValue, PayloadSchemaType

# Allow import from sibling embeddings folder
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "embeddings")))

from embeddings.qdrant_store import get_client, COLLECTION_NAME
from .service import generate_quiz_from_notes
from .validators import validate_quiz, validate_answers, validate_topic

quiz_bp = Blueprint("quiz_bp", __name__)

# Unified backend progress endpoint
ANALYTICS_URL = "http://127.0.0.1:5000/api/progress/submit-quiz"
DEV_USER_ID = "test-user-123"


def persist_quiz_attempt(topic, score, total_questions, user_id=DEV_USER_ID):
    payload = {
        "user_id": user_id,
        "topic": topic,
        "score": score,
        "total_questions": total_questions,
    }

    response = requests.post(ANALYTICS_URL, json=payload, timeout=5)
    response.raise_for_status()
    return response.json()


@quiz_bp.get("/health")
def quiz_health():
    return jsonify({"quiz_gen": "ok"}), 200


@quiz_bp.post("/generate")
def generate_quiz():
    data = request.get_json(silent=True) or {}
    notes = (data.get("notes") or "").strip()
    doc_id = (data.get("doc_id") or "").strip()

    if not notes and not doc_id:
        return jsonify({"error": "Provide either 'notes' or 'doc_id'."}), 400

    try:
        # If doc_id is provided, fetch chunks from Qdrant
        if doc_id:
            client = get_client()

            # Safe to try; if already exists, the exception will be handled below
            client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="doc_id",
                field_schema=PayloadSchemaType.KEYWORD,
            )

            results = client.scroll(
                collection_name=COLLECTION_NAME,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="doc_id",
                            match=MatchValue(value=doc_id),
                        )
                    ]
                ),
                limit=50,
                with_payload=True,
                with_vectors=False,
            )

            chunks = results[0]  # scroll returns (points, next_page_offset)

            if not chunks:
                return jsonify({"error": "No chunks found for this document."}), 404

            # Sort by chunk_index and combine text
            chunks.sort(key=lambda p: p.payload.get("chunk_index", 0))
            notes = "\n\n".join(
                p.payload["text"] for p in chunks if p.payload.get("text")
            )

            if not notes.strip():
                return jsonify({"error": "Document chunks were found, but no text was available."}), 400

        quiz_obj = generate_quiz_from_notes(notes)
        validate_quiz(quiz_obj)

        return jsonify({"quiz": quiz_obj}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"[QUIZ-GEN] Error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@quiz_bp.post("/score")
def score_quiz():
    data = request.get_json(silent=True) or {}
    quiz_obj = data.get("quiz")
    answers = data.get("answers")
    user_id = data.get("user_id", DEV_USER_ID)

    try:
        topic = validate_topic(data.get("topic"))
        questions = validate_quiz(quiz_obj)
        answers = validate_answers(answers, total_questions=len(questions))

        score = 0
        incorrect = []

        for i, q in enumerate(questions):
            correct = q["correct_index"]
            user = answers[i]

            if user == correct:
                score += 1
            else:
                incorrect.append({
                    "question_index": i,
                    "question": q["question"],
                    "your_index": user,
                    "correct_index": correct,
                    "correct_choice": q["choices"][correct],
                })

        total = len(questions)
        percentage = round((score / total) * 100, 2)

        analytics_saved = False

        try:
            persist_quiz_attempt(
                topic=topic,
                score=score,
                total_questions=total,
                user_id=user_id,
            )
            analytics_saved = True
        except Exception as exc:
            print(f"[QUIZ-GEN] Failed to save analytics: {exc}")
            analytics_saved = False

        return jsonify({
            "score": score,
            "total": total,
            "percentage": percentage,
            "incorrect": incorrect,
            "topic": topic,
            "analytics_saved": analytics_saved
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"[QUIZ-GEN] Error: {e}")
        return jsonify({"error": "Internal server error"}), 500