"""
main.py
FastAPI application entry point for the AiTutorProject backend.

Run from the backend/ directory:
    uvicorn main:app --reload
"""

import sys
import os

# Add backend/ to sys.path so all sub-packages resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from routers import rooms

app = FastAPI(title="AiTutorProject API")

app.include_router(rooms.router, prefix="/rooms", tags=["rooms"])


@app.get("/health")
async def health():
    return {"ok": True}
