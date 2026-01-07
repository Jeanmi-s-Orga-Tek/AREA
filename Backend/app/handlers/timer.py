from typing import Dict, Any
from app.handlers.base import BaseActionHandler, ActionResult
from app.timer_scheduler import schedule_daily_area, schedule_window_area

class TimerDailyHandler(BaseActionHandler):
    service_name: str = "Timer"
    action_type: str = "timer_daily"

    async def parse_payload(self, payload: Dict[str, Any], headers: Dict[str, str] = None) -> ActionResult:
        return ActionResult(triggered=True, event_type="timer_daily", payload=payload)

    async def handle(self, session, user_id: int, params: Dict[str, Any]) -> ActionResult:
        area_id = params.get("area_id")
        time = params.get("time")
        tz = params.get("timezone", "Europe/Paris")
        if area_id is None or time is None:
            return ActionResult(triggered=False, event_type="timer_daily", payload={}, error="Missing area_id or time")
        schedule_daily_area(area_id, time, timezone=tz)
        return ActionResult(triggered=True, event_type="timer_daily", payload={"scheduled": True})

class TimerScheduleHandler(BaseActionHandler):
    service_name: str = "Timer"
    action_type: str = "timer_schedule"

    async def parse_payload(self, payload: Dict[str, Any], headers: Dict[str, str] = None) -> ActionResult:
        return ActionResult(triggered=True, event_type="timer_schedule", payload=payload)

    async def handle(self, session, user_id: int, params: Dict[str, Any]) -> ActionResult:
        area_id = params.get("area_id")
        start = params.get("start_date")
        end = params.get("end_date")
        time = params.get("time")
        tz = params.get("timezone", "Europe/Paris")
        if area_id is None or start is None or end is None or time is None:
            return ActionResult(triggered=False, event_type="timer_schedule", payload={}, error="Missing date/time fields or area_id")
        schedule_window_area(area_id, start, end, time, timezone=tz)
        return ActionResult(triggered=True, event_type="timer_schedule", payload={"scheduled": True})

TIMER_HANDLERS = {
    "timer_daily": TimerDailyHandler(),
    "timer_schedule": TimerScheduleHandler(),
}

TIMER_EVENT_MAP = {
    "timer_daily": [TIMER_HANDLERS["timer_daily"]],
    "timer_schedule": [TIMER_HANDLERS["timer_schedule"]],
}
