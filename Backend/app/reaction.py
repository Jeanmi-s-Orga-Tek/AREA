from datetime import timedelta
from typing import Annotated, Any, Dict, List, Optional, Union, cast
import jwt
from fastapi import APIRouter, Depends, Form, HTTPException, Query, status
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from sqlmodel import Field, Session, SQLModel, create_engine, select
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.dialects.postgresql import JSONB

from app.main import SessionDep
from app.oauth2 import oauth2_scheme

class BaseReaction(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = Field(default=None)
    parameters: Optional[dict] = Field(sa_type=JSONB)

class Reaction(BaseReaction, table=True):
    api_endpoint_url: Optional[str] = Field(default=None)

reaction_router = APIRouter(
    prefix="/reaction",
    tags=["reactions"],
    responses={404: {"description": "Not found"}},
)

@reaction_router.get("/", response_model=List[BaseReaction], tags=["reactions"])
def read_reactions(
    session: SessionDep,
    skip: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
    token: str = Depends(oauth2_scheme),
    ):
    reaction = session.exec(select(Reaction).offset(skip).limit(limit)).all()
    return reaction

@reaction_router.get("/{reaction_id}", response_model=BaseReaction, tags=["reactions"])
def read_reaction(
    reaction_id: int,
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    ):
    reaction = session.get(Reaction, reaction_id)
    if not reaction:
        raise HTTPException(status_code=404, detail="reaction not found")
    return reaction

@reaction_router.delete("/{reaction_id}", tags=["reactions"])
def delete_reaction(
    reaction_id: int,
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    ):
    reaction = session.get(Reaction, reaction_id)
    if not reaction:
        raise HTTPException(status_code=404, detail="reaction not found")
    session.delete(reaction)
    session.commit()
    return "ok :D"

@reaction_router.patch("/{reaction_id}", response_model=BaseReaction, tags=["reactions"])
def update_reaction(
    reaction_id: int,
    event: BaseReaction,
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    ):
    reaction_db = session.get(Reaction, reaction_id)
    if not reaction_db:
        raise HTTPException(status_code=404, detail="reaction not found")
    event_data = event.model_dump(exclude_unset=True)
    reaction_db.sqlmodel_update(event_data)
    session.add(reaction_db)
    session.commit()
    session.refresh(reaction_db)
    return reaction_db

@reaction_router.post("/")
def post_reaction(
    reaction: BaseReaction,
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    ):
    db_reaction = Reaction.model_validate(reaction)
    session.add(db_reaction)
    session.commit()
    session.refresh(db_reaction)
    return db_reaction
