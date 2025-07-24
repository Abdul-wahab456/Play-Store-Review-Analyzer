from fastapi import FastAPI
from sqlmodel import create_engine, SQLModel, Session
from app.tasks import analyze_reviews_bulk, celery_app
from celery.result import AsyncResult
from app.schema.schema import AppReviewList, AnalyzeRequest
from app.analysis.english_kefe import EnglishKEFE

from app.analysis.models.features_to_db import Feature
from dotenv import load_dotenv
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DB_URL = os.getenv("DB_URL")
app = FastAPI()
engine = create_engine(DB_URL)
SQLModel.metadata.create_all(engine, checkfirst=True)


@app.post("/sentimental_analysis/")
async def analyze_bulk(payload: AppReviewList):
    reviews_data = [review.model_dump() for review in payload.reviews]
    task = analyze_reviews_bulk.delay(reviews_data)
    return {"task_id": task.id, "status": "processing"}


@app.get("/status/{task_id}")
async def get_task_status(task_id: str):
    result = AsyncResult(task_id, app=celery_app)
    return {
        "task_id": task_id,
        "status": result.status,
        "result": result.result if result.ready() else None,
    }


@app.post("/extract/")
async def extract_features_api(data: AnalyzeRequest):
    kefe = EnglishKEFE()
    app_id = data.app_id
    features = kefe.analyze_app(
        data.app_description, [review.model_dump() for review in data.reviews]
    )
    print(features)
    parsed_features = features.get("features", [])

    with Session(engine) as s:
        for f in parsed_features:
            s.add(Feature(app_id=app_id, name=f))
        s.commit()
    return {"features": features}
