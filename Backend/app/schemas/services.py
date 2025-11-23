# /*
# ** EPITECH PROJECT, 2025
# ** AREA
# ** File description:
# ** services.py
# */

from datetime import datetime
from typing import List, Optional

from sqlmodel import SQLModel


class ServiceRead(SQLModel):
    id: int
    name: str
    description: str
    icon_url: Optional[str] = None
    requires_oauth: bool


class SubscriptionRead(SQLModel):
    service_id: int
    user_id: int
    status: str
    created_at: datetime


class ServiceActionRead(SQLModel):
    id: int
    name: str
    description: str
    technical_key: str


class ServiceReactionRead(SQLModel):
    id: int
    name: str
    description: str
    technical_key: str


class ServiceCapabilitiesRead(SQLModel):
    service: ServiceRead
    actions: List[ServiceActionRead]
    reactions: List[ServiceReactionRead]
