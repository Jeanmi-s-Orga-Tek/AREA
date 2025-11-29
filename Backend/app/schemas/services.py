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


class AreaCreate(SQLModel):
    name: Optional[str] = None
    action_service_id: int
    action_id: int
    action_parameters: Dict[str, Any] = Field(default_factory=dict)
    reaction_service_id: int
    reaction_id: int
    reaction_parameters: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True


class AreaRead(AreaBase):
    id: int
    user_id: int
    name: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ActionRead(SQLModel):
    id: int
    name: str
    description: Optional[str] = None
    is_polling: bool = False
    service_id: int


class ReactionRead(SQLModel):
    id: int
    name: str
    description: Optional[str] = None
    url: Optional[str] = None
    service_id: int


class ServiceBasicRead(SQLModel):
    id: int
    name: str
    display_name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None


class AreaActionDetail(SQLModel):
    service: ServiceBasicRead
    action: ActionRead


class AreaReactionDetail(SQLModel):
    service: ServiceBasicRead
    reaction: ReactionRead


class AreaDetailRead(SQLModel):
    id: int
    name: str
    action: AreaActionDetail
    reaction: AreaReactionDetail
    is_active: bool
    created_at: datetime
    updated_at: datetime
