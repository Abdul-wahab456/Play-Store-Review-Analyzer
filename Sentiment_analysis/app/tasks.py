from celery import Celery
from app.analysis.sentimental_analysis import analyze_sentiment
from app.analysis.models.sentimental_models import ReviewSentiment
from sqlmodel import create_engine, Session, SQLModel
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL")
DB_URL = os.getenv("DB_URL")
engine = create_engine(DB_URL)

SQLModel.metadata.create_all(engine, checkfirst=True)

celery_app = Celery(
    "worker",
    broker=CELERY_BROKER_URL,
    backend=CELERY_BROKER_URL,
)
# celery_app.conf.update(result_expires=300)


@celery_app.task(name="tasks.analyze_reviews_bulk")
def analyze_reviews_bulk(reviews: list):
    sentiment_records = []
    summary_results = []

    with Session(engine) as session:
        for review in reviews:
            sentiment = analyze_sentiment(review.get("review_text"))

            sentiment_record = ReviewSentiment(
                review_id=review.get("review_id"),  # Use .get() for safety
                sentiment=sentiment.get("sentiment"),
                confidence=sentiment.get("confidence"),
                rating_estimate=sentiment.get("rating_estimate"),
                category=sentiment.get("category"),
                negative_score=sentiment.get("raw_scores", {}).get(
                    "negative"
                ),  # Safe access
                positive_score=sentiment.get("raw_scores", {}).get(
                    "positive"
                ),  # Safe access
                neutral_score=sentiment.get("raw_scores", {}).get(
                    "neutral"
                ),  # Safe access
                # Remove done_at to use model default, or keep if analyze_sentiment provides it
            )
            sentiment_records.append(sentiment_record)

            summary_results.append(
                {
                    "review_id": review.get("review_id"),  # Consistent with above
                    "sentiment": sentiment.get("sentiment"),
                    "confidence": sentiment.get("confidence"),
                }
            )

        session.add_all(sentiment_records)
        session.commit()

    return {
        "Status": "Success",
        "Analyzed": len(sentiment_records),
        "Results": summary_results,
    }
