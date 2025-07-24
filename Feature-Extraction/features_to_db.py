from typing import Optional, List
from sqlmodel import SQLModel, Field, Session, create_engine, select

# Database connection URL 
DATABASE_URL = "postgresql://postgres:penLaMOliGHthel0*@database-2.c5guus84snfp.ap-south-1.rds.amazonaws.com:5432/play_store_apps"
# "postgresql://postgres:postgres@localhost:5433/play_store_apps"
# Create the engine
engine = create_engine(DATABASE_URL, echo=True)


class FeatureBase(SQLModel):
    __tablename__ = "app_features"
    # id: int = Field(primary_key=True, au)
    name: str = Field(description="Name of the extracted feature")
    app_id: str = Field(description="Reference to the app")


class Feature(FeatureBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


SQLModel.metadata.create_all(engine, checkfirst=True)
