import os
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://area_user:area_password@postgres:5432/area_poc"
)

engine = create_engine(DATABASE_URL, echo=True)


def create_db_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
