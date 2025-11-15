import os

from typing import Annotated
from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select

POSTGRESQL_URI = str(os.environ.get("POSTGRESQL_URI"))

engine = create_engine(POSTGRESQL_URI)

def create_db_tables():
    SQLModel.metadata.create_all(engine)
