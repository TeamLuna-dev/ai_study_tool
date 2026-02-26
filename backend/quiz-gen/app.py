# Test quiz gen service healtjh endpoint (initial phase)
from flask import Flask, jsonify
from flask_cors import CORS
from routes import quiz_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

app.register_blueprint(quiz_bp)

@app.get("/api/health")
def health():
    return jsonify({"ok": True}), 200

if __name__ == "__main__":
    print("Starting quiz-gen on http://127.0.0.1:5001") # debug purposes
    app.run(host="127.0.0.1", port=5001, debug=True)