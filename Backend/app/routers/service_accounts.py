from typing import Annotated, List
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import SessionDep, engine
from app.oauth2 import oauth2_scheme, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token
from app.user import get_user_from_token
from app.oauth_models import Service, ServiceAccount, OAuthConnection
from app.service_manager import get_user_service_accounts, get_service_account, create_or_update_service_account, disconnect_service_account, get_service_by_name
from app.oauth_handler import exchange_code_for_token, get_user_info_from_provider, find_or_create_user_from_oauth
from app.token_refresh import refresh_oauth_connection, refresh_service_account_token, get_valid_service_account_token, batch_refresh_expired_tokens, is_token_expired

service_accounts_router = APIRouter(
    prefix="/services",
    tags=["service-accounts"],
)

TokenDep = Annotated[str, Depends(oauth2_scheme)]

@service_accounts_router.get("", tags=["services"])
def list_available_services(session: SessionDep):
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


@service_accounts_router.get("/my", tags=["service-accounts"])
def get_my_connected_services(session: SessionDep, token: TokenDep):
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

@service_accounts_router.post("/{service_name}/connect", tags=["service-accounts"])
def connect_service(
    service_name: str,
    code: str,
    session: SessionDep,
    token: TokenDep,
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
        session = session,
        user_id = user.id,
        service_id = service.id,
        access_token = token_data.get("access_token", ""),
        refresh_token = token_data.get("refresh_token"),
        expires_in = token_data.get("expires_in"),
        granted_scopes = token_data.get("scope", ""),
        remote_account_id = str(user_info.get("id") or user_info.get("sub", "")),
        remote_email = user_info.get("email"),
        remote_name = user_info.get("name") or user_info.get("login"),
    )
    return {
        "success": True,
        "service_account_id": service_account.id,
        "service_name": service.display_name,
        "remote_email": service_account.remote_email,
    }


@service_accounts_router.delete("/{service_id}/disconnect", tags=["service-accounts"])
def disconnect_service(
    service_id: int,
    session: SessionDep,
    token: TokenDep
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

@service_accounts_router.post("/{service_account_id}/refresh", tags=["service-accounts"])
def refresh_service_token(
    service_account_id: int,
    session: SessionDep,
    token: TokenDep
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

@service_accounts_router.get("/oauth-connections", tags=["oauth"])
def get_my_oauth_connections(session: SessionDep, token: TokenDep):
    user = get_user_from_token(token, session)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    statement = select(OAuthConnection).where(OAuthConnection.user_id == user.id)
    connections = session.exec(statement).all()
    
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


@service_accounts_router.post("/oauth-connections/{connection_id}/refresh", tags=["oauth"])
def refresh_oauth_connection_endpoint(
    connection_id: int,
    session: SessionDep,
    token: TokenDep
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

@service_accounts_router.post("/admin/refresh-expired-tokens", tags=["admin"])
def admin_refresh_all_expired_tokens(
    session: SessionDep,
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
