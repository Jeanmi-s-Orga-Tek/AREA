import base64
import json
import secrets
import requests
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from urllib.parse import urlparse, urlencode, parse_qsl, urlunparse

from sqlmodel import Session, select
from fastapi import HTTPException

from app.oauth_models import OAuthConnection, OAuthState
from app.user import User, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.oauth_config import providers_registry

STATE_PREFIX = "area::v1::"


def normalize_client_redirect_uri(uri: Optional[str]) -> Optional[str]:
    if uri is None:
        return None
    cleaned = uri.strip()
    if not cleaned:
        return None

    parsed = urlparse(cleaned)
    if not parsed.scheme:
        raise HTTPException(status_code=400, detail="client_redirect_uri must include a scheme")

    if parsed.scheme in ("http", "https") and not parsed.netloc:
        raise HTTPException(status_code=400, detail="client_redirect_uri must include a host when using http/https")

    return cleaned


def encode_oauth_state(raw_state: Optional[str], client_redirect_uri: Optional[str]) -> str:
    base_state = raw_state or ""
    if not client_redirect_uri:
        return base_state

    payload = {
        "v": 1,
        "state": base_state,
        "client_redirect_uri": client_redirect_uri,
    }
    serialized = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    encoded = base64.urlsafe_b64encode(serialized).decode("utf-8").rstrip("=")
    return f"{STATE_PREFIX}{encoded}"


def decode_oauth_state(state: Optional[str]) -> Tuple[str, Optional[str]]:
    if not state:
        return "", None

    if not state.startswith(STATE_PREFIX):
        return state, None

    encoded = state[len(STATE_PREFIX):]
    padding = len(encoded) % 4
    if padding:
        encoded += "=" * (4 - padding)

    try:
        decoded = base64.urlsafe_b64decode(encoded.encode("utf-8"))
        payload = json.loads(decoded)
        return payload.get("state", ""), payload.get("client_redirect_uri")
    except Exception:
        # Fall back to returning an empty state if decoding fails
        return "", None


def append_query_params(url: str, params: Dict[str, Optional[str]]) -> str:
    parsed = urlparse(url)
    existing = dict(parse_qsl(parsed.query, keep_blank_values=True))
    for key, value in params.items():
        if value is not None and value != "":
            existing[key] = value
    new_query = urlencode(existing)
    return urlunparse(parsed._replace(query=new_query))


def generate_oauth_state(provider: str, flow: str, redirect_uri: Optional[str] = None) -> str:

    state = secrets.token_urlsafe(32)
    return state


def exchange_code_for_token(provider: str, flow: str, code: str) -> Dict[str, Any]:
    registry = providers_registry()
    
    if provider not in registry:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")
    
    p = registry[provider]
    
    if flow == "web" and p.web:
        config = p.web
    elif flow == "mobile" and p.mobile:
        config = p.mobile
    else:
        raise HTTPException(status_code=400, detail=f"Flow '{flow}' not supported for provider '{provider}'")

    if provider == "trello":
        return {
            "access_token": code,
            "token_type": "Bearer",
            "scope": " ".join(config.scopes) if hasattr(config, 'scopes') else "",
        }
    
    token_data = {
        "client_id": config.client_id,
        "client_secret": config.client_secret if hasattr(config, 'client_secret') else None,
        "code": code,
        "redirect_uri": config.redirect_uri,
        "grant_type": "authorization_code",
    }
    
    if token_data["client_secret"] is None:
        del token_data["client_secret"]
    
    try:
        response = requests.post(
            p.token_url,
            data=token_data,
            headers={"Accept": "application/json"},
            timeout=10
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"Token exchange failed: {response.text}"
            )
        
        return response.json()
    
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error communicating with OAuth provider: {str(e)}"
        )


