from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db import SessionDep
from app.reaction import Reaction

timer_router = APIRouter(prefix="/timer", tags=["timer"])

class TimerUpdatePayload(BaseModel):
    mode: str = "interval"
    interval_minutes: Optional[int] = 5
    time_of_day: Optional[str] = "12:00"
    target_action_id: Optional[int] = None

@timer_router.patch("/reaction/{reaction_id}")
def update_timer(
    reaction_id: int,
    payload: TimerUpdatePayload,
    session: SessionDep,
):
    reaction = session.get(Reaction, reaction_id)
    if not reaction:
        raise HTTPException(status_code=404, detail="reaction not found")

    params = reaction.parameters or {}
    params["mode"] = payload.mode
    if payload.interval_minutes is not None:
        params["interval_minutes"] = payload.interval_minutes
    if payload.time_of_day is not None:
        params["time_of_day"] = payload.time_of_day
    params["target_action_id"] = payload.target_action_id

    reaction.parameters = params
    session.add(reaction)
    session.commit()

    session.refresh(reaction)
    return {"id": reaction.id, "parameters": reaction.parameters}
