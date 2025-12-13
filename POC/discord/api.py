from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from .discord_client import send_discord_message

logger = logging.getLogger(__name__)
router = APIRouter()

class DiscordPayload(BaseModel):
    content: str
    webhook_url: str | None = None

@router.post("/api/discord")
async def send_discord(payload: DiscordPayload):
    logger.info("Received Discord payload: %s", payload.model_dump())
    try:
        await send_discord_message(
            content=payload.content,
            webhook_url=payload.webhook_url,
        )
        logger.info("Discord message sent successfully")
        return {"status": "ok"}
    except Exception as e:
        logger.exception("Error while sending Discord message")
        raise HTTPException(status_code=500, detail=str(e))
