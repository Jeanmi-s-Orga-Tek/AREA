from typing import Dict, Any, Optional, List
from sqlmodel import Session, select
import httpx
import hmac
import hashlib
import base64
import os

from app.handlers.base import BaseWebhookHandler, BasePollingHandler, ActionResult
from app.oauth_models import ServiceAccount

class TrelloWebhookHandler(BaseWebhookHandler):
    @property
    def service_name(self) -> str:
        return "trello"
    
    async def verify_signature(self, body: bytes, headers: Dict[str, str], secret: str) -> bool:
        signature = headers.get("x-trello-webhook", "")
        if not signature or not secret:
            return not secret
        
        callback_url = os.getenv('API_BASE_URL', 'http://localhost:8080') + "/webhooks/trello"

        content = body.decode('utf-8') + callback_url
        expected = base64.b64encode(
            hmac.new(secret.encode('utf-8'), content.encode('utf-8'), hashlib.sha1).digest()
        ).decode('utf-8')
        
        return hmac.compare_digest(expected, signature)

    async def setup_webhook(self, session: Session, service_account: ServiceAccount, params: Dict[str, Any]) -> bool:
        api_key = os.getenv("TRELLO_WEB_CLIENT_API_KEY")
        if not api_key:
            print("Trello API key not configured")
            return False

        board_id = params.get("board_id")
        if not board_id:
            print("No board_id specified for Trello webhook")
            return False

        callback_url = f"{os.getenv('API_BASE_URL', 'http://localhost:8080')}/webhooks/trello"
        
        try:
            async with httpx.AsyncClient() as client:
                list_response = await client.get(
                    f"https://api.trello.com/1/tokens/{service_account.access_token}/webhooks",
                    params={"key": api_key},
                    timeout=30.0
                )

                if list_response.status_code == 200:
                    existing_hooks = list_response.json()
                    for hook in existing_hooks:
                        if hook.get("callbackURL") == callback_url and hook.get("idModel") == board_id:
                            print(f"Webhook already exists for board {board_id}")
                            return True

                response = await client.post(
                    f"https://api.trello.com/1/webhooks",
                    params={
                        "key": api_key,
                        "token": service_account.access_token,
                        "callbackURL": callback_url,
                        "idModel": board_id,
                        "description": "AREA webhook"
                    },
                    timeout=30.0
                )
                
                if response.status_code in [200, 201]:
                    hook = response.json()
                    print(f"Trello webhook created for board {board_id}: {hook.get('id')}")
                    return True
                else:
                    print(f"Failed to create Trello webhook: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            print(f"Error setting up Trello webhook: {str(e)}")
            return False


class TrelloNewCardHandler(TrelloWebhookHandler):
    @property
    def action_type(self) -> str:
        return "new_card"
    
    @property
    def webhook_events(self) -> List[str]:
        return ["createCard"]

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        action = raw_payload.get("action", {})
        action_type = action.get("type")
        
        if action_type != "createCard":
            return ActionResult(
                triggered=False,
                event_type="new_card",
                payload={},
                error="Not a create card event"
            )

        card_data = action.get("data", {}).get("card", {})
        board_data = action.get("data", {}).get("board", {})
        list_data = action.get("data", {}).get("list", {})
        member = action.get("memberCreator", {})
        
        return ActionResult(
            triggered=True,
            event_type="new_card",
            payload={
                "board.id": board_data.get("id"),
                "board.name": board_data.get("name"),
                "board_id": board_data.get("id"),
                "list.id": list_data.get("id"),
                "list.name": list_data.get("name"),
                "list_id": list_data.get("id"),
                "card.id": card_data.get("id"),
                "card.name": card_data.get("name"),
                "card.shortLink": card_data.get("shortLink"),
                "card.url": f"https://trello.com/c/{card_data.get('shortLink')}",
                "member.username": member.get("username"),
                "member.fullName": member.get("fullName"),
            }
        )

class TrelloCardMovedHandler(TrelloWebhookHandler):
    @property
    def action_type(self) -> str:
        return "card_moved"
    
    @property
    def webhook_events(self) -> List[str]:
        return ["updateCard"]

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        action = raw_payload.get("action", {})
        action_type = action.get("type")
        
        if action_type != "updateCard":
            return ActionResult(
                triggered=False,
                event_type="card_moved",
                payload={},
                error="Not an update card event"
            )

        data = action.get("data", {})
        if "listBefore" not in data or "listAfter" not in data:
            return ActionResult(
                triggered=False,
                event_type="card_moved",
                payload={},
                error="Card not moved between lists"
            )

        card_data = data.get("card", {})
        board_data = data.get("board", {})
        list_before = data.get("listBefore", {})
        list_after = data.get("listAfter", {})
        member = action.get("memberCreator", {})
        
        return ActionResult(
            triggered=True,
            event_type="card_moved",
            payload={
                "board.id": board_data.get("id"),
                "board.name": board_data.get("name"),
                "board_id": board_data.get("id"),
                "card.id": card_data.get("id"),
                "card.name": card_data.get("name"),
                "card.shortLink": card_data.get("shortLink"),
                "card.url": f"https://trello.com/c/{card_data.get('shortLink')}",
                "listBefore.id": list_before.get("id"),
                "listBefore.name": list_before.get("name"),
                "listAfter.id": list_after.get("id"),
                "listAfter.name": list_after.get("name"),
                "member.username": member.get("username"),
                "member.fullName": member.get("fullName"),
            }
        )


class TrelloCardDueSoonHandler(BasePollingHandler):
    @property
    def service_name(self) -> str:
        return "trello"
    
    @property
    def action_type(self) -> str:
        return "card_due_soon"
    
    @property
    def polling_interval(self) -> int:
        return 300

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        return ActionResult(
            triggered=True,
            event_type="card_due_soon",
            payload=raw_payload
        )

    async def poll(self, session: Session, user_id: int, params: Dict[str, Any]) -> Optional[ActionResult]:
        from datetime import datetime, timedelta, timezone
        
        api_key = os.getenv("TRELLO_WEB_CLIENT_API_KEY")
        if not api_key:
            return None

        from app.oauth_models import Service
        trello_service = session.exec(
            select(Service).where(Service.name == "trello")
        ).first()
        
        if not trello_service:
            return None

        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == user_id,
                ServiceAccount.service_id == trello_service.id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            return None

        board_id = params.get("board_id")
        hours_threshold = params.get("hours_before", 24)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://api.trello.com/1/boards/{board_id}/cards",
                    params={
                        "key": api_key,
                        "token": service_account.access_token,
                        "fields": "name,due,dueComplete,shortLink,idList"
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    return None

                cards = response.json()
                now = datetime.now(timezone.utc)
                threshold = now + timedelta(hours=hours_threshold)
                
                for card in cards:
                    if card.get("due") and not card.get("dueComplete"):
                        due_date = datetime.fromisoformat(card["due"].replace("Z", "+00:00")).replace(tzinfo=None)
                        if now < due_date <= threshold:
                            return ActionResult(
                                triggered=True,
                                event_type="card_due_soon",
                                payload={
                                    "board.id": board_id,
                                    "card.id": card.get("id"),
                                    "card.name": card.get("name"),
                                    "card.due": card.get("due"),
                                    "card.shortLink": card.get("shortLink"),
                                    "card.url": f"https://trello.com/c/{card.get('shortLink')}",
                                    "hours_until_due": (due_date - now).total_seconds() / 3600,
                                }
                            )
                
                return None
                    
        except Exception as e:
            print(f"Error polling Trello: {str(e)}")
            return None

TRELLO_HANDLERS = {
    "new_card": TrelloNewCardHandler(),
    "card_moved": TrelloCardMovedHandler(),
    "card_due_soon": TrelloCardDueSoonHandler(),
}

TRELLO_EVENT_MAP = {
    "createCard": [TrelloNewCardHandler()],
    "updateCard": [TrelloCardMovedHandler()],
}