def get_user_info_from_provider(provider: str, access_token: str) -> Dict[str, Any]:
    userinfo_urls = {
        "google": "https://www.googleapis.com/oauth2/v2/userinfo",
        "github": "https://api.github.com/user",
        "discord": "https://discord.com/api/users/@me",
        "microsoft": "https://graph.microsoft.com/v1.0/me",
        "spotify": "https://api.spotify.com/v1/me",
        "trello": "https://api.trello.com/1/members/me",
    }
    
    if provider not in userinfo_urls:
        raise HTTPException(status_code=400, detail=f"Userinfo endpoint not configured for provider: {provider}")
    
    try:
        if provider == "trello":
            from app.core.oauth_config import providers_registry
            registry = providers_registry()
            p = registry.get(provider)
            if p and p.web:
                api_key = p.web.client_id
                response = requests.get(
                    f"{userinfo_urls[provider]}?key={api_key}&token={access_token}",
                    timeout=10
                )
            else:
                raise HTTPException(status_code=400, detail="Trello configuration not found")
        else:
            response = requests.get(
                userinfo_urls[provider],
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10
            )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to get user info: {response.text}"
            )
        
        user_info = response.json()

        if provider == "trello":
            user_info["name"] = user_info.get("fullName") or user_info.get("username")
            user_info["login"] = user_info.get("username")
            if not user_info.get("email"):
                user_info["email"] = f"{user_info.get('username')}@trello.user"
        
        if provider == "github" and not user_info.get("email"):
            try:
                emails_response = requests.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10
                )
                
                if emails_response.status_code == 200:
                    emails = emails_response.json()
                    primary_email = next(
                        (e["email"] for e in emails if e.get("primary") and e.get("verified")),
                        None
                    )
                    if not primary_email:
                        primary_email = next(
                            (e["email"] for e in emails if e.get("verified")),
                            None
                        )
                    if not primary_email and emails:
                        primary_email = emails[0].get("email")
                    
                    if primary_email:
                        user_info["email"] = primary_email
            except Exception as e:
                print(f"Failed to fetch GitHub emails: {e}")
        
        return user_info
    
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting user info: {str(e)}"
        )


def find_or_create_user_from_oauth(
    session: Session,
    provider: str,
    provider_user_id: str,
    user_info: Dict[str, Any],
    token_data: Dict[str, Any]
) -> User:

    statement = select(OAuthConnection).where(
        OAuthConnection.provider == provider,
        OAuthConnection.provider_user_id == provider_user_id
    )
    oauth_conn = session.exec(statement).first()
    
    if oauth_conn:
        oauth_conn.access_token = token_data.get("access_token", "")
        oauth_conn.refresh_token = token_data.get("refresh_token")
        oauth_conn.token_type = token_data.get("token_type", "Bearer")
        
        expires_in = token_data.get("expires_in")
        if expires_in:
            oauth_conn.expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        oauth_conn.updated_at = datetime.utcnow()
        session.add(oauth_conn)
        session.commit()
        
        user_statement = select(User).where(User.id == oauth_conn.user_id)
        user = session.exec(user_statement).first()
        
        if not user:
            raise HTTPException(status_code=500, detail="User not found for OAuth connection")
        
        return user
    
    else:
        email = user_info.get("email", f"{provider_user_id}@{provider}.oauth")
        name = user_info.get("name") or user_info.get("login") or email.split("@")[0]
        
        user_statement = select(User).where(User.email == email)
        existing_user = session.exec(user_statement).first()
        
        if existing_user:
            user = existing_user
        else:
            user = User(
                email=email,
                name=name,
                role="user",
                hashed_password=secrets.token_urlsafe(32),
                image=user_info.get("picture") or user_info.get("avatar_url")
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        expires_in = token_data.get("expires_in")
        expires_at = None
        if expires_in:
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        oauth_connection = OAuthConnection(
            user_id=user.id,
            provider=provider,
            provider_user_id=provider_user_id,
            access_token=token_data.get("access_token", ""),
            refresh_token=token_data.get("refresh_token"),
            token_type=token_data.get("token_type", "Bearer"),
            expires_at=expires_at,
            scope=token_data.get("scope", ""),
            provider_email=user_info.get("email"),
            provider_name=user_info.get("name") or user_info.get("login"),
            provider_picture=user_info.get("picture") or user_info.get("avatar_url")
        )
        session.add(oauth_connection)
        session.commit()
        
        return user
