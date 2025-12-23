from typing import Dict, Any, Optional, List
from sqlmodel import Session, select
import httpx
import hmac
import hashlib
import os

from app.handlers.base import BaseWebhookHandler, ActionResult, BasePollingHandler
from app.oauth_models import ServiceAccount, Service

class DiscordUserProfileChangeHandler(BasePollingHandler):
    _user_profile_cache: Dict[int, Dict[str, str]] = {}
    
    @property
    def service_name(self) -> str:
        return "discord"
    
    @property
    def action_type(self) -> str:
        return "user_profile_change"
    
    @property
    def polling_interval(self) -> int:
        return 60

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        return ActionResult(
            triggered=True,
            event_type="user_profile_change",
            payload=raw_payload
        )

    async def poll(self, session: Session, user_id: int, params: Dict[str, Any]) -> Optional[ActionResult]:
        discord_service = session.exec(
            select(Service).where(Service.name == "discord")
        ).first()
        
        if not discord_service:
            return None

        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == user_id,
                ServiceAccount.service_id == discord_service.id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://discord.com/api/v10/users/@me",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"Discord API error getting user profile: {response.status_code} - {response.text}")
                    return None
                
                user_data = response.json()
                # print("USER DATA : ", user_data)
                current_profile = {
                    "username": user_data.get("username", ""),
                    "discriminator": user_data.get("discriminator", "0"),
                    "avatar": user_data.get("avatar", ""),
                    "global_name": user_data.get("global_name", ""),
                }
                
                cache_key = user_id
                previous_profile = self._user_profile_cache.get(cache_key)
                
                self._user_profile_cache[cache_key] = current_profile
                
                if previous_profile is None:
                    return None

                changes = []
                if previous_profile["username"] != current_profile["username"]:
                    changes.append(f"username: {previous_profile['username']} → {current_profile['username']}")
                if previous_profile["global_name"] != current_profile["global_name"]:
                    changes.append(f"display name: {previous_profile['global_name']} → {current_profile['global_name']}")
                if previous_profile["avatar"] != current_profile["avatar"]:
                    changes.append("avatar changed")
                
                if changes:
                    return ActionResult(
                        triggered=True,
                        event_type="user_profile_change",
                        payload={
                            "user.id": user_data.get("id"),
                            "user.username": current_profile["username"],
                            "user.global_name": current_profile["global_name"],
                            "user.discriminator": current_profile["discriminator"],
                            "user.avatar": current_profile["avatar"],
                            "changes": ", ".join(changes),
                        }
                    )
                
                return None
                    
        except Exception as e:
            print(f"Error polling Discord user profile: {str(e)}")
            return None


DISCORD_HANDLERS = {
    "user_status_change": DiscordUserProfileChangeHandler(),
}

DISCORD_EVENT_MAP = {}

