from fastapi import APIRouter, Request, HTTPException, Header
from typing import Optional
import hmac
import hashlib
import os
from app.area_engine import trigger_areas

webhooks_router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@webhooks_router.post("/github")
async def github_webhook(request: Request, x_hub_signature_256: Optional[str] = Header(None), x_github_event: Optional[str] = Header(None)):
    body = await request.body()

    webhook_secret = os.getenv("GITHUB_WEBHOOK_SECRET", "")
    if webhook_secret and x_hub_signature_256:
        if not verify_github_signature(body, x_hub_signature_256, webhook_secret):
            raise HTTPException(status_code=401, detail="Invalid signature")
    
    try:
        payload = await request.json()
    except:
        payload = {}
    
    event_type = x_github_event or "unknown"
    
    print(f"GitHub webhook: {event_type}")
    
    await trigger_areas(
        service="github",
        event_type=event_type,
        payload=payload
    )
    
    return {"status": "ok", "event": event_type}

@webhooks_router.get("/github")
async def github_webhook_verify(request: Request):
    challenge = request.query_params.get("challenge")
    if challenge:
        return {"challenge": challenge}
    return {"status": "ok"}

def verify_github_signature(payload: bytes, signature: str, secret: str) -> bool:
    if not signature:
        return False
    
    secret_bytes = secret.encode('utf-8')
    expected = "sha256=" + hmac.new(secret_bytes, payload, hashlib.sha256).hexdigest()
    
    return hmac.compare_digest(expected, signature)
