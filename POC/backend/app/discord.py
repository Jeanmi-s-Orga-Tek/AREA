from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class DiscordMessageBase(SQLModel):
    name: str = Field(index=True)
    webhookUrl: str
    message: str
    interval_minutes: int = Field(ge=1)
    enabled: bool = Field(default=True)


class DiscordMessage(DiscordMessageBase, table=True):
    __tablename__ = "discord_message"

    id: Optional[int] = Field(default=None, primary_key=True)
    last_triggered_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DiscordMessageCreate(DiscordMessageBase):
    pass


class DiscordMessageRead(DiscordMessageBase):
    id: int
    created_at: datetime
    last_triggered_at: Optional[datetime] = None