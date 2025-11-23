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
from app.service_manager import (
    get_user_service_accounts, get_service_account, create_or_update_service_account,
    disconnect_service_account, get_service_by_name
)
from app.oauth_models import Service, ServiceAccount, OAuthConnection
from app.token_refresh import (
    refresh_oauth_connection, refresh_service_account_token,
    get_valid_service_account_token, batch_refresh_expired_tokens
)


from sqlmodel import Field, Session, SQLModel, asc, create_engine, select, func, col, desc

from app.db import create_db_tables, engine, SessionDep
from app.send_email import send_email
from app.models.services import Service, ServiceAction, ServiceReaction

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
from app.routers.areas import areas_router


app = FastAPI(lifespan=lifespan, openapi_tags=tags_metadata)

router_login = APIRouter()
router_user = APIRouter(dependencies=[Depends(oauth2_scheme)])

@router_login.get("/health", tags=["health"])
def health():
    return {"status": "ok"}

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
def oauth_callback(provider: str, code: str, state: str = "", flow: str = "web", session: Session = Depends(lambda: Session(engine))):

    try:
        token_data = exchange_code_for_token(provider, flow, code)
        
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

# ============================================================
# ENDPOINTS POUR LES SERVICES
# ============================================================

@router_login.get("/services", tags=["services"])
def list_services(session: Session = Depends(lambda: Session(engine))):
    statement = select(Service).where(Service.is_active == True)
    services = session.exec(statement).all()
    
    return [
        {
            "id": s.id,
            "name": s.name,
            "display_name": s.display_name,
            "description": s.description,
            "oauth_provider": s.oauth_provider,
            "icon": s.icon,
            "color": s.color,
            "category": s.category,
        }
        for s in services
    ]

@router_user.get("/my/services", tags=["services"])
def get_my_connected_services(
    session: Session = Depends(lambda: Session(engine)),
    token: str = Depends(oauth2_scheme)
):
    print(token)
    user = get_user_from_token(token, session)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    service_accounts = get_user_service_accounts(session, user.id)
    
    result = []
    for sa in service_accounts:
        service = session.get(Service, sa.service_id)
        if service:
            result.append({
                "id": sa.id,
                "service": {
                    "id": service.id,
                    "name": service.name,
                    "display_name": service.display_name,
                    "icon": service.icon,
                    "color": service.color,
                },
                "remote_email": sa.remote_email,
                "remote_name": sa.remote_name,
                "granted_scopes": sa.granted_scopes,
                "is_active": sa.is_active,
                "last_used_at": sa.last_used_at,
                "created_at": sa.created_at,
            })
    
    return result

@router_user.post("/services/{service_name}/connect", tags=["services"])
def connect_service(
    service_name: str,
    code: str,
    session: Session = Depends(lambda: Session(engine)),
    token: str = Depends(oauth2_scheme),
    flow: str = "web"
):

    user = get_user_from_token(token, session)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    service = get_service_by_name(session, service_name)
    if not service:
        raise HTTPException(status_code=404, detail=f"Service not found: {service_name}")
    
    token_data = exchange_code_for_token(service.oauth_provider, flow, code)
    
    user_info = get_user_info_from_provider(service.oauth_provider, token_data["access_token"])
    
    service_account = create_or_update_service_account(
        session=session,
        user_id=user.id,
        service_id=service.id,
        access_token=token_data.get("access_token", ""),
        refresh_token=token_data.get("refresh_token"),
        expires_in=token_data.get("expires_in"),
        granted_scopes=token_data.get("scope", ""),
        remote_account_id=str(user_info.get("id") or user_info.get("sub", "")),
        remote_email=user_info.get("email"),
        remote_name=user_info.get("name") or user_info.get("login"),
    )
    
    return {
        "success": True,
        "service_account_id": service_account.id,
        "service_name": service.display_name,
        "remote_email": service_account.remote_email,
    }

