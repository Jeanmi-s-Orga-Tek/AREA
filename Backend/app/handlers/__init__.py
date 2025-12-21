from typing import Dict, Any, List, Optional, Type
from app.handlers.base import BaseActionHandler, BaseWebhookHandler, BasePollingHandler, ActionResult
from app.handlers.github import GITHUB_HANDLERS, GITHUB_EVENT_MAP
from app.handlers.trello import TRELLO_HANDLERS, TRELLO_EVENT_MAP

HANDLERS: Dict[str, Dict[str, BaseActionHandler]] = {
    "github": GITHUB_HANDLERS,
    "trello": TRELLO_HANDLERS,
}

WEBHOOK_EVENT_MAP: Dict[str, Dict[str, List[BaseActionHandler]]] = {
    "github": GITHUB_EVENT_MAP,
    "trello": TRELLO_EVENT_MAP,
}

def get_handler(service_name: str, action_type: str) -> Optional[BaseActionHandler]:
    return HANDLERS.get(service_name, {}).get(action_type)


def get_handlers_for_event(service_name: str, event_type: str) -> List[BaseActionHandler]:
    return WEBHOOK_EVENT_MAP.get(service_name, {}).get(event_type, [])


def get_webhook_handler(service_name: str, action_type: str) -> Optional[BaseWebhookHandler]:
    handler = get_handler(service_name, action_type)
    if isinstance(handler, BaseWebhookHandler):
        return handler
    return None


def get_polling_handler(service_name: str, action_type: str) -> Optional[BasePollingHandler]:
    handler = get_handler(service_name, action_type)
    if isinstance(handler, BasePollingHandler):
        return handler
    return None


def get_all_polling_handlers() -> List[tuple[str, str, BasePollingHandler]]:
    result = []
    for service_name, handlers in HANDLERS.items():
        for action_type, handler in handlers.items():
            if isinstance(handler, BasePollingHandler):
                result.append((service_name, action_type, handler))
    return result


async def process_webhook(service_name: str, event_type: str, payload: Dict[str, Any],headers: Dict[str, str],raw_body: bytes = b"") -> List[ActionResult]:
    handlers = get_handlers_for_event(service_name, event_type)
    results = []
    
    for handler in handlers:
        try:
            result = await handler.parse_payload(payload, headers)
            if result.triggered:
                results.append(result)
        except Exception as e:
            print(f"Error in handler {handler.__class__.__name__}: {str(e)}")
            results.append(ActionResult(
                triggered=False,
                event_type=event_type,
                payload={},
                error=str(e)
            ))
    
    return results

def get_webhook_events_for_action(service_name: str, action_type: str) -> List[str]:
    handler = get_handler(service_name, action_type)
    if handler and hasattr(handler, 'webhook_events'):
        return handler.webhook_events
    return []

def list_services() -> List[str]:
    return list(HANDLERS.keys())

def list_actions(service_name: str) -> List[str]:
    return list(HANDLERS.get(service_name, {}).keys())
