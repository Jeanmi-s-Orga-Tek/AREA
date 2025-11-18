from datetime import timedelta
from typing import Annotated, Any, Dict, List, Optional, Union, cast
import jwt
from fastapi import APIRouter, Form, HTTPException, Query, status
from fastapi.security import OAuth2, OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel, create_engine, select
from fastapi.responses import HTMLResponse, JSONResponse

from app.main import SessionDep

class BaseAction(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = Field(default=None)

class Action(BaseAction, table=True):
    linked_reaction: Optional[int] = Field(default=None, foreign_key="reaction.id")
    hook_url: Optional[str] = Field(default=None)

action_router = APIRouter(
    prefix="/action",
    tags=["actions"],
    responses={404: {"description": "Not found"}},
)

@action_router.get("/", response_model=List[BaseAction], tags=["actions"])
def read_actions(
    session: SessionDep,
    skip: int = 0,
    limit: Annotated[int, Query(le=100)] = 100
    ):
    action = session.exec(select(Action).offset(skip).limit(limit)).all()
    return action

@action_router.get("/{action_id}", response_model=BaseAction, tags=["actions"])
def read_action(
    action_id: int,
    session: SessionDep
    ):
    action = session.get(Action, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="action not found")
    return action

@action_router.delete("/{action_id}", tags=["actions"])
def delete_action(
    action_id: int,
    session: SessionDep
    ):
    action = session.get(Action, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="action not found")
    session.delete(action)
    session.commit()
    return "ok :D"

@action_router.patch("/{action_id}", response_model=BaseAction, tags=["actions"])
def update_action(
    action_id: int,
    event: BaseAction,
    session: SessionDep
    ):
    action_db = session.get(Action, action_id)
    if not action_db:
        raise HTTPException(status_code=404, detail="action not found")
    event_data = event.model_dump(exclude_unset=True)
    action_db.sqlmodel_update(event_data)
    session.add(action_db)
    session.commit()
    session.refresh(action_db)
    return action_db

@action_router.post("/")
def post_action(
    action: BaseAction,
    session: SessionDep,
    ):
    db_action = Action.model_validate(action)
    session.add(db_action)
    session.commit()
    session.refresh(db_action)
    return db_action
