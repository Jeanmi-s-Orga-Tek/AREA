from contextlib import asynccontextmanager
from datetime import datetime
from typing import Annotated, List

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.area import Area, AreaCreate, AreaRead
from app.db import create_db_tables, get_session
from .discord import discord_router


app = FastAPI()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_tables()
    yield

app = FastAPI(
    title="AREA POC - Backend",
    description="Backend minimal pour le POC timer → discord",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:5173",
        "http://localhost",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:5173",
        "http://127.0.0.1",
        "http://server:8081",
        "http://server:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(discord_router)

SessionDep = Annotated[Session, Depends(get_session)]


@app.post("/areas", response_model=AreaRead, tags=["area"])
def create_area(area: AreaCreate, session: SessionDep):
    db_area = Area.model_validate(area)
    session.add(db_area)
    session.commit()
    session.refresh(db_area)
    return db_area


@app.get("/areas", response_model=List[AreaRead], tags=["area"])
def list_areas(session: SessionDep):
    statement = select(Area)
    areas = session.exec(statement).all()
    return areas


@app.get("/about.json", tags=["about"])
def get_about():
    return {
        "client": {
            "host": "localhost"
        },
        "server": {
            "current_time": int(datetime.utcnow().timestamp()),
            "services": [
                {
                    "name": "timer",
                    "actions": [
                        {
                            "name": "every_x_minutes",
                            "description": "Trigger every N minutes after activation."
                        }
                    ],
                    "reactions": []
                },
                {
                    "name": "discord",
                    "actions": [],
                    "reactions": [
                        {
                            "name": "send_message",
                            "description": "Send a message to a Discord channel via webhook."
                        }
                    ]
                }
            ]
        }
    }

@app.get("/health", tags=["health"])
def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "area-poc-backend"}
