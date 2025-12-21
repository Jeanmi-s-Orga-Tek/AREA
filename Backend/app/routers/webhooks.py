from fastapi import APIRouter, Request, HTTPException, Header
from typing import Optional, Dict, Any
import os

from app.area_engine import trigger_areas_with_handlers
from app.handlers import get_handlers_for_event, get_webhook_handler, process_webhook

webhooks_router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@webhooks_router.post("/github")
async def github_webhook(request: Request, x_hub_signature_256: Optional[str] = Header(None), x_github_event: Optional[str] = Header(None)):
    body = await request.body()
    headers = dict(request.headers)

    webhook_secret = os.getenv("GITHUB_WEBHOOK_SECRET", "")
    if webhook_secret:
        handler = get_webhook_handler("github", "push")
        if handler:
            is_valid = await handler.verify_signature(body, headers, webhook_secret)
            if not is_valid:
                raise HTTPException(status_code=401, detail="Invalid signature")
    
    try:
        payload = await request.json()
    except:
        payload = {}
    
    event_type = x_github_event or "unknown"
    print(f"GitHub webhook received: {event_type}")

    results = await process_webhook("github", event_type, payload, headers, body)
    
    triggered_count = 0
    for result in results:
        if result.triggered:
            await trigger_areas_with_handlers(
                service="github",
                event_type=result.event_type,
                payload=result.payload
            )
            triggered_count += 1
    
    return {
        "status": "ok", 
        "event": event_type,
        "handlers_triggered": triggered_count
    }

@webhooks_router.get("/github")
async def github_webhook_verify(request: Request):
    challenge = request.query_params.get("challenge")
    if challenge:
        return {"challenge": challenge}
    return {"status": "ok"}

@webhooks_router.post("/trello")
async def trello_webhook(request: Request):
    body = await request.body()
    headers = dict(request.headers)

    webhook_secret = os.getenv("TRELLO_WEBHOOK_SECRET", "")
    if webhook_secret:
        handler = get_webhook_handler("trello", "new_card")
        if handler:
            is_valid = await handler.verify_signature(body, headers, webhook_secret)
            if not is_valid:
                raise HTTPException(status_code=401, detail="Invalid signature")
    
    try:
        payload = await request.json()
    except:
        payload = {}

    action = payload.get("action", {})
    action_type = action.get("type", "unknown")
    print(f"Trello webhook received: {action_type}")

    results = await process_webhook("trello", action_type, payload, headers, body)
    
    triggered_count = 0
    for result in results:
        if result.triggered:
            await trigger_areas_with_handlers(
                service="trello",
                event_type=result.event_type,
                payload=result.payload
            )
            triggered_count += 1
    
    return {
        "status": "ok", 
        "event": action_type,
        "handlers_triggered": triggered_count
    }
