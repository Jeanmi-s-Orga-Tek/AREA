import os
import bcrypt
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.security import OAuth2, OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Annotated, Any, Dict, List, Optional, Union, cast
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from starlette.requests import Request
from fastapi.security.utils import get_authorization_scheme_param
from datetime import timedelta, datetime, timezone
from passlib.context import CryptContext
import jwt

SECRET_KEY = str(os.environ.get("SECRET_KEY"))
ALGORITHM = str(os.environ.get("ALGORITHM"))
ACCESS_TOKEN_EXPIRE_MINUTES = int(str(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES")))

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )

def get_password_hash(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def create_access_token(data: dict, expires: timedelta):
    now = datetime.now(timezone.utc)
    expiration_date = now + expires
    data["exp"] = expiration_date
    data["iat"] = now
    jwt_token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    return jwt_token

def verify_token(token: str):
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded_token
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"Authorization": "Bearer"}
        )

class OAuth2PasswordBearerWithCookie(OAuth2):
    def __init__(
        self,
        tokenUrl: str,
        scheme_name: Optional[str] = None,
        scopes: Optional[Dict[str, str]] = None,
        auto_error: bool = True,
    ):
        if not scopes:
            scopes = {}
        flows = OAuthFlowsModel(password=cast(
                Any,
                {
                    "tokenUrl": tokenUrl,
                    "scopes": scopes,
                },
            ))
        super().__init__(flows=flows, scheme_name=scheme_name, auto_error=auto_error)
    
    async def __call__(self, request: Request) -> Optional[str]:
        cookie = request.cookies.get('Authorization')
        authorization = f"Bearer {cookie}"
        scheme, param = get_authorization_scheme_param(authorization)
        if not cookie or scheme.lower() != "bearer" or not verify_token(cookie):
            if self.auto_error:
                # raise HTTPException(
                #     status_code=status.HTTP_401_UNAUTHORIZED,
                #     detail="Not authenticated",
                #     headers={"WWW-Authenticate": "Bearer"},
                # )
                return ""
            else:
                return None
        return param

oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="login")
