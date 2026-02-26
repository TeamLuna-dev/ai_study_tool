# Defines the routes for the quiz-gen service.
from flask import Blueprint, jsonify, request
from validators import validate_quiz, validate_answers

quiz_bp = Blueprint("quiz_bp", __name__)

@quiz_bp.get("/api/quiz/health")
def quiz_health():
    return jsonify({"quiz_gen": "ok"}), 200

@quiz_bp.post("/api/quiz/score")
def score_quiz():
    data = request.get_json(silent=True) or {}
    quiz_obj = data.get("quiz")
    answers = data.get("answers")

    try:
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

        return jsonify({
            "score": score,
            "total": total,
            "percentage": percentage,
            "incorrect": incorrect
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal server error"}), 500