# Defines the routes for the quiz-gen service.
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

    try:
        quiz_obj = generate_quiz_from_notes(notes)
         
        validate_quiz(quiz_obj) # ensure the generated quiz is valid before returning

        return jsonify({"quiz": quiz_obj}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal server error"}), 500

@quiz_bp.post("/api/quiz/score")
def score_quiz():
    data = request.get_json(silent=True) or {}
    quiz_obj = data.get("quiz")
    answers = data.get("answers")

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
            persist_quiz_attempt(topic=topic, score=score, total_questions=total)
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