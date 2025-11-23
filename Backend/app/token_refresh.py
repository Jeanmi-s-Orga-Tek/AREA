import requests
from datetime import datetime, timedelta
from typing import Union, Dict, Any, Optional
from sqlmodel import Session
from fastapi import HTTPException

from app.oauth_models import OAuthConnection, ServiceAccount, Service
from app.core.oauth_config import providers_registry
from sqlmodel import select


def refresh_oauth_token(
    provider_name: str,
    refresh_token: str,
    client_id: str,
    client_secret: Optional[str] = None,
    token_url: Optional[str] = None
) -> Dict[str, Any]:

    if not token_url:
        registry = providers_registry()
        if provider_name not in registry:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown OAuth provider: {provider_name}"
            )
        token_url = registry[provider_name].token_url
    
    token_data = {
        "client_id": client_id,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    
    if client_secret:
        token_data["client_secret"] = client_secret
    
    try:
        response = requests.post(
            token_url,
            data=token_data,
            headers={"Accept": "application/json"},
            timeout=10
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Token refresh failed: {response.text}"
            )
        
        token_response = response.json()
        
        if "access_token" not in token_response:
            raise HTTPException(
                status_code=500,
                detail="Token refresh response missing access_token"
            )
        
        return token_response
    
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Network error during token refresh: {str(e)}"
        )


def refresh_oauth_connection(
    session: Session,
    oauth_connection: OAuthConnection
) -> OAuthConnection:

    if not oauth_connection.refresh_token:
        raise HTTPException(
            status_code=400,
            detail="No refresh token available for this OAuth connection"
        )
    
    registry = providers_registry()
    if oauth_connection.provider not in registry:
        raise HTTPException(
            status_code=400,
            detail=f"OAuth provider not configured: {oauth_connection.provider}"
        )
    
    provider_config = registry[oauth_connection.provider]
    
    client_id = provider_config.web.client_id if provider_config.web else ""
    client_secret = provider_config.web.client_secret if provider_config.web else None
    
    try:
        token_response = refresh_oauth_token(
            provider_name=oauth_connection.provider,
            refresh_token=oauth_connection.refresh_token,
            client_id=client_id,
            client_secret=client_secret,
            token_url=provider_config.token_url
        )
        
        oauth_connection.access_token = token_response["access_token"]
        
        if "refresh_token" in token_response:
            oauth_connection.refresh_token = token_response["refresh_token"]
        
        expires_in = token_response.get("expires_in")
        if expires_in:
            oauth_connection.expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        if "scope" in token_response:
            oauth_connection.scope = token_response["scope"]
        
        oauth_connection.updated_at = datetime.utcnow()
        
        session.add(oauth_connection)
        session.commit()
        session.refresh(oauth_connection)
        
        return oauth_connection
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error refreshing OAuth connection: {str(e)}"
        )


def refresh_service_account_token(
    session: Session,
    service_account: ServiceAccount
) -> ServiceAccount:
    if not service_account.refresh_token:
        raise HTTPException(
            status_code=400,
            detail="No refresh token available for this service account"
        )
    
    service = session.get(Service, service_account.service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    registry = providers_registry()
    if service.oauth_provider not in registry:
        raise HTTPException(
            status_code=400,
            detail=f"OAuth provider not configured: {service.oauth_provider}"
        )
    
    provider_config = registry[service.oauth_provider]
    client_id = provider_config.web.client_id if provider_config.web else ""
    client_secret = provider_config.web.client_secret if provider_config.web else None
    
    try:
        token_response = refresh_oauth_token(
            provider_name=service.oauth_provider,
            refresh_token=service_account.refresh_token,
            client_id=client_id,
            client_secret=client_secret,
            token_url=provider_config.token_url
        )
        
        service_account.access_token = token_response["access_token"]
        
        if "refresh_token" in token_response:
            service_account.refresh_token = token_response["refresh_token"]
        
        expires_in = token_response.get("expires_in")
        if expires_in:
            service_account.expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        service_account.error_count = 0
        service_account.last_error = None
        service_account.updated_at = datetime.utcnow()
        
        session.add(service_account)
        session.commit()
        session.refresh(service_account)
        
        return service_account
    
    except HTTPException as e:
        service_account.error_count += 1
        service_account.last_error = str(e.detail)
        session.add(service_account)
        session.commit()
        raise
    except Exception as e:
        service_account.error_count += 1
        service_account.last_error = f"Error refreshing token: {str(e)}"
        session.add(service_account)
        session.commit()
        raise HTTPException(
            status_code=500,
            detail=f"Error refreshing service account token: {str(e)}"
        )


def is_token_expired(
    expires_at: Optional[datetime],
    buffer_minutes: int = 5
) -> bool:

    if not expires_at:
        return False
    
    buffer = timedelta(minutes=buffer_minutes)
    return datetime.utcnow() + buffer >= expires_at


def get_valid_oauth_connection_token(
    session: Session,
    oauth_connection: OAuthConnection
) -> str:

    if is_token_expired(oauth_connection.expires_at):
        oauth_connection = refresh_oauth_connection(session, oauth_connection)
    
    return oauth_connection.access_token


def get_valid_service_account_token(
    session: Session,
    service_account: ServiceAccount
) -> str:

    if is_token_expired(service_account.expires_at):
        service_account = refresh_service_account_token(session, service_account)
    
    return service_account.access_token


def batch_refresh_expired_tokens(session: Session, max_count: int = 100) -> Dict[str, Any]:
    stats = {
        "oauth_connections": {"total": 0, "success": 0, "failed": 0},
        "service_accounts": {"total": 0, "success": 0, "failed": 0},
    }
    
    now = datetime.utcnow()
    
    oauth_connections_query = select(OAuthConnection).where(
        OAuthConnection.expires_at <= now,
        OAuthConnection.refresh_token != None
    ).limit(max_count)
    
    oauth_connections = session.exec(oauth_connections_query).all()
    stats["oauth_connections"]["total"] = len(oauth_connections)
    
    for oauth_conn in oauth_connections:
        try:
            refresh_oauth_connection(session, oauth_conn)
            stats["oauth_connections"]["success"] += 1
        except Exception as e:
            stats["oauth_connections"]["failed"] += 1
            print(f"Failed to refresh OAuth connection {oauth_conn.id}: {e}")
    
    service_accounts_query = select(ServiceAccount).where(
        ServiceAccount.expires_at <= now,
        ServiceAccount.refresh_token != None,
        ServiceAccount.is_active == True
    ).limit(max_count)
    
    service_accounts = session.exec(service_accounts_query).all()
    stats["service_accounts"]["total"] = len(service_accounts)
    
    for service_acc in service_accounts:
        try:
            refresh_service_account_token(session, service_acc)
            stats["service_accounts"]["success"] += 1
        except Exception as e:
            stats["service_accounts"]["failed"] += 1
            print(f"Failed to refresh service account {service_acc.id}: {e}")
    
    return stats
