from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlmodel import Session

from .base import BaseExecutor
from ..services.timer_logic import build_timer_schedule, compute_initial_next_run


class TimerExecutor(BaseExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session,) -> bool:
        timer_cfg: Optional[Dict[str, Any]] = parameters.get("timer")
        action_id: Optional[str] = parameters.get("action_id")

        if not timer_cfg or not action_id:
            return False

        next_run_at_str = timer_cfg.get("next_run_at")
        if not next_run_at_str:
            return False

        now_utc = datetime.now(timezone.utc)
        try:
            next_run_at = datetime.fromisoformat(next_run_at_str)
        except ValueError:
            schedule = build_timer_schedule(action_id, timer_cfg)
            new_next = compute_initial_next_run(schedule, now_utc)
            timer_cfg["next_run_at"] = new_next.isoformat()
            parameters["timer"] = timer_cfg
            return False

        if next_run_at > now_utc:
            return False

        schedule = build_timer_schedule(action_id, timer_cfg)
        new_next = compute_initial_next_run(schedule, now_utc)

        timer_cfg["last_run_at"] = now_utc.isoformat()
        timer_cfg["next_run_at"] = new_next.isoformat()
        parameters["timer"] = timer_cfg

        return True
