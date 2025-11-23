# /*
# ** EPITECH PROJECT, 2025
# ** AREA
# ** File description:
# ** services.py
# */

from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class Service(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str
    icon_url: Optional[str] = None
    requires_oauth: bool = False
    is_active: bool = True


class ServiceAction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    service_id: int = Field(foreign_key="service.id", index=True)
    name: str
    description: str
    technical_key: str
    is_active: bool = True


class ServiceReaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    service_id: int = Field(foreign_key="service.id", index=True)
    name: str
    description: str
    technical_key: str
    is_active: bool = True


class UserServiceSubscription(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    service_id: int = Field(index=True, foreign_key="service.id")
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    oauth_data: Optional[str] = None


class Area(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    action_service_id: int = Field(foreign_key="service.id")
    action_id: int = Field(foreign_key="serviceaction.id")
    reaction_service_id: int = Field(foreign_key="service.id")
    reaction_id: int = Field(foreign_key="servicereaction.id")
    params_action: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    params_reaction: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
