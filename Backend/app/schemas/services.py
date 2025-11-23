# /*
# ** EPITECH PROJECT, 2025
# ** AREA
# ** File description:
# ** services.py
# */

from typing import Optional

from sqlmodel import SQLModel


class ServiceRead(SQLModel):
    id: int
    name: str
    description: str
    icon_url: Optional[str] = None
    requires_oauth: bool
