from datetime import timedelta
from typing import Annotated, Any, Dict, List, Optional, Union, cast
import jwt
from fastapi import APIRouter, Depends, Form, HTTPException, Query, status
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel, create_engine, select
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.dialects.postgresql import JSONB

from app.db import SessionDep
from app.oauth2 import oauth2_scheme
from app.user import get_user_from_token
from app.reaction import BaseReaction, Reaction

class UserReaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    api_endpoint_url: Optional[str] = Field(default=None)
    linked_action: Optional[int] = Field(default=None, foreign_key="action.id")
    linked_base_reaction: Optional[int] = Field(foreign_key="reaction.id")
    parameters: Optional[dict] = Field(sa_type=JSONB)

class UserReactionCreate(BaseModel):
    api_endpoint_url: Optional[str] = None
    linked_action: Optional[int] = Field(default=None)
    linked_base_reaction: int
    parameters: Optional[dict] = None

user_reaction_router = APIRouter(
    prefix="/user/reaction",
    tags=["user_reactions"],
    responses={404: {"description": "Not found"}},
)

@user_reaction_router.get("/", response_model=List[BaseReaction], tags=["user_reactions"])
def read_reactions(
    session: SessionDep,
    skip: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
    token: str = Depends(oauth2_scheme),
    ):
    user = get_user_from_token(token, session)
    if user is None or user.id is None:
        raise HTTPException(status_code=400, detail="User ID is missing")
    reactions = session.exec(select(UserReaction).where(UserReaction.user_id == user.id).offset(skip).limit(limit)).all()
    linked_actions = []
    for user_reaction in reactions:
        base_action = session.get(Reaction, user_reaction.linked_base_reaction)
        if base_action:
            base_action.id = user_reaction.id
            base_action.parameters = user_reaction.parameters
            linked_actions.append(base_action)
    return linked_actions

@user_reaction_router.get("/{reaction_id}", response_model=BaseReaction, tags=["user_reactions"])
def read_reaction(
    reaction_id: int,
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    ):
    user = get_user_from_token(token, session)
    if user is None or user.id is None:
        raise HTTPException(status_code=400, detail="User ID is missing")
    reaction = session.get(UserReaction, reaction_id)
    if not reaction or reaction.user_id != user.id:
        raise HTTPException(status_code=404, detail="reaction not found or not authorized")
    linked_reaction = session.get(Reaction, reaction.linked_base_reaction)
    if not linked_reaction:
        raise HTTPException(status_code=404, detail="linked action not found or not authorized")
    linked_reaction.id = reaction.id
    linked_reaction.parameters = reaction.parameters
    return linked_reaction

@user_reaction_router.delete("/{reaction_id}", tags=["user_reactions"])
def delete_reaction(
    reaction_id: int,
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    ):
    user = get_user_from_token(token, session)
    if user is None or user.id is None:
        raise HTTPException(status_code=400, detail="User ID is missing")
    reaction = session.get(UserReaction, reaction_id)
    if not reaction:
        raise HTTPException(status_code=404, detail="reaction not found")
    if reaction.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this reaction")
    session.delete(reaction)
    session.commit()
    return "ok :D"

@user_reaction_router.patch("/{reaction_id}", response_model=BaseReaction, tags=["user_reactions"])
def update_reaction(
    reaction_id: int,
    event: UserReaction,
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    ):
    user = get_user_from_token(token, session)
    if user is None or user.id is None:
        raise HTTPException(status_code=400, detail="User ID is missing")
    reaction_db = session.get(UserReaction, reaction_id)
    if not reaction_db or reaction_db.user_id != user.id:
        raise HTTPException(status_code=404, detail="reaction not found or not authorized")
    event_data = event.model_dump(exclude_unset=True)
    reaction_db.sqlmodel_update(event_data)
    session.add(reaction_db)
    session.commit()
    session.refresh(reaction_db)
    return reaction_db

@user_reaction_router.post("/", response_model=UserReaction)
def post_reaction(
    reaction: UserReactionCreate,
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    ):
    user = get_user_from_token(token, session)
    if user is None or user.id is None:
        raise HTTPException(status_code=400, detail="User ID is missing")
    base_reaction = session.get(Reaction, reaction.linked_base_reaction)
    if not base_reaction:
        raise HTTPException(status_code=400, detail="linked_base_reaction does not exist")
    db_reaction = UserReaction(
        user_id=user.id,
        api_endpoint_url=reaction.api_endpoint_url,
        linked_action=reaction.linked_action,
        linked_base_reaction=reaction.linked_base_reaction,
        parameters=reaction.parameters
    )
    session.add(db_reaction)
    session.commit()
    session.refresh(db_reaction)
    return db_reaction
