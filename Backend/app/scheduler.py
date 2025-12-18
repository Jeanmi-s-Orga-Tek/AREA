import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlmodel import select

from app.db import SessionLocal
from .oauth_models import Service, Area
from app.reaction import Reaction
from services.timer_logic import build_timer_schedule, compute_initial_next_run
from .executors.base import execute_reaction
from .area_engine import reaction_name_to_key


_scheduler_stop_event: Optional[asyncio.Event] = None
_scheduler_task: Optional[asyncio.Task] = None


async def run_due_timers() -> None:
    now_utc = datetime.now(timezone.utc)

    with SessionLocal() as session:
        timer_service = session.exec(
            select(Service).where(Service.name == "timer")
        ).first()
        if not timer_service:
            return

        areas = session.exec(
            select(Area).where(
                Area.action_service_id == timer_service.id,
                Area.is_active == True,
            )
        ).all()

        for area in areas:
            params: Dict[str, Any] = area.params_action or {}
            timer_cfg = params.get("timer")
            if not timer_cfg:
                continue

            action_id = (
                area.action_id
            )
            schedule = build_timer_schedule(action_id, timer_cfg)
            next_run_at_str = timer_cfg.get("next_run_at")

            if not next_run_at_str:
                next_run = compute_initial_next_run(schedule, now_utc)
                timer_cfg["next_run_at"] = next_run.isoformat()
                params["timer"] = timer_cfg
                area.params_action = params
                session.add(area)
                continue

            try:
                next_run_at = datetime.fromisoformat(next_run_at_str)
            except ValueError:
                next_run_at = compute_initial_next_run(schedule, now_utc)

            if next_run_at > now_utc:
                continue

            reaction = session.get(Reaction, area.reaction_id)
            if not reaction:
                continue
            reaction_service = session.get(Service, area.reaction_service_id)
            if not reaction_service:
                continue

            reaction_key = reaction_name_to_key(reaction.name)

            await execute_reaction(
                service_name=reaction_service.name,
                reaction_key=reaction_key,
                user_id=area.user_id,
                parameters=area.params_reaction or {},
                session=session,
            )

            new_next = compute_initial_next_run(schedule, now_utc)
            timer_cfg["last_run_at"] = now_utc.isoformat()
            timer_cfg["next_run_at"] = new_next.isoformat()
            params["timer"] = timer_cfg
            area.params_action = params
            session.add(area)

        session.commit()


async def _scheduler_loop(poll_interval_seconds: int = 60) -> None:
    while _scheduler_stop_event and not _scheduler_stop_event.is_set():
        await run_due_timers()
        try:
            await asyncio.wait_for(_scheduler_stop_event.wait(), timeout=poll_interval_seconds)
        except asyncio.TimeoutError:
            continue


def start_scheduler(poll_interval_seconds: int = 60) -> asyncio.Event:
    global _scheduler_stop_event, _scheduler_task
    if _scheduler_stop_event is None:
        _scheduler_stop_event = asyncio.Event()
    loop = asyncio.get_event_loop()
    _scheduler_task = loop.create_task(_scheduler_loop(poll_interval_seconds))
    return _scheduler_stop_event


async def stop_scheduler() -> None:
    if _scheduler_stop_event is not None:
        _scheduler_stop_event.set()
    if _scheduler_task is not None:
        await _scheduler_task
