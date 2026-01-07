from typing import Any, Dict, TYPE_CHECKING
import asyncio
from sqlmodel import Session
from fastapi import HTTPException

if TYPE_CHECKING:
    from app.executors.base import BaseExecutor

class TimerDelayExecutor:
    """Execute a delay (wait) before continuing - useful for chaining reactions"""
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        delay_seconds = parameters.get("delay_seconds", 0)

        if not isinstance(delay_seconds, (int, float)) or delay_seconds < 0:
            raise HTTPException(
                status_code=400,
                detail="Invalid delay_seconds: must be a positive number"
            )

        if delay_seconds > 3600:
            raise HTTPException(
                status_code=400,
                detail="Delay too long: maximum is 3600 seconds (1 hour)"
            )

        print(f"Timer delay: waiting {delay_seconds} seconds...")
        await asyncio.sleep(delay_seconds)
        print(f"Timer delay: completed")
        return True

class TimerWaitUntilExecutor:
    """Wait until a specific time before continuing"""
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        from datetime import datetime
        import pytz

        time_str = parameters.get("time")
        timezone_str = parameters.get("timezone", "Europe/Paris")

        if not time_str:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameter: time (format: HH:MM)"
            )

        try:
            hour, minute = map(int, time_str.split(":"))

            tz = pytz.timezone(timezone_str)
            now = datetime.now(tz)

            target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)

            if target <= now:
                from datetime import timedelta
                target = target + timedelta(days=1)

            wait_seconds = (target - now).total_seconds()

            if wait_seconds > 86400:
                raise HTTPException(
                    status_code=400,
                    detail="Wait time exceeds 24 hours"
                )

            print(f"Timer wait_until: waiting until {time_str} ({wait_seconds:.0f} seconds)...")
            await asyncio.sleep(wait_seconds)
            print(f"Timer wait_until: completed at {time_str}")
            return True

        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid time format. Use HH:MM (24-hour format)"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error in wait_until: {str(e)}"
            )

