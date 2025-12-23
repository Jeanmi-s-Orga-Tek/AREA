from typing import Any, Dict, Optional
from app.executors.base import BaseExecutor
from app.oauth_models import ServiceAccount, Service
from sqlmodel import Session, select
import httpx
from fastapi import HTTPException

class DiscordSendWebhookMessageExecutor(BaseExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        webhook_url = parameters.get("webhook_url")
        content = parameters.get("content", "")
        username = parameters.get("username", "")
        avatar_url = parameters.get("avatar_url", "")
        
        if not webhook_url:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameter: webhook_url"
            )
        
        if not content:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameter: content"
            )

        payload = {"content": content}
        
        if username:
            payload["username"] = username
        if avatar_url:
            payload["avatar_url"] = avatar_url

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code in [200, 204]:
                    print(f"Discord webhook message sent")
                    return True
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Discord webhook error: {response.text}"
                    )
                    
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=504,
                    detail="Discord webhook timeout"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Network error: {str(e)}"
                )

