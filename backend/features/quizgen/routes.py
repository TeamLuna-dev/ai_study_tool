# Defines the routes for the quiz-gen service.
import json
import os
import sys

from flask import Blueprint, jsonify, request
from dotenv import load_dotenv
from anthropic import AsyncAnthropic
from pydantic import ValidationError
from .integrity_logger import log_integrity_result
from .integrity_service import run_integrity_checks, run_llm_verification
from .validators import validate_quiz, validate_answers, validate_topic
from qdrant_client.models import Filter, FieldCondition, MatchValue, PayloadSchemaType
from embeddings.qdrant_store import get_client, COLLECTION_NAME
from .service import generate_adaptive_quiz
from features.upload.auth import verify_firebase_token
from features.progress.services import save_quiz_attempt
from models.events import QuizAttemptEvent

# Allow import from sibling embeddings folder
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "embeddings")))

quiz_bp = Blueprint("quiz_bp", __name__)


@quiz_bp.get("/health")
def quiz_health():
    return jsonify({"quiz_gen": "ok"}), 200


@quiz_bp.post("/generate")
async def generate_quiz():
    data = request.get_json(silent=True) or {}
    # read notes and doc_id from request, stripping whitespace and defaulting to empty string if not provided
    notes = (data.get("notes") or "").strip()
    doc_id = (data.get("doc_id") or "").strip()
    # read question_count from request, default to 5 if not provided
    # accepted values: 3, 5, 10, 15 —> validated in generate_adaptive_quiz
    question_count = int(data.get("question_count", 5))

    if not notes and not doc_id:
        return jsonify({"error": "Provide either 'notes' or 'doc_id'."}), 400

    try:
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

            chunks = results[0]

            if not chunks:
                return jsonify({"error": "No chunks found for this document."}), 404

            chunks.sort(key=lambda p: p.payload.get("chunk_index", 0))
            notes = "\n\n".join(
                p.payload["text"] for p in chunks if p.payload.get("text")
            )

            if not notes.strip():
                return jsonify({"error": "Document chunks were found, but no text was available."}), 400

        quiz_obj = await generate_adaptive_quiz(notes, question_count=question_count)
        validate_quiz(quiz_obj)

        rule_result = run_integrity_checks(quiz_obj, notes)
        total_questions = len(quiz_obj.get("questions", []))
        rule_pass_count = len(rule_result["passed"])
        rule_fail_count = len(rule_result["failed"])
        rule_pct = round((rule_pass_count / total_questions) * 100, 1) if total_questions else 0

        print(f"[INTEGRITY] Rule checks: {rule_pass_count}/{total_questions} passed ({rule_pct}%)")

        if rule_result["blocked"]:
            print(f"[INTEGRITY] Quiz blocked by rule checks — {rule_fail_count} question(s) failed.")
            return jsonify({
                "error": "Generated quiz failed integrity checks.",
                "failed": rule_result["failed"],
            }), 422

        print(f"[INTEGRITY] Rule checks passed — proceeding to LLM verification.")

        load_dotenv()
        anthropic_client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_LUNA_KEY"))
        llm_result = await run_llm_verification(quiz_obj, notes, anthropic_client)
        llm_pass_count = len(llm_result["passed"])
        llm_fail_count = len(llm_result["failed"])
        llm_pct = round((llm_pass_count / total_questions) * 100, 1) if total_questions else 0

        print(f"[INTEGRITY] LLM verification: {llm_pass_count}/{total_questions} passed ({llm_pct}%)")

        # For demo day, LLM verification is NON-BLOCKING this is not supposed to be merged to main
        # if llm_result["blocked"]:
        #     print(f"[INTEGRITY] Quiz blocked by LLM verification — {llm_fail_count} question(s) failed.")
        #     return jsonify({
        #         "error": "Generated quiz failed LLM integrity verification.",
        #         "failed": llm_result["failed"],
        #     }), 422

        print(f"[INTEGRITY] All checks passed — quiz approved ({llm_pct}% integrity score).")

        log_integrity_result(
            notes=notes,
            doc_id=doc_id,
            questions=quiz_obj.get("questions", []),
            rule_result=rule_result,
            llm_result=llm_result,
        )

        return jsonify({"quiz": quiz_obj}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"[QUIZ-GEN] Error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@quiz_bp.post("/score")
def score_quiz():
    # Identity comes from the verified token, never from the request body
    uid, auth_error = verify_firebase_token(request)
    if auth_error:
        return jsonify({"error": auth_error}), 401

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

        # Contract validated before any write — bad data never reaches Firestore
        event = QuizAttemptEvent(
            user_id=uid,
            topic=topic,
            score=score,
            total_questions=total,
            questions=[{"question": q["question"], "choices": q["choices"], "correct_index": q["correct_index"]} for q in questions],
            answers=answers,
            incorrect=incorrect,
        )
        percentage = event.percentage

        analytics_saved = False

        try:
            # In-process call — same Flask process, no self-HTTP hop
            save_quiz_attempt(
                user_id=event.user_id,
                topic=event.topic,
                score=event.score,
                total_questions=event.total_questions,
                questions=event.questions,
                answers=event.answers,
                incorrect=event.incorrect,
                schema_version=event.schema_version,
            )
            analytics_saved = True
        except Exception as exc:
            # Loud, structured failure — Cloud Logging parses this as ERROR
            print(json.dumps({
                "severity": "ERROR",
                "event_type": "quiz_attempt_persist_failed",
                "user_id": uid,
                "topic": topic,
                "error": str(exc),
            }))
            analytics_saved = False

        return jsonify({
            "score": score,
            "total": total,
            "percentage": percentage,
            "incorrect": incorrect,
            "topic": topic,
            "analytics_saved": analytics_saved
        }), 200

    except ValidationError as e:
        return jsonify({"error": str(e)}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"[QUIZ-GEN] Error: {e}")
        return jsonify({"error": "Internal server error"}), 500