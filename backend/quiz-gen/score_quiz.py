import json
import argparse
import os


def load_quiz(path: str) -> dict:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Quiz JSON file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(description="Score a quiz from JSON.")
    parser.add_argument("--quiz", required=True, help="Path to quiz JSON file (e.g., out/quiz.json)")
    args = parser.parse_args()

    quiz_obj = load_quiz(args.quiz)
    print("Loaded quiz JSON successfully.")
    print(f"Top-level keys: {list(quiz_obj.keys())}")


if __name__ == "__main__":
    main()