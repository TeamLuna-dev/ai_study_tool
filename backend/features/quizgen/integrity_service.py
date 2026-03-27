# integrity_service.py
# idea: a simple script to check the integrity of the quiz generation process, part of the QA process for the quiz gen service.


MIN_QUESTION_LENGTH = 10   # characters
MAX_QUESTION_LENGTH = 500  # characters
MIN_CHOICE_LENGTH   = 1    # characters


def check_question(question: dict, notes: str) -> list[str]:

    failures = []
    q_text  = question.get("question", "")
    choices = question.get("choices", [])
    correct = question.get("correct_index")

    # Question length
    if len(q_text.strip()) < MIN_QUESTION_LENGTH:
        failures.append(f"Question too short: '{q_text}'")

    if len(q_text.strip()) > MAX_QUESTION_LENGTH:
        failures.append(f"Question too long ({len(q_text)} chars).")

    # check duplicate choices
    stripped_choices = [c.strip().lower() for c in choices]
    if len(stripped_choices) != len(set(stripped_choices)):
        failures.append("Duplicate choices detected.")

    # choices are not empty
    for i, c in enumerate(choices):
        if len(c.strip()) < MIN_CHOICE_LENGTH:
            failures.append(f"Choice {i} is empty or too short.")

    # correct index is valid
    if not isinstance(correct, int) or not (0 <= correct <= len(choices) - 1):
        failures.append(f"correct_index {correct} is out of range.")

    # Question is grounded in source notes
    notes_lower = notes.lower()
    question_words = [
        w.strip(".,?!:;\"'").lower()
        for w in q_text.split()
        if len(w) > 4
    ]
    if question_words and not any(w in notes_lower for w in question_words):
        failures.append("Question does not appear to be grounded in source notes.")

    return failures

def run_integrity_checks(quiz: dict, notes: str) -> dict:
    
    questions = quiz.get("questions", [])
    passed = []
    failed = []

    for i, q in enumerate(questions):
        reasons = check_question(q, notes)
        if reasons:
            failed.append({
                "question_index": i,
                "question":       q.get("question"),
                "reasons":        reasons,
            })
        else:
            passed.append(q)

    blocked = len(failed) > 0

    if failed:
        print(f"[INTEGRITY] {len(failed)} question(s) failed integrity checks:")
        for f in failed:
            print(f"  Q{f['question_index']}: {f['reasons']}")

    return {
        "passed":  passed,
        "failed":  failed,
        "blocked": blocked,
    }