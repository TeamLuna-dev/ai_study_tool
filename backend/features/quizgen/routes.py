# Defines the routes for the quiz-gen service.
from .service import generate_quiz_from_notes
from flask import Blueprint, jsonify, request
from .validators import validate_quiz, validate_answers, validate_topic
from features.progress.services import save_quiz_attempt

quiz_bp = Blueprint("quiz_bp", __name__)

@quiz_bp.get("/health")
def quiz_health():
    return jsonify({"quiz_gen": "ok"}), 200

@quiz_bp.post("/generate")
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

@quiz_bp.post("/score")
def score_quiz():
    data = request.get_json(silent=True) or {}
    quiz_obj = data.get("quiz")
    answers = data.get("answers")
    user_id = data.get("user_id")

    try:
        topic = validate_topic(data.get("topic"))
        questions = validate_quiz(quiz_obj)
        answers = validate_answers(answers, total_questions=len(questions))

        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

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
        percentage = round((score / total) * 100, 2) if total > 0 else 0

        analytics_saved = False
        saved_attempt = None

        try:
            saved_attempt = save_quiz_attempt(
                user_id=user_id,
                topic=topic,
                score=score,
                total_questions=total
            )
            analytics_saved = True
        except Exception as e:
            print("Failed to save quiz attempt:", e)
            analytics_saved = False

        return jsonify({
            "score": score,
            "total": total,
            "percentage": percentage,
            "incorrect": incorrect,
            "topic": topic,
            "analytics_saved": analytics_saved,
            "saved_attempt": saved_attempt
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal server error"}), 500