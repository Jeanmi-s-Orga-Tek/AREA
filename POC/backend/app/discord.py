from typing import Optional, List

from fastapi import APIRouter
from sqlmodel import SQLModel, Field

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


@discord_router.get("/messages", response_model=List[DiscordMessageRead])
def list_messages():
    return []
