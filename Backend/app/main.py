import os
import random
import string
from typing import Iterable, List, Optional, Sequence, Union
import time
import icalendar
from datetime import timedelta
# import icalendar

from contextlib import asynccontextmanager
from fastapi import APIRouter, Cookie, FastAPI, Query, Request, Depends, HTTPException, UploadFile, status, Form
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import HTTPException
from app.core.oauth_config import public_provider_info, providers_registry, reload_providers, list_providers_for_frontend, get_auth_url
from app.oauth_handler import exchange_code_for_token, get_user_info_from_provider, find_or_create_user_from_oauth


from sqlmodel import Field, Session, SQLModel, asc, create_engine, select, func, col, desc

from app.db import create_db_tables, engine, SessionDep
from app.send_email import send_email
from app.oauth_models import Service
from app.action import Action
from app.reaction import Reaction

from app.timer_router import timer_router

# from user import BaseUser, User, RegisteringUser, Token, EmailCheck, PasswordChange, oauth2_scheme, ACCESS_TOKEN_EXPIRE_MINUTES, verify_password, verify_token, get_password_hash, create_access_token, get_user_from_token
from app.db import create_db_tables, engine

from app.user import BaseUser, User, RegisteringUser, Token, EmailCheck, PasswordChange, get_user_from_token
from app.oauth2 import oauth2_scheme, ACCESS_TOKEN_EXPIRE_MINUTES, verify_password, verify_token, get_password_hash, create_access_token
from app.send_email import send_email

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_tables()
    yield

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081"
]

tags_metadata = [
    {
        "name": "users",
        "description": "Operations with users.",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
    },
    {
        "name": "actions",
        "description": "Operations with actions.",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
    },
    {
        "name": "reactions",
        "description": "Operations with reactions.",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
    },
    {
        "name": "user_actions",
        "description": "Operations with user actions.",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
    },
    {
        "name": "user_reactions",
        "description": "Operations with user reactions.",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
    },
]

from app.user import user_router
from app.action import action_router
from app.reaction import reaction_router
from app.user_action import user_action_router
from app.user_reaction import user_reaction_router
from app.routers.services import services_router
from app.routers.service_accounts import service_accounts_router
from app.routers.areas import areas_router


app = FastAPI(lifespan=lifespan, openapi_tags=tags_metadata)

router_login = APIRouter()
router_user = APIRouter(dependencies=[Depends(oauth2_scheme)])

@router_login.get("/oauth/providers", tags=["oauth"])
@router_login.get("/auth/providers", tags=["oauth"])
def oauth_list_providers(flow: str = "web"):
    """
    Liste tous les providers OAuth2 avec leurs métadonnées.
    Retourne : [{id, name, icon, color, available, flows}]
    """
    try:
        return list_providers_for_frontend(flow)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router_login.get("/oauth/config/{provider}/{flow}", tags=["oauth"])
def oauth_public_config(provider: str, flow: str):
    try:
        return public_provider_info(provider, flow)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router_login.get("/oauth/authorize/{provider}/{flow}", tags=["oauth"])
def oauth_get_authorization_url(provider: str, flow: str, state: str = ""):
    try:
        auth_url = get_auth_url(provider, flow, state)
        return {"authorization_url": auth_url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router_login.get("/auth/authorize/{provider}/{flow}", tags=["oauth"])
def auth_get_authorization_url_alias(provider: str, flow: str, state: str = ""):
    return oauth_get_authorization_url(provider, flow, state)

@router_login.get("/oauth/callback/{provider}", tags=["oauth"])
@router_login.get("/auth/callback/{provider}", tags=["oauth"])
def oauth_callback(
    provider: str, 
    code: Optional[str] = None, 
    token: Optional[str] = None,
    state: str = "", 
    flow: str = "web", 
    session: Session = Depends(lambda: Session(engine))
):
    auth_code = token if provider == "trello" and token else code
    
    if not auth_code:
        raise HTTPException(status_code=400, detail="No authorization code or token provided")

    try:
        token_data = exchange_code_for_token(provider, flow, auth_code)
        
        user_info = get_user_info_from_provider(provider, token_data["access_token"])
        
        provider_user_id = str(user_info.get("id") or user_info.get("sub"))
        user = find_or_create_user_from_oauth(
            session=session,
            provider=provider,
            provider_user_id=provider_user_id,
            user_info=user_info,
            token_data=token_data
        )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        app_access_token = create_access_token(
            data={"sub": user.email},
            expires=access_token_expires
        )
        
        return {
            "access_token": app_access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "image": user.image
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OAuth callback error: {str(e)}"
        )

@router_login.post("/oauth/providers/reload", tags=["oauth"])
def oauth_reload():
    reload_providers()
    return {"reloaded": True}

templates = Jinja2Templates(directory="templates")

app.include_router(router_login)
app.include_router(router_user)
app.include_router(user_router)
app.include_router(action_router)
app.include_router(reaction_router)
app.include_router(user_action_router)
app.include_router(user_reaction_router)
app.include_router(services_router)
app.include_router(service_accounts_router)
app.include_router(areas_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
async def about(request: Request, session: SessionDep):
    client_host = get_client_ip(request)
    current_time = int(time.time())
    services_query = select(Service).where(Service.is_active == True).order_by(Service.name)
    services = session.exec(services_query).all()
    response_services = []
    for service in services:
        actions_query = select(Action).where(Action.service_id == service.id)
        actions = session.exec(actions_query).all()

        reactions_query = select(Reaction).where(Reaction.service_id == service.id)
        reactions = session.exec(reactions_query).all()
        
        response_services.append({
            "name": service.name,
            "actions": [
                {
                    "name": action.name,
                    "description": action.description,
                }
                for action in actions
            ],
            "reactions": [
                {
                    "name": reaction.name,
                    "description": reaction.description,
                }
                for reaction in reactions
            ],
        })
    return JSONResponse({
        "client": {"host": client_host},
        "server": {
            "current_time": current_time,
            "services": response_services,
        },
    })

app.include_router(timer_router)