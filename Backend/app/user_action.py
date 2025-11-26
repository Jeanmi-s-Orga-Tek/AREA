from datetime import timedelta
from typing import Annotated, Any, Dict, List, Optional, Union, cast
import jwt
from fastapi import APIRouter, Depends, Form, HTTPException, Query, status
from fastapi.security import OAuth2, OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel, create_engine, select
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.dialects.postgresql import JSONB

from app.db import SessionDep
from app.oauth2 import oauth2_scheme
from app.user import get_user_from_token
from app.action import Action, BaseAction

class UserAction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    linked_base_action: Optional[int] = Field(foreign_key="action.id")
    hook_url: Optional[str] = Field(default=None)
    parameters: Optional[dict] = Field(sa_type=JSONB)

class UserActionCreate(BaseModel):
    linked_base_action: int
    parameters: Optional[dict] = None

user_action_router = APIRouter(
    prefix="/user/action",
    tags=["user_actions"],
    responses={404: {"description": "Not found"}},
)

@user_action_router.get("/", response_model=List[BaseAction], tags=["user_actions"])
def read_actions(
    session: SessionDep,
    skip: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
    token: str = Depends(oauth2_scheme),
    ):
    user = get_user_from_token(token, session)
    if user is None or user.id is None:
        raise HTTPException(status_code=400, detail="User ID is missing")
    actions = session.exec(select(UserAction).where(UserAction.user_id == user.id).offset(skip).limit(limit)).all()
    linked_actions = []
    for user_action in actions:
        base_action = session.get(Action, user_action.linked_base_action)
        if base_action:
            base_action.id = user_action.id
            base_action.parameters = user_action.parameters
            linked_actions.append(base_action)
    return linked_actions

@user_action_router.get("/{action_id}", response_model=BaseAction, tags=["user_actions"])
def read_action(
    action_id: int,
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    ):
    user = get_user_from_token(token, session)
    if user is None or user.id is None:
        raise HTTPException(status_code=400, detail="User ID is missing")
    action = session.get(UserAction, action_id)
    if not action or action.user_id != user.id:
        raise HTTPException(status_code=404, detail="action not found or not authorized")
    linked_action = session.get(Action, action.linked_base_action)
    if not linked_action:
        raise HTTPException(status_code=404, detail="linked action not found or not authorized")
    linked_action.id = action.id
    linked_action.parameters = action.parameters
    return linked_action

@user_action_router.delete("/{action_id}", tags=["user_actions"])
def delete_action(
    action_id: int,
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    ):
    user = get_user_from_token(token, session)
    if user is None or user.id is None:
        raise HTTPException(status_code=400, detail="User ID is missing")
    action = session.get(UserAction, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="action not found")
    if action.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this action")
    session.delete(action)
    session.commit()
    return "ok :D"

@user_action_router.patch("/{action_id}", response_model=BaseAction, tags=["user_actions"])
def update_action(
    action_id: int,
    event: UserAction,
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    ):
    user = get_user_from_token(token, session)
    if user is None or user.id is None:
        raise HTTPException(status_code=400, detail="User ID is missing")
    action_db = session.get(UserAction, action_id)
    if not action_db or action_db.user_id != user.id:
        raise HTTPException(status_code=404, detail="action not found or not authorized")
    event_data = event.model_dump(exclude_unset=True)
    action_db.sqlmodel_update(event_data)
    session.add(action_db)
    session.commit()
    session.refresh(action_db)
    return action_db

@user_action_router.post("/", response_model=UserAction)
def post_action(
    action: UserActionCreate,
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    ):
    user = get_user_from_token(token, session)
    if user is None or user.id is None:
        raise HTTPException(status_code=400, detail="User ID is missing")
    base_action = session.get(Action, action.linked_base_action)
    if not base_action:
        raise HTTPException(status_code=400, detail="linked_base_action does not exist")
    db_action = UserAction(
        user_id=user.id,
        linked_base_action=action.linked_base_action,
        parameters=action.parameters
    )
    session.add(db_action)
    session.commit()
    session.refresh(db_action)
    return db_action