@router_user.delete("/services/{service_id}/disconnect", tags=["services"])
def disconnect_service(
    service_id: int,
    session: Session = Depends(lambda: Session(engine)),
    token: str = Depends(oauth2_scheme)
):

    user = get_user_from_token(token, session)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    success = disconnect_service_account(session, user.id, service_id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Service account not found or already disconnected"
        )
    
    return {"success": True, "message": "Service disconnected"}


# ============================================================
# ENDPOINTS POUR LE RAFRAÎCHISSEMENT DES TOKENS
# ============================================================

@router_user.post("/services/{service_account_id}/refresh", tags=["services"])
def refresh_service_token(
    service_account_id: int,
    session: Session = Depends(lambda: Session(engine)),
    token: str = Depends(oauth2_scheme)
):
 
    user = get_user_from_token(token, session)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    service_account = session.get(ServiceAccount, service_account_id)
    if not service_account:
        raise HTTPException(status_code=404, detail="Service account not found")
    
    if service_account.user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        refreshed = refresh_service_account_token(session, service_account)
        return {
            "success": True,
            "message": "Token refreshed successfully",
            "expires_at": refreshed.expires_at,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh token: {str(e)}"
        )

@router_login.post("/admin/refresh-expired-tokens", tags=["admin"])
def admin_refresh_all_expired_tokens(
    session: Session = Depends(lambda: Session(engine)),
    max_count: int = 100
):
    try:
        stats = batch_refresh_expired_tokens(session, max_count=max_count)
        return {
            "success": True,
            "stats": stats,
            "message": f"Refreshed {stats['oauth_connections']['success'] + stats['service_accounts']['success']} tokens"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch refresh failed: {str(e)}"
        )

@router_user.get("/my/oauth-connections", tags=["oauth"])
def get_my_oauth_connections(
    session: Session = Depends(lambda: Session(engine)),
    token: str = Depends(oauth2_scheme)
):
    user = get_user_from_token(token, session)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    statement = select(OAuthConnection).where(OAuthConnection.user_id == user.id)
    connections = session.exec(statement).all()
    
    from app.token_refresh import is_token_expired
    
    result = []
    for conn in connections:
        result.append({
            "id": conn.id,
            "provider": conn.provider,
            "provider_email": conn.provider_email,
            "provider_name": conn.provider_name,
            "scope": conn.scope,
            "expires_at": conn.expires_at,
            "is_expired": is_token_expired(conn.expires_at),
            "has_refresh_token": bool(conn.refresh_token),
            "created_at": conn.created_at,
            "updated_at": conn.updated_at,
        })
    
    return result

@router_user.post("/oauth-connections/{connection_id}/refresh", tags=["oauth"])
def refresh_oauth_connection_endpoint(
    connection_id: int,
    session: Session = Depends(lambda: Session(engine)),
    token: str = Depends(oauth2_scheme)
):
    user = get_user_from_token(token, session)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    oauth_conn = session.get(OAuthConnection, connection_id)
    if not oauth_conn:
        raise HTTPException(status_code=404, detail="OAuth connection not found")
    
    if oauth_conn.user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        refreshed = refresh_oauth_connection(session, oauth_conn)
        return {
            "success": True,
            "message": "OAuth connection refreshed successfully",
            "expires_at": refreshed.expires_at,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh OAuth connection: {str(e)}"
        )

templates = Jinja2Templates(directory="templates")

app.include_router(router_login)
app.include_router(router_user)
app.include_router(user_router)
app.include_router(action_router)
app.include_router(reaction_router)
app.include_router(user_action_router)
app.include_router(user_reaction_router)
app.include_router(services_router)
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
        actions_query = select(ServiceAction).where(
            ServiceAction.service_id == service.id,
            ServiceAction.is_active == True,
        ).order_by(ServiceAction.name)
        reactions_query = select(ServiceReaction).where(
            ServiceReaction.service_id == service.id,
            ServiceReaction.is_active == True,
        ).order_by(ServiceReaction.name)
        actions = session.exec(actions_query).all()
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
