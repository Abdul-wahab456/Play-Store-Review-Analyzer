from pydantic import BaseModel, Field
from uuid import UUID
from typing import List


class AppReviewSchema(BaseModel):
    review_id: UUID
    review_text: str


class AppReviewList(BaseModel):
    reviews: List[AppReviewSchema]


class Review(BaseModel):
    text: str = Field(..., example="Great app, very easy to use.")
    rating: float = Field(..., ge=0, le=5, example=4.5)


class AnalyzeRequest(BaseModel):
    app_id: str = Field(..., example="This is for App ID")
    app_description: str = Field(
        ..., example="This app allows task management and team collaboration."
    )
    reviews: List[Review]
    flag: bool
