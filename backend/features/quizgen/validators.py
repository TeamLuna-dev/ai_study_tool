# adapts validation related code from score_quiz.py

# validators.py

def validate_quiz(quiz_obj: dict) -> list[dict]:
    if not isinstance(quiz_obj, dict):
        raise ValueError("Quiz must be an object.")

    questions = quiz_obj.get("questions")
    if not isinstance(questions, list) or len(questions) == 0:
        raise ValueError("Quiz must contain a non-empty 'questions' array.")

    for i, q in enumerate(questions):
        if not isinstance(q, dict):
            raise ValueError(f"Question {i} must be an object.")

        if not isinstance(q.get("question"), str) or not q["question"].strip():
            raise ValueError(f"Question {i} must have a valid 'question' string.")

        choices = q.get("choices")
        if not isinstance(choices, list) or len(choices) != 4:
            raise ValueError(f"Question {i} must have exactly 4 choices.")

        if any(not isinstance(c, str) for c in choices):
            raise ValueError(f"Question {i} choices must all be strings.")

        correct_index = q.get("correct_index")
        if not isinstance(correct_index, int) or not (0 <= correct_index <= 3):
            raise ValueError(f"Question {i} must have correct_index between 0 and 3.")

    return questions

def validate_topic(topic) -> str:
    if not isinstance(topic, str) or not topic.strip():
        raise ValueError("Topic must be a non-empty string.")

    return topic.strip() # validate topic is non-empty string and strip whitespace



def validate_answers(answers, total_questions: int) -> list[int]:
    if not isinstance(answers, list):
        raise ValueError("Answers must be a list.")

    if len(answers) != total_questions:
        raise ValueError("Answers length must match number of questions.")

    for i, a in enumerate(answers):
        if not isinstance(a, int) or not (0 <= a <= 3):
            raise ValueError(f"Answer {i} must be an integer between 0 and 3.")

    return answers