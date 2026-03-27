# Test quiz gen service healtjh endpoint (initial phase)
from flask import Flask, jsonify
from flask_cors import CORS
from routes import quiz_bp
import os
from dotenv import load_dotenv

# Load .env from project root (three levels up from backend/quiz-gen/)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

app = Flask(__name__)
CORS(app) 

app.register_blueprint(quiz_bp)

@app.get("/api/health")
def health():
    return jsonify({"ok": True}), 200

if __name__ == "__main__":
    print("Starting quiz-gen on http://127.0.0.1:5001") # debug purposes
    app.run(host="127.0.0.1", port=5001, debug=True)