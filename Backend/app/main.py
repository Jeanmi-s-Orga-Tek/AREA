import os
import random
import string
from typing import Iterable, List, Optional, Sequence, Union
import time
import icalendar

from contextlib import asynccontextmanager
from fastapi import APIRouter, Cookie, FastAPI, Query, Request, Depends, HTTPException, UploadFile, status, Form
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware

from sqlmodel import Field, Session, SQLModel, asc, create_engine, select, func, col, desc
from typing import Annotated

from app.db import create_db_tables, engine
from app.send_email import send_email

# from user import BaseUser, User, RegisteringUser, Token, EmailCheck, PasswordChange, oauth2_scheme, ACCESS_TOKEN_EXPIRE_MINUTES, verify_password, verify_token, get_password_hash, create_access_token, get_user_from_token

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_tables()
    yield

origins = [
    "http://localhost",
    "http://localhost:5173",
]

tags_metadata = [
    {
        "name": "startups",
        "description": "Operations with startups.",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
    },
    {
        "name": "investors",
        "description": "Operations with investors.",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
    },
    {
        "name": "partners",
        "description": "Operations with partners.",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
    },
    {
        "name": "news",
        "description": "Operations with news.",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
    },
    {
        "name": "events",
        "description": "Operations with events",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
    },
    {
        "name": "projects",
        "description": "Operations with projects",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
    },
    {
        "name": "users",
        "description": "Operations with users.",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
    },
]

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

from app.user import user_router
from app.routers.services import services_router
from app.routers.areas import areas_router


app = FastAPI(lifespan=lifespan, openapi_tags=tags_metadata)

# router_login = APIRouter()
# router_user = APIRouter(dependencies=[Depends(oauth2_scheme)])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

# app.include_router(router_login)
# app.include_router(router_user)
app.include_router(user_router)
app.include_router(services_router)
app.include_router(areas_router)

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/about.json")
async def about(request: Request):
    client_host = get_client_ip(request)
    current_time = int(time.time())
    services = [
        {
            "name": "timer",
            "actions": [
                {"name": "at_time", "description": "The current time matches HH:MM"},
                {"name": "on_date", "description": "The current date matches DD/MM"},
            ],
            "reactions": [
                {"name": "log", "description": "Record a log entry"}
            ],
        }
    ]
    return JSONResponse({
        "client": {"host": client_host},
        "server": {
            "current_time": current_time,
            "services": services,
        },
    })
