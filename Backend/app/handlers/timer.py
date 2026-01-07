from typing import Dict, Any, Optional
from datetime import datetime
from sqlmodel import Session
from app.handlers.base import BasePollingHandler, ActionResult
import pytz

class TimerDailyHandler(BasePollingHandler):
    @property
    def service_name(self) -> str:
        return "timer"

    @property
    def action_type(self) -> str:
        return "daily"

    @property
    def polling_interval(self) -> int:
        return 60

    async def parse_payload(self, payload: Dict[str, Any], headers: Dict[str, str] = None) -> ActionResult:
        return ActionResult(triggered=True, event_type="timer_daily", payload=payload)

    async def poll(self, session: Session, user_id: int, params: Dict[str, Any]) -> Optional[ActionResult]:
        time_str = params.get("time")
        timezone_str = params.get("timezone", "Europe/Paris")

        if not time_str:
            return None

        try:
            hour, minute = map(int, time_str.split(":"))

            tz = pytz.timezone(timezone_str)
            now = datetime.now(tz)

            if now.hour == hour and now.minute == minute:
                return ActionResult(
                    triggered=True,
                    event_type="timer_daily",
                    payload={
                        "triggered_at": now.isoformat(),
                        "time": time_str,
                        "timezone": timezone_str,
                    }
                )
        except Exception as e:
            print(f"Error in TimerDailyHandler: {e}")
            return None

        return None

class TimerScheduleHandler(BasePollingHandler):
    @property
    def service_name(self) -> str:
        return "timer"

    @property
    def action_type(self) -> str:
        return "window"

    @property
    def polling_interval(self) -> int:
        return 60

    async def parse_payload(self, payload: Dict[str, Any], headers: Dict[str, str] = None) -> ActionResult:
        return ActionResult(triggered=True, event_type="timer_window", payload=payload)

    async def poll(self, session: Session, user_id: int, params: Dict[str, Any]) -> Optional[ActionResult]:
        start_date_str = params.get("start_date")
        end_date_str = params.get("end_date")
        time_str = params.get("time")
        timezone_str = params.get("timezone", "Europe/Paris")

        if not all([start_date_str, end_date_str, time_str]):
            return None

        try:
            hour, minute = map(int, time_str.split(":"))

            tz = pytz.timezone(timezone_str)
            now = datetime.now(tz)

            start_day, start_month, start_year = map(int, start_date_str.split("/"))
            end_day, end_month, end_year = map(int, end_date_str.split("/"))

            start_date = datetime(start_year, start_month, start_day, tzinfo=tz)
            end_date = datetime(end_year, end_month, end_day, 23, 59, 59, tzinfo=tz)

            if not (start_date <= now <= end_date):
                return None

            if now.hour == hour and now.minute == minute:
                return ActionResult(
                    triggered=True,
                    event_type="timer_window",
                    payload={
                        "triggered_at": now.isoformat(),
                        "time": time_str,
                        "timezone": timezone_str,
                        "start_date": start_date_str,
                        "end_date": end_date_str,
                    }
                )
        except Exception as e:
            print(f"Error in TimerScheduleHandler: {e}")
            return None

        return None

TIMER_HANDLERS = {
    "daily": TimerDailyHandler(),
    "window": TimerScheduleHandler(),
}

TIMER_EVENT_MAP = {
    "timer_daily": [TIMER_HANDLERS["daily"]],
    "timer_window": [TIMER_HANDLERS["window"]],
}
