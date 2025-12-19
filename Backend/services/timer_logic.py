from datetime import datetime, time, date, timedelta, timezone
from typing import Any, Dict, Optional

from zoneinfo import ZoneInfo

from app.schemas.timer import TimerIntervalConfig, TimerFixedTimeConfig

TIMER_ACTION_ALIASES = {
    "every_x_minutes": "every_x_minutes",
    "timer - every x minutes": "every_x_minutes",
    "timer_every_x_minutes": "every_x_minutes",
    "timer every x minutes": "every_x_minutes",
    "at_specific_time": "at_specific_time",
    "timer - at specific time": "at_specific_time",
    "timer_at_specific_time": "at_specific_time",
    "timer at specific time": "at_specific_time",
}


def resolve_timer_action_identifier(action_identifier: Any) -> str:
    if isinstance(action_identifier, str):
        normalized = action_identifier.strip().lower()
        if normalized in TIMER_ACTION_ALIASES:
            return TIMER_ACTION_ALIASES[normalized]
    raise ValueError(f"Unknown timer action identifier: {action_identifier}")


def build_timer_schedule(action_id: str, raw_params: Dict[str, Any]) -> Dict[str, Any]:
    timer_params = raw_params.get("timer", raw_params)

    stored_schedule: Optional[Dict[str, Any]] = None
    if isinstance(timer_params, dict):
        stored_schedule = timer_params.get("schedule")
        stored_type = timer_params.get("type")
        if isinstance(stored_schedule, dict) and stored_schedule.get("type"):
            return stored_schedule
        if stored_type:
            return timer_params

    canonical_id = resolve_timer_action_identifier(action_id)

    if canonical_id == "every_x_minutes":
        cfg = TimerIntervalConfig(
            every_minutes=int(timer_params["every_minutes"]),
            timezone=timer_params.get("timezone", "UTC"),
        )
        return cfg.dict()

    if canonical_id == "at_specific_time":
        cfg = TimerFixedTimeConfig(
            at_time=time.fromisoformat(timer_params["at_time"]),
            timezone=timer_params.get("timezone", "UTC"),
            start_date=(
                date.fromisoformat(timer_params["start_date"])
                if timer_params.get("start_date")
                else None
            ),
            end_date=(
                date.fromisoformat(timer_params["end_date"])
                if timer_params.get("end_date")
                else None
            ),
        )
        return cfg.dict()

    raise ValueError(f"Unknown timer action identifier: {action_id}")


def compute_initial_next_run(schedule: Dict[str, Any], now: datetime) -> datetime:
    if schedule["type"] == "interval":
        minutes = int(schedule["every_minutes"])
        tz = ZoneInfo(schedule.get("timezone", "UTC"))
        now_local = now.astimezone(tz)
        next_local = now_local + timedelta(minutes=minutes)
        return next_local.astimezone(timezone.utc)

    if schedule["type"] == "fixed_time":
        tz = ZoneInfo(schedule.get("timezone", "UTC"))
        at_time_val = schedule["at_time"]
        if isinstance(at_time_val, str):
            at_time_val = time.fromisoformat(at_time_val)

        now_local = now.astimezone(tz)
        today_run = datetime.combine(now_local.date(), at_time_val, tzinfo=tz)

        start_date = schedule.get("start_date")
        end_date = schedule.get("end_date")

        if isinstance(start_date, str):
            start_date = date.fromisoformat(start_date)
        if isinstance(end_date, str):
            end_date = date.fromisoformat(end_date)

        candidate = today_run
        if start_date and candidate.date() < start_date:
            candidate = datetime.combine(start_date, at_time_val, tzinfo=tz)

        if candidate <= now_local:
            candidate = candidate + timedelta(days=1)

        if end_date and candidate.date() > end_date:
            return now

        return candidate.astimezone(timezone.utc)

    raise ValueError(f"Unknown schedule type: {schedule.get('type')}")
