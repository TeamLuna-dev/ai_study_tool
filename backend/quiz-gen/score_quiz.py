import json
import argparse
import os


def load_quiz(path: str) -> dict:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Quiz JSON file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
    
def validate_quiz(quiz_obj: dict) -> list[dict]:
    if not isinstance(quiz_obj, dict):
        raise ValueError("Quiz JSON must be an object at the top level.")

    questions = quiz_obj.get("questions")
    if not isinstance(questions, list) or len(questions) == 0:
        raise ValueError("Quiz JSON must contain a non-empty 'questions' array.")

    for i, q in enumerate(questions, start=1):
        if not isinstance(q, dict):
            raise ValueError(f"Question {i} must be an object.")
        if "question" not in q or not isinstance(q["question"], str) or not q["question"].strip():
            raise ValueError(f"Question {i} missing valid 'question' string.")
        if "choices" not in q or not isinstance(q["choices"], list) or len(q["choices"]) != 4:
            raise ValueError(f"Question {i} must have exactly 4 choices.")
        if any(not isinstance(c, str) for c in q["choices"]):
            raise ValueError(f"Question {i} choices must all be strings.")
        if "correct_index" not in q or not isinstance(q["correct_index"], int) or not (0 <= q["correct_index"] <= 3):
            raise ValueError(f"Question {i} must have a correct_index int in [0..3].")

    return questions


def main():
    parser = argparse.ArgumentParser(description="Score a quiz from JSON.")
    parser.add_argument("--quiz", required=True, help="Path to quiz JSON file (e.g., out/quiz.json)")
    args = parser.parse_args()

    quiz_obj = load_quiz(args.quiz)
    questions = validate_quiz(quiz_obj)
    print(f"Quiz valid. Questions: {len(questions)}")


if __name__ == "__main__":
    main()