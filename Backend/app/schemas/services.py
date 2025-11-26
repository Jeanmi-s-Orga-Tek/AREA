# /*
# ** EPITECH PROJECT, 2025
# ** AREA
# ** File description:
# ** services.py
# */

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlmodel import Field, SQLModel


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


class AreaBase(SQLModel):
    action_service_id: int
    action_id: int
    reaction_service_id: int
    reaction_id: int
    params_action: Dict[str, Any] = Field(default_factory=dict)
    params_reaction: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True


class AreaCreate(AreaBase):
    pass


class AreaRead(AreaBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
