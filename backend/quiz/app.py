from flask import Flask, request, jsonify
from models import db, QuizAttempt
from services import calculate_percentage, analyze_performance

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///quiz.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

with app.app_context():
    db.create_all()


@app.route("/submit-quiz", methods=["POST"])
def submit_quiz():
    data = request.json

    percentage = calculate_percentage(
        data["score"],
        data["total_questions"]
    )

    attempt = QuizAttempt(
        user_id=data["user_id"],
        topic=data["topic"],
        score=data["score"],
        total_questions=data["total_questions"],
        percentage=percentage
    )

    db.session.add(attempt)
    db.session.commit()

    return jsonify({"message": "Quiz saved successfully"}), 201


@app.route("/weak-topics/<user_id>", methods=["GET"])
def weak_topics(user_id):
    attempts = QuizAttempt.query.filter_by(user_id=user_id).all()
    result = analyze_performance(attempts)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
