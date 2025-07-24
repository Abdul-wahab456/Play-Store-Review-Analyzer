from fastapi import FastAPI
from pydantic import BaseModel
from english_kefe import EnglishKEFE
from sqlmodel import Session, create_engine
from features_to_db import Feature
from rich import print

DATABASE_URL = "postgresql://postgres:penLaMOliGHthel0*@database-2.c5guus84snfp.ap-south-1.rds.amazonaws.com:5432/play_store_apps"

#DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/play_store_apps"


engine = create_engine(DATABASE_URL, echo=True)

app = FastAPI()

from pydantic import BaseModel, Field
from typing import List


class Review(BaseModel):
    text: str = Field(..., example="Great app, very easy to use.")
    rating: float = Field(..., ge=0, le=5, example=4.5)


class AnalyzeRequest(BaseModel):
    app_id: str = Field(..., example="This is for App ID")
    app_description: str = Field(
        ..., example="This app allows task management and team collaboration."
    )
    reviews: List[Review]


@app.post("/extract/")
async def extract_features_api(data: AnalyzeRequest):
    kefe = EnglishKEFE()
    app_id = data.app_id
    features = kefe.analyze_app(
        data.app_description, [review.model_dump() for review in data.reviews]
    )
    print(features)
    parsed_features = features.get("features", [])  # Added default empty list
    
    with Session(engine) as s:
        for f in parsed_features:
            s.add(Feature(app_id=app_id, name=f))  # Using Feature instead of FeatureBase
        s.commit()
    return {"features": features}
