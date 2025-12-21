from typing import Dict, Any, Optional
from sqlmodel import Session, select
from app.oauth_models import Service, ServiceAccount, Area
from app.action import Action
from app.handlers import get_webhook_handler, get_webhook_events_for_action
from app.area_engine import action_name_to_key
import os

class WebhookManager:
    @staticmethod
    async def setup_webhooks_for_area(session: Session, area: Area) -> bool:
        action = session.get(Action, area.action_id)
        if not action:
            print(f"Action not found for area {area.id}")
            return False

        if action.is_polling:
            print(f"Action {action.name} uses polling, no webhook needed :D")
            return True

        service = session.get(Service, area.action_service_id)
        if not service:
            print(f"Service not found for area {area.id}")
            return False
        
        print(f"Setting up webhook for {service.name}.{action.name}")

        action_key = action_name_to_key(action.name)

        handler = get_webhook_handler(service.name, action_key)
        
        if not handler:
            print(f"No webhook handler found for {service.name}.{action_key} (from {action.name})")
            return True
        
        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == area.user_id,
                ServiceAccount.service_id == area.action_service_id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            print(f"User {area.user_id} not connected to {service.name}")
            return False
        
        return await handler.setup_webhook(session, service_account, area.params_action)

    @staticmethod
    async def cleanup_webhooks_for_area(session: Session, area: Area) -> bool:
        action = session.get(Action, area.action_id)
        if not action:
            return True

        if action.is_polling:
            return True

        service = session.get(Service, area.action_service_id)
        if not service:
            return True
        
        action_key = action_name_to_key(action.name)
        handler = get_webhook_handler(service.name, action_key)
        
        if not handler:
            return True
        
        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == area.user_id,
                ServiceAccount.service_id == area.action_service_id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            return True
        
        # TODO cleanup in handlers
        print(f"Webhook cleanup for area {area.id} (NOT IMPLEMENTED)")
        return await handler.cleanup_webhook(session, service_account, area.params_action)

    @staticmethod
    def get_webhook_events_for_action(service_name: str, action_name: str) -> list:
        events = get_webhook_events_for_action(service_name, action_name)
        return events
