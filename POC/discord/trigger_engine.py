import asyncio
import contextlib
import datetime

from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlmodel import Session, select

from app.db import create_db_tables, engine
from app.models import Area
from app.poc.discord_client import send_discord_message


async def trigger_loop() -> None:
    """Background timer engine: runs every 30 seconds and triggers enabled AREAs."""
    while True:
        now = datetime.datetime.utcnow()
        print("[TRIGGER] Loop tick")
        with Session(engine) as session:
            areas = session.exec(select(Area).where(Area.enabled == True)).all()
            for area in areas:
                if area.last_triggered_at is None:
                    print(f"[TRIGGER] First trigger for AREA {area.id} - {area.name}")
                    await send_discord_message(area.message)
                    area.last_triggered_at = now
                    session.add(area)
                    session.commit()
                    session.refresh(area)
                    continue

                delta = now - area.last_triggered_at
                elapsed_minutes = delta.total_seconds() / 60.0
                if elapsed_minutes >= area.interval_minutes:
                    print(f"[TRIGGER] Interval trigger for AREA {area.id} - {area.name}")
                    await send_discord_message(area.message)
                    area.last_triggered_at = now
                    session.add(area)
                    session.commit()
                    session.refresh(area)
        await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_tables()
    loop_task = asyncio.create_task(trigger_loop())
    try:
        yield
    finally:
        loop_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await loop_task

