from typing import Optional, List
import os

import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlmodel import SQLModel, Field, Session, select

from .db import get_session


discord_router = APIRouter(prefix="/discord", tags=["discord"])


class DiscordMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    webhook_url: str
    content: str


class DiscordMessageCreate(SQLModel):
    webhook_url: str
    content: str


class DiscordMessageRead(SQLModel):
    id: int
    webhook_url: str
    content: str


class DiscordFrontPayload(BaseModel):
    webhookUrl: str
    message: str


@discord_router.get("/messages", response_model=List[DiscordMessageRead])
def list_messages(session: Session = Depends(get_session)):
    statement = select(DiscordMessage).order_by(DiscordMessage.id)
    return session.exec(statement).all()


@discord_router.post("/messages", response_model=DiscordMessageRead)
def create_message(
    payload: DiscordMessageCreate, session: Session = Depends(get_session)
):
    obj = DiscordMessage.model_validate(payload)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


@discord_router.post("/front-payload")
async def handle_front_payload(payload: DiscordFrontPayload):
    """Endpoint called directly by the POC frontend to send a Discord message immediately.

    It forwards the payload to the shared send_discord_message helper, which actually
    performs the HTTP POST to the Discord webhook URL.
    """
    webhook_url = payload.webhookUrl or os.environ.get("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        raise HTTPException(status_code=400, detail="No webhook URL provided")

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(
                webhook_url,
                json={"content": payload.message},
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=str(exc))

    return {"status": "ok"}
