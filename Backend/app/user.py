import os
from datetime import timedelta, datetime, timezone
from typing import Any, Dict, List, Optional, Union, cast
import jwt
from fastapi import HTTPException, status
from fastapi.security import OAuth2, OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel, create_engine, select
from starlette.requests import Request
import starlette.status
from fastapi.security.utils import get_authorization_scheme_param
from fastapi.responses import HTMLResponse

SECRET_KEY = str(os.environ.get("SECRET_KEY"))
ALGORITHM = str(os.environ.get("ALGORITHM"))
ACCESS_TOKEN_EXPIRE_MINUTES = int(str(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES")))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class Token(BaseModel):
    access_token: str
    token_type: str

class EmailCheck(BaseModel):
    email: str

class PasswordChange(BaseModel):
    email: str
    new_password: str

class BaseUser(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True)
    name: str
    role: str
    founder_id: Optional[int] = None
    investor_id: Optional[int] = None

class RegisteringUser(BaseUser):
    new_password: str

class User(BaseUser, table=True):
    image: Optional[str] = None
    hashed_password: str

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

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

def get_user_from_token(token: str, session):
    if token == "":
        return None
    cred_except = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="error with credentials",
        headers={"Authorization": "Bearer"}
    )
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = decoded_token.get("sub")
        if username is None:
            raise cred_except
    except jwt.InvalidTokenError:
        raise cred_except
    stat = select(User).where(User.email == username)
    user_found = session.exec(stat)
    user = user_found.first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="no user with that username / email found",
            headers={"Authorization": "Bearer"}
        )
    return user

def auth_user(user: User, username: str, password: str):
    if verify_password(password, User.hashed_password):
        return User
    return False
    
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
