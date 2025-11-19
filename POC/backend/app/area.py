from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class AreaBase(SQLModel):
    """Base model pour les AREA"""
    name: str = Field(index=True)
    interval_minutes: int = Field(ge=1)
    message: str
    enabled: bool = Field(default=True)


class Area(AreaBase, table=True):
    __tablename__ = "area"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    last_triggered_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AreaCreate(AreaBase):
    """
    Schema Pydantic pour créer une AREA (body du POST /areas).
    
    Exemple JSON:
    {
        "name": "demo timer",
        "interval_minutes": 2,
        "message": "AREA POC OK"
    }
    """
    pass


class AreaRead(AreaBase):
    id: int
    created_at: datetime
    last_triggered_at: Optional[datetime] = None
