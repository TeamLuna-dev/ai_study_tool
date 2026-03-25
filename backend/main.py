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
from fastapi.middleware.cors import CORSMiddleware
from routers import rooms

app = FastAPI(title="AiTutorProject API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms.router, prefix="/rooms", tags=["rooms"])


@app.get("/health")
async def health():
    return {"ok": True}
