from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlmodel import Session, select
from fastapi import HTTPException

from app.oauth_models import Service, ServiceAccount
from app.oauth_handler import exchange_code_for_token, get_user_info_from_provider
from app.core.oauth_config import providers_registry


def get_service_by_name(session: Session, service_name: str) -> Optional[Service]:
    statement = select(Service).where(Service.name == service_name)
    return session.exec(statement).first()


def get_user_service_accounts(session: Session, user_id: int, active_only: bool = True) -> List[ServiceAccount]:
    statement = select(ServiceAccount).where(ServiceAccount.user_id == user_id)
    if active_only:
        statement = statement.where(ServiceAccount.is_active == True)
    return list(session.exec(statement).all())


def get_service_account(session: Session, user_id: int, service_id: int) -> Optional[ServiceAccount]:

    statement = select(ServiceAccount).where(
        ServiceAccount.user_id == user_id,
        ServiceAccount.service_id == service_id,
        ServiceAccount.is_active == True
    )
    return session.exec(statement).first()


def create_or_update_service_account(
    session: Session,
    user_id: int,
    service_id: int,
    access_token: str,
    refresh_token: Optional[str] = None,
    expires_in: Optional[int] = None,
    granted_scopes: Optional[str] = None,
    remote_account_id: Optional[str] = None,
    remote_email: Optional[str] = None,
    remote_name: Optional[str] = None,
) -> ServiceAccount:

    existing = get_service_account(session, user_id, service_id)
    
    if existing:
        existing.access_token = access_token
        existing.refresh_token = refresh_token or existing.refresh_token
        existing.granted_scopes = granted_scopes or existing.granted_scopes
        existing.remote_account_id = remote_account_id or existing.remote_account_id
        existing.remote_email = remote_email or existing.remote_email
        existing.remote_name = remote_name or existing.remote_name
        
        if expires_in:
            existing.expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        existing.is_active = True
        existing.last_error = None
        existing.updated_at = datetime.utcnow()
        
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        expires_at = None
        if expires_in:
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        service_account = ServiceAccount(
            user_id=user_id,
            service_id=service_id,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            granted_scopes=granted_scopes,
            remote_account_id=remote_account_id,
            remote_email=remote_email,
            remote_name=remote_name,
            is_active=True,
        )
        
        session.add(service_account)
        session.commit()
        session.refresh(service_account)
        return service_account


def disconnect_service_account(session: Session, user_id: int, service_id: int) -> bool:
    service_account = get_service_account(session, user_id, service_id)
    
    if service_account:
        service_account.is_active = False
        service_account.updated_at = datetime.utcnow()
        session.add(service_account)
        session.commit()
        return True
    
    return False


def refresh_service_token(session: Session, service_account: ServiceAccount) -> ServiceAccount:
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
    
    provider = registry[service.oauth_provider]
    
    import requests
    
    token_data = {
        "client_id": provider.web.client_id if provider.web else "",
        "client_secret": provider.web.client_secret if provider.web else "",
        "refresh_token": service_account.refresh_token,
        "grant_type": "refresh_token",
    }
    
    try:
        response = requests.post(
            provider.token_url,
            data=token_data,
            headers={"Accept": "application/json"},
            timeout=10
        )
        
        if response.status_code != 200:
            service_account.error_count += 1
            service_account.last_error = f"Token refresh failed: {response.text}"
            session.add(service_account)
            session.commit()
            raise HTTPException(
                status_code=400,
                detail=f"Token refresh failed: {response.text}"
            )
        
        token_response = response.json()
        
        service_account.access_token = token_response.get("access_token", service_account.access_token)
        
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
    
    except requests.RequestException as e:
        service_account.error_count += 1
        service_account.last_error = f"Network error: {str(e)}"
        session.add(service_account)
        session.commit()
        raise HTTPException(
            status_code=500,
            detail=f"Error refreshing token: {str(e)}"
        )


def is_token_expired(service_account: ServiceAccount) -> bool:

    if not service_account.expires_at:
        return False  
    
    buffer = timedelta(minutes=5)
    return datetime.utcnow() + buffer >= service_account.expires_at


def get_valid_token(session: Session, service_account: ServiceAccount) -> str:

    if is_token_expired(service_account):
        service_account = refresh_service_token(session, service_account)
    
    return service_account.access_token
