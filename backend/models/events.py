"""
events.py
Pydantic contracts for analytics events (DE-1). Validated at the API
boundary so a malformed attempt is rejected before it ever reaches
Firestore, instead of persisting inconsistent data.
"""

from typing import Optional
from pydantic import BaseModel, Field, computed_field


# ── Quiz events ──────────────────────────────────────────────────────────────

class QuizAttemptEvent(BaseModel):
    """One scored quiz attempt. schema_version tracks contract evolution
    for the warehouse layer (DE-5)."""
    schema_version: int = 1
    user_id: str
    topic: str
    score: int = Field(ge=0)
    total_questions: int = Field(gt=0)
    questions: Optional[list] = None
    answers: Optional[list] = None
    incorrect: Optional[list] = None

    # Derived, not accepted as input — can never disagree with
    # calculate_percentage(), which stays the single writer to Firestore.
    @computed_field
    @property
    def percentage(self) -> float:
        return round((self.score / self.total_questions) * 100, 2)
