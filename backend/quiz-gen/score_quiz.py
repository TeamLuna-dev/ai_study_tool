import json
import argparse
import os
from typing import Optional


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

def normalize_answer(user_input: str) -> Optional[int]:
    s = user_input.strip().lower()
    if s in ("a", "b", "c", "d"):
        return ord(s) - ord("a")
    if s in ("1", "2", "3", "4"):
        return int(s) - 1
    return None

def run_quiz(questions: list[dict]) -> None:
    score = 0
    user_answers: list[int] = []

    print("\n--- QUIZ START ---")
    for i, q in enumerate(questions, start=1):
        print(f"\nQ{i}. {q['question']}")
        for idx, choice in enumerate(q["choices"]):
            letter = chr(ord("A") + idx)
            print(f"  {letter}) {choice}")

        while True:
            ans = input("Your answer (A-D or 1-4): ")
            idx = normalize_answer(ans)
            if idx is not None:
                user_answers.append(idx)
                break
            print("Invalid input. Please enter A, B, C, D or 1, 2, 3, 4.")

        if idx == q["correct_index"]:
            score += 1

    print("\nRESULTS")
    print(f"Score: {score}/{len(questions)}")

    for i, q in enumerate(questions, start=1):
        correct = q["correct_index"]
        user = user_answers[i - 1]
        if user != correct:
            print(f"\nQ{i} incorrect.")
            print(f"  Your answer: {chr(ord('A') + user)}")
            print(f"  Correct:     {chr(ord('A') + correct)}")
            print(f"  Correct choice: {q['choices'][correct]}")

def main():
    parser = argparse.ArgumentParser(description="Score a quiz from JSON.")
    parser.add_argument("--quiz", required=True, help="Path to quiz JSON file (e.g., out/quiz.json)")
    args = parser.parse_args()

    quiz_obj = load_quiz(args.quiz)
    questions = validate_quiz(quiz_obj)
    run_quiz(questions)


if __name__ == "__main__":
    main()