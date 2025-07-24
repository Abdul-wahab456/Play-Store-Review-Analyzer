from typing import Optional
from sqlmodel import SQLModel, Field


class FeatureBase(SQLModel):
    __tablename__ = "app_features"
    name: str = Field(description="Name of the extracted feature")
    app_id: str = Field(description="Reference to the app")


class Feature(FeatureBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
