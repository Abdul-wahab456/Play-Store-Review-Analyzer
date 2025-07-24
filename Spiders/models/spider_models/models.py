# this includes the models for storing the scrapped data in database,
# it is considered as raw storage for scraped data.
import uuid
from datetime import datetime
from typing import List

from sqlalchemy import (TIMESTAMP, Date, DateTime, Float, ForeignKey,
                        ForeignKeyConstraint, Integer, String, Text, Uuid,
                        func)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class BaseModel(DeclarativeBase):
    pass


class AppInfoModel(BaseModel):
    __tablename__ = "app_information"
    app_id: Mapped[str] = mapped_column(String(150), primary_key=True)
    country: Mapped[str] = mapped_column(String(50), primary_key=True)
    language: Mapped[str] = mapped_column(String(150), nullable=False)
    app_name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    app_description: Mapped[str] = mapped_column(Text, nullable=True)
    icon_url: Mapped[str] = mapped_column(String(255), nullable=True)
    genre: Mapped[str] = mapped_column(String(255), nullable=True)
    added_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=func.now()
    )
    summary: Mapped[str] = mapped_column(String(255), nullable=True)
    released_at: Mapped[Date] = mapped_column(Date, nullable=True)

    # relationship
    reviews: Mapped[List["AppReviewsModel"]] = relationship(back_populates="app_info")
    details: Mapped[List["AppDetailsModel"]] = relationship(back_populates="app_info")
    ratings_histogram: Mapped[List["AppRatingsHistogramModel"]] = relationship(
        back_populates="app_info"
    )
    app_developer_details: Mapped["AppDeveloperDetailsModel"] = relationship(
        back_populates="app_info"
    )

    def __repr__(self):
        return f"{self.app_id=}, {self.app_name=}, {self.url=}, {self.added_at=}"


class AppReviewsModel(BaseModel):
    __tablename__ = "app_reviews"
    __table_args__ = (
        ForeignKeyConstraint(
            ["app_id", "app_country"],
            ["app_information.app_id", "app_information.country"],
        ),
    )
    app_id: Mapped[str] = mapped_column(String(100), nullable=False)
    app_country: Mapped[str] = mapped_column(String(100), nullable=False)
    review_id: Mapped[Uuid] = mapped_column(
        Uuid, nullable=False, primary_key=True, default=uuid.uuid4
    )
    user_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=True)
    ratings: Mapped[str] = mapped_column(Integer, nullable=False)
    review_created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    thumbs_up_count: Mapped[Integer] = mapped_column(Integer, nullable=False, default=0)
    review_created_version: Mapped[str] = mapped_column(String(100), nullable=True)
    review_reply: Mapped[str] = mapped_column(Text, nullable=True)
    reply_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    current_app_version: Mapped[str] = mapped_column(String(100), nullable=True)
    added_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=func.now()
    )
    app_info: Mapped["AppInfoModel"] = relationship(back_populates="reviews")


class AppDetailsModel(BaseModel):
    __tablename__ = "app_details"
    __table_args__ = (
        ForeignKeyConstraint(
            ["app_id", "app_country"],
            ["app_information.app_id", "app_information.country"],
        ),
    )
    ID: Mapped[Integer] = mapped_column(
        Integer, nullable=False, primary_key=True, autoincrement=True
    )
    app_id: Mapped[str] = mapped_column(String(100), nullable=False)
    app_country: Mapped[str] = mapped_column(String(100), nullable=False)
    total_app_installs: Mapped[str] = mapped_column(
        String(100), nullable=False, default=0
    )
    avg_rating: Mapped[Float] = mapped_column(Float, nullable=False, default=0)
    installs: Mapped[Integer] = mapped_column(Integer, nullable=False, default=0)
    real_installs: Mapped[Integer] = mapped_column(Integer, nullable=False, default=0)
    ratings_count: Mapped[Integer] = mapped_column(Integer, nullable=False, default=0)
    reviews_count: Mapped[Integer] = mapped_column(Integer, nullable=False, default=0)
    last_updated: Mapped[datetime.date] = mapped_column(Date, nullable=True)
    version: Mapped[str] = mapped_column(String(50), nullable=True)
    added_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=func.now()
    )
    app_info: Mapped["AppInfoModel"] = relationship(back_populates="details")


class AppRatingsHistogramModel(BaseModel):
    __tablename__ = "app_rating_histogram"
    __table_args__ = (
        ForeignKeyConstraint(
            ["app_id", "app_country"],
            ["app_information.app_id", "app_information.country"],
        ),
    )
    app_id: Mapped[str] = mapped_column(String(100), nullable=False)
    app_country: Mapped[str] = mapped_column(String(100), nullable=False)
    ID: Mapped[Integer] = mapped_column(
        Integer, nullable=False, primary_key=True, autoincrement=True
    )
    rating_star: Mapped[Integer] = mapped_column(Integer, nullable=False, default=0)
    ratings_count: Mapped[Integer] = mapped_column(Integer, nullable=False, default=0)
    added_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=func.now()
    )
    app_info: Mapped["AppInfoModel"] = relationship(back_populates="ratings_histogram")


class AppDeveloperDetailsModel(BaseModel):
    __tablename__ = "app_developer_details"
    __table_args__ = (
        ForeignKeyConstraint(
            ["app_id", "app_country"],
            ["app_information.app_id", "app_information.country"],
        ),
    )
    app_id: Mapped[str] = mapped_column(String(100), nullable=False)
    app_country: Mapped[str] = mapped_column(String(100), nullable=False)
    ID: Mapped[Integer] = mapped_column(
        Integer, nullable=False, primary_key=True, autoincrement=True
    )
    developer_id: Mapped[str] = mapped_column(String, nullable=True)
    developer: Mapped[str] = mapped_column(String(255), nullable=True)
    developer_email: Mapped[str] = mapped_column(String(255), nullable=True)
    developer_website: Mapped[str] = mapped_column(String(255), nullable=True)
    developer_address: Mapped[str] = mapped_column(String(255), nullable=True)
    added_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=func.now(),
    )
    app_info: Mapped["AppInfoModel"] = relationship(
        back_populates="app_developer_details"
    )
