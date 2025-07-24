import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class ReviewSentiment(SQLModel, table=True):
    __tablename__ = "review_sentiments"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    review_id: uuid.UUID
    sentiment: str
    confidence: float
    rating_estimate: float
    category: str
    negative_score: float
    neutral_score: float
    positive_score: float
    done_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
