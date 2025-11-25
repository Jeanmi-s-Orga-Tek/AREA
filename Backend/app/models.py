from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field

class Area(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    message: str
    enabled: bool = True
    interval_minutes: int = 1
    last_triggered_at: Optional[datetime] = None