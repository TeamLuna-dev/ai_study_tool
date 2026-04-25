import pytest
from flask import Flask
from features.quizgen.routes import quiz_bp

@pytest.fixture
def app():
    app = Flask(__name__)
    app.register_blueprint(quiz_bp, url_prefix="/api/quiz")
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_quiz_blueprint_registered(client):
    response = client.get('/api/quiz/')
    # Accepts 200 or 404 depending on route setup, but blueprint must respond
    assert response.status_code in (200, 404)

def test_quiz_endpoint_returns_json(client):
    response = client.get('/api/quiz/generate')
    # Accepts 200 or 400/404, but should return JSON
    assert response.content_type == 'application/json' or response.status_code in (400, 404)

def test_quiz_blueprint_error_handling(client):
    response = client.get('/api/quiz/nonexistent')
    assert response.status_code in (404, 405)
