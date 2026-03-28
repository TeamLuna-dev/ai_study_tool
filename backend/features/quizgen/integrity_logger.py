"""
integrity_logger.py
This files logs integrity results to Firestore for future ML model training
"""

import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def _get_db():
    """Lazily imports Firestore client to avoid requiring Firebase in tests."""
    from security.firebase_admin_config import db
    return db


def log_integrity_result(
    notes: str,
    doc_id: str,
    questions: list,
    rule_result: dict,
    llm_result: dict,
) -> str | None:
    try:
        db = _get_db()

        total = len(questions)
        rule_pass = len(rule_result["passed"])
        llm_pass  = len(llm_result["passed"])

        rule_pct = round((rule_pass / total) * 100, 1) if total else 0
        llm_pct  = round((llm_pass  / total) * 100, 1) if total else 0

        # build per-question log, then merge rule and LLM results
        rule_failed_map = {f["question_index"]: f["reasons"] for f in rule_result["failed"]}
        llm_failed_map  = {f["question_index"]: f["reasons"] for f in llm_result["failed"]}

        question_logs = []
        for i, q in enumerate(questions):
            question_logs.append({
                "question":      q.get("question"),
                "choices":       q.get("choices"),
                "correct_index": q.get("correct_index"),
                "rule_passed":   i not in rule_failed_map,
                "llm_passed":    i not in llm_failed_map,
                "rule_reasons":  rule_failed_map.get(i, []),
                "llm_reasons":   llm_failed_map.get(i, []),
            })

        log_entry = {
            "doc_id":            doc_id or None,
            "notes_snippet":     notes[:300],  # stores first 300 chars to save space
            "generated_at":      datetime.now(timezone.utc).isoformat(),
            "total_questions":   total,
            "rule_pass_pct":     rule_pct,
            "llm_pass_pct":      llm_pct,
            "overall_passed":    not rule_result["blocked"] and not llm_result["blocked"],
            "questions":         question_logs,
        }

        _, doc_ref = db.collection("quiz_integrity_logs").add(log_entry)
        print(f"[INTEGRITY LOGGER] Logged integrity result → {doc_ref.id}")
        return doc_ref.id

    except Exception as e:
        print(f"[INTEGRITY LOGGER] Failed to log integrity result: {e}")
        return None  # fail silently, logging should never block quiz generation