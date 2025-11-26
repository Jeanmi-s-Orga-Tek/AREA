from datetime import timedelta
from typing import Annotated, Any, Dict, List, Optional, Union, cast
import jwt
from fastapi import APIRouter, Form, HTTPException, Query, status, Depends
from fastapi.security import OAuth2, OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel, create_engine, select
from fastapi.responses import HTMLResponse, JSONResponse

from app.db import SessionDep
from app.oauth2 import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, get_password_hash, verify_password, SECRET_KEY, ALGORITHM, oauth2_scheme

user_router = APIRouter(
    prefix="/user",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

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

class RegisteringUser(BaseUser):
    new_password: str

class User(BaseUser, table=True):
    image: Optional[str] = None
    role: str = Field(default="user")
    hashed_password: str

def auth_user(user: User, username: str, password: str):
    if verify_password(password, User.hashed_password):
        return User
    return False

def get_user_from_token(token: str, session) -> Optional[User]:
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

@user_router.get("/", response_model=List[BaseUser], tags=["users"])
def read_users(
    session: SessionDep,
    skip: int = 0,
    limit: Annotated[int, Query(le=100)] = 100
    ):
    user = session.exec(select(User).offset(skip).limit(limit)).all()
    return user

@user_router.get("/me", response_model=BaseUser, tags=["users"])
def get_me(session: SessionDep, token: str = Depends(oauth2_scheme)):
    user = get_user_from_token(token, session)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@user_router.get("/{user_id}", response_model=BaseUser, tags=["users"])
def read_user(
    user_id: int,
    session: SessionDep
    ):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@user_router.delete("/{user_id}", tags=["users"])
def delete_user(
    user_id: int,
    session: SessionDep
    ):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return "ok :D"

@user_router.patch("/{user_id}", response_model=BaseUser, tags=["users"])
def update_user(
    user_id: int,
    event: BaseUser,
    session: SessionDep
    ):
    user_db = session.get(User, user_id)
    if not user_db:
        raise HTTPException(status_code=404, detail="User not found")
    event_data = event.model_dump(exclude_unset=True)
    user_db.sqlmodel_update(event_data)
    session.add(user_db)
    session.commit()
    session.refresh(user_db)
    return user_db

@user_router.post("/register", tags=["users"])
def register(user: RegisteringUser,
            session: SessionDep,
            # user_image: Optional[UploadFile] = None
            ):
    stat = select(User).where(User.email == user.email)
    user_found = session.exec(stat)
    search_user = user_found.first()
    if search_user is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="user with this email already exists",
            headers={"Authorization": "Bearer"}
        )

    new_user = User(
        email=user.email,
        name=user.name,
        image=None,
        hashed_password = get_password_hash(user.new_password)
    )

    # if user_image is str:
    #     if not upload_img(USERS_IMG_PATH, new_user.email, user_image):
    #         raise HTTPException(
    #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #             detail="user image couldn't save :(",
    #             headers={"Authorization": "Bearer"}
    #         )
    #     new_user.image = f"{USERS_IMG_PATH}{new_user.email}"

    session.add(new_user)
    session.commit()
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token({"sub": new_user.email}, access_token_expires)
    token = Token(access_token=access_token, token_type="bearer")
    response = JSONResponse(content={"status":"login success"})
    response.set_cookie(key="Authorization", value=token.access_token)
    return response

@user_router.post("/login", tags=["users"])
def login(session: SessionDep, username: Annotated[str, Form()], password: Annotated[str, Form()]):
    stat = select(User).where(User.email == username)
    user_found = session.exec(stat)
    user = user_found.first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="no user with that username / email found",
            headers={"Authorization": "Bearer"}
        )
    # user = user_found.one()
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="wrong password",
            headers={"Authorization": "Bearer"}
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token({"sub": user.email}, access_token_expires)
    token = Token(access_token=access_token, token_type="bearer")
    
    if user.id is None:
        raise HTTPException(status_code=400, detail="User ID is missing")

    response = JSONResponse(content={"status":"login success"})
    token = Token(access_token=access_token, token_type="Bearer")
    response = JSONResponse(content={"access_token": access_token, "token_type": "Bearer"})
    response.set_cookie(key="Authorization", value=token.access_token)
    return response
