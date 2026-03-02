# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from services import summarize_text


# Load environment variables from .env
load_dotenv()


app = Flask(__name__)
CORS(app)  # Enable Cross-Origin requests (for frontend)


# Home route for testing in the browser
@app.route("/")
def home():
    return "AI Summarizer is running!"


# POST endpoint for summarizing text
@app.route("/api/summarize", methods=["POST"])
def summarize():
    try:
        data = request.get_json()
        text = data.get("text", "")


        if not text:
            return jsonify({"error": "No text provided"}), 400


        # Call the OpenAI summarizer
        summary = summarize_text(text)


        return jsonify({"summary": summary})


    except Exception as e:
        return jsonify({"error": str(e)}), 500




if __name__ == "__main__":
    # Run Flask on port 5001
    app.run(debug=True, port=5001)
