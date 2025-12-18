from datetime import date, time
from typing import Optional, Literal

from pydantic import BaseModel, Field, validator


class TimerIntervalConfig(BaseModel):
    type: Literal["interval"] = "interval"
    every_minutes: int = Field(..., gt=0)
    timezone: Optional[str] = Field(default="UTC")

    @validator("timezone")
    def validate_timezone(cls, value: Optional[str]) -> str:
        return value or "UTC"


class TimerFixedTimeConfig(BaseModel):
    type: Literal["fixed_time"] = "fixed_time"
    at_time: time
    timezone: str = Field(default="UTC")
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @validator("timezone")
    def validate_timezone(cls, value: str) -> str:
        return value or "UTC"

    @validator("end_date")
    def validate_date_range(cls, end: Optional[date], values: dict) -> Optional[date]:
        start = values.get("start_date")
        if start and end and end < start:
            raise ValueError("end_date must be >= start_date")
        return end
