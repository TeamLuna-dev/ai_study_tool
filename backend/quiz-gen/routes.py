# Defines the routes for the quiz-gen service.
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "embeddings")))
from qdrant_store import get_client, COLLECTION_NAME
from qdrant_client.models import Filter, FieldCondition, MatchValue, PayloadSchemaType
from service import generate_quiz_from_notes
from flask import Blueprint, jsonify, request
from validators import validate_quiz, validate_answers, validate_topic
import requests

quiz_bp = Blueprint("quiz_bp", __name__)

# For development will use a hardcoded URL and user ID. In production this should be configured via environment variables or a config file.
ANALYTICS_URL = "http://127.0.0.1:5000/submit-quiz"
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


@quiz_bp.get("/api/quiz/health")
def quiz_health():
    return jsonify({"quiz_gen": "ok"}), 200

@quiz_bp.post("/api/quiz/generate")
def generate_quiz():
    data = request.get_json(silent=True) or {}
    notes = (data.get("notes") or "").strip()
    doc_id = (data.get("doc_id") or "").strip() # implemented doc_id support, FEAT

    if not notes and not doc_id:
        return jsonify({"error": "Provide either 'notes' or 'doc_id'."}), 400
    
    try:
         # if doc_id provided, fetch chunks from Qdrant
        if doc_id:
            client = get_client()
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

            # sort by chunk_index and build notes string
            chunks.sort(key=lambda p: p.payload.get("chunk_index", 0))
            notes = "\n\n".join(p.payload["text"] for p in chunks)

        quiz_obj = generate_quiz_from_notes(notes)
        validate_quiz(quiz_obj)
        return jsonify({"quiz": quiz_obj}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"[QUIZ-GEN] Error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@quiz_bp.post("/api/quiz/score")
def score_quiz():
    data = request.get_json(silent=True) or {}
    quiz_obj = data.get("quiz")
    answers = data.get("answers")
    user_id = data.get("user_id", DEV_USER_ID) # in production, user_id should be required and validated

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
            persist_quiz_attempt(topic=topic, score=score, total_questions=total, user_id=user_id)
            analytics_saved = True
        except Exception:
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
    except Exception:
        return jsonify({"error": "Internal server error"}), 500