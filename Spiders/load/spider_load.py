import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List
from uuid import UUID

import httpx
from dotenv import load_dotenv
from sqlalchemy import and_, create_engine, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from Spiders.models.spider_models.models import (AppDetailsModel,
                                                 AppDeveloperDetailsModel,
                                                 AppInfoModel,
                                                 AppRatingsHistogramModel,
                                                 AppReviewsModel, BaseModel)
from Spiders.PlayStoreScraper.play_store_scraper import (PlayStoreAppDetails,
                                                         PlayStoreReviews)

logging.basicConfig(level=logging.INFO)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")
HOST = os.getenv("DB_HOST")
PORT = os.getenv("DB_PORT")
DATABASE = os.getenv("SPIDER_DB_NAME")
DB_USER = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
MICRO_HOST = os.getenv("MICRO_HOST")  # Microservice host address
ANALYSIS_PATH = os.getenv("ANALYSIS_PATH")  # Microservice path to analysis
DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{HOST}:{PORT}/{DATABASE}"
ASYNC_DB_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{HOST}:{PORT}/{DATABASE}"
engine = create_engine(DATABASE_URL)
async_engine = create_async_engine(ASYNC_DB_URL)
AsyncSessionLocal = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)
BaseModel.metadata.create_all(engine)


@asynccontextmanager
async def get_async_session():
    async with AsyncSessionLocal() as session:
        yield session


def load_app_details(session, app_id, lang, country):
    try:
        app = PlayStoreAppDetails()
        details = app.app(app_id, lang, country)
        existing_app = session.execute(
            select(AppInfoModel).where(
                and_(
                    AppInfoModel.app_id == app_id,
                    AppInfoModel.language == lang,
                )
            )
        ).scalar()
        # adding app information
        if not existing_app:
            app_info = AppInfoModel(
                app_id=app_id,
                country=country,
                language=lang,
                app_name=details.get("title"),
                url=details.get("url"),
                app_description=details.get("description"),
                summary=details.get("summary"),
                released_at=details.get("released"),
                icon_url=details.get("icon"),
                genre=details.get("genre"),
            )
            session.add(app_info)
        app_details = AppDetailsModel(
            app_id=app_id,
            app_country=country,
            total_app_installs=details.get("installs"),
            avg_rating=details.get("score"),
            installs=details.get("minInstalls"),
            real_installs=details.get("realInstalls"),
            ratings_count=details.get("ratings"),
            reviews_count=details.get("reviews"),
            version=details.get("version"),
            last_updated=details.get("lastUpdatedOn"),
        )
        session.add(app_details)
        for i, rating_cnt in enumerate(details.get("histogram"), 1):
            ratings_histogram = AppRatingsHistogramModel(
                app_id=app_id,
                app_country=country,
                rating_star=i,
                ratings_count=rating_cnt,
            )
            session.add(ratings_histogram)

        developer_model = AppDeveloperDetailsModel(
            app_id=app_id,
            app_country=country,
            developer_id=details.get("developerId"),
            developer=details.get("developer"),
            developer_email=details.get("developerEmail"),
            developer_website=details.get("developerWebsite"),
            developer_address=details.get("developerAddress"),
        )
        session.add(developer_model)
        session.commit()
    except Exception as e:
        logging.error(e)
        return False
    else:
        return True


def analysis_app_reviews(reviews):
    return [
        {"review_id": review.get("reviewId"), "review_text": review.get("content")}
        for review in reviews
    ]


async def save_reviews_async(
    reviews: List[dict],
    app_id: str,
    country: str,
    latest_review_ids: set,
    session: AsyncSession,
):
    flag = False
    for review in reviews:
        if UUID(review.get("reviewId")) in latest_review_ids:
            flag = True
            continue
        review_model = AppReviewsModel(
            app_id=app_id,
            app_country=country,
            review_id=UUID(review.get("reviewId")),
            user_name=review.get("userName"),
            content=review.get("content"),
            ratings=review.get("score"),
            thumbs_up_count=review.get("thumbsUpCount"),
            review_created_at=review.get("at"),
            review_created_version=review.get("reviewCreatedVersion"),
            review_reply=review.get("replyContent"),
            reply_time=review.get("repliedAt"),
            current_app_version=review.get("appVersion"),
        )
        session.add(review_model)

    await session.commit()
    return flag


async def store_reviews_async_way(reviews, app_id, country, latest_review_ids):
    async with get_async_session() as session:
        return await save_reviews_async(
            reviews, app_id, country, latest_review_ids, session
        )


async def load_app_reviews(app_id, lang, country, sync_session):
    try:
        app_reviews = PlayStoreReviews()
        latest_review_ids = sync_session.execute(
            select(AppReviewsModel.review_id).where(
                and_(
                    AppReviewsModel.app_id == app_id,
                    AppReviewsModel.app_country == country,
                )
            )
        ).all()
        latest_review_ids = set(
            latest_review_id[0] for latest_review_id in latest_review_ids
        )

        token = None
        while reviews := app_reviews.reviews(
            app_id, lang, country, continuation_token=token, count=500
        ):
            reviews, token = reviews
            analysis_reviews = analysis_app_reviews(reviews)
            with httpx.Client() as client:
                response = client.post(
                    f"{MICRO_HOST}/{ANALYSIS_PATH}/",
                    json={"reviews": analysis_reviews},
                    timeout=100,
                )
                print(response.json())
            logging.info(f"Fetched {len(reviews)} reviews. Token: {token}")
            success = await store_reviews_async_way(
                reviews, app_id, country, latest_review_ids
            )
            if not success:
                logging.info("Reviews are loaded in DB")
            else:
                logging.info("Some reviews already exist, skipping")
    except Exception as e:
        logging.exception(f"Error while loading reviews, {e}")
        return False
    return True


async def load_data(app_id, lang="en", country="us"):
    with Session(engine) as session:
        success = load_app_details(session, app_id, lang, country)
        reviews_success = await load_app_reviews(app_id, lang, country, session)
        if success and reviews_success:
            logging.info("Successfully loaded app details and reviews")
            return True
        else:
            logging.info("Failed to load app details and reviews")
            return False


# if __name__ == "__main__":
#     result = asyncio.run(load_data("com.flyersoft.moonreader"))
#     print(result)
