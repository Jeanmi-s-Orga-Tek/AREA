# Action Handler Architecture

This document explains the new action handler architecture for the AREA project.

## Overview

The action handler architecture mirrors the Executor pattern used for reactions, providing a clean, extensible way to handle webhooks and polling for different services.

## Architecture

### Directory Structure

```
Backend/app/handlers/
├── __init__.py         # Handler registry and helper functions
├── base.py            # Base classes (BaseActionHandler, BaseWebhookHandler, BasePollingHandler)
├── github.py          # GitHub action handlers
└── trello.py          # Trello action handlers
```

### Base Classes

**`BaseActionHandler`** - Abstract base for all handlers
- `service_name`: Service identifier (e.g., "github", "trello")
- `action_type`: Action key (e.g., "push", "new_issue")
- `parse_payload()`: Parse raw webhook/API data into standardized format
- `matches_conditions()`: Check if payload matches user conditions
- `extract_trigger_data()`: Extract data for reaction interpolation

**`BaseWebhookHandler`** - For webhook-based actions
- `webhook_events`: List of webhook events to subscribe to
- `verify_signature()`: Verify webhook authenticity
- `setup_webhook()`: Create webhook on external service
- `cleanup_webhook()`: Remove webhook from external service

**`BasePollingHandler`** - For polling-based actions
- `polling_interval`: How often to poll (seconds)
- `poll()`: Poll external service for new events
- `get_last_state()` / `save_state()`: Track state between polls

### Handler Registry

```python
from app.handlers import get_handler, process_webhook

# Get specific handler
handler = get_handler("github", "push")

# Get all handlers for webhook event
handlers = get_handlers_for_event("github", "push")

# Process incoming webhook
results = await process_webhook("github", event_type, payload, headers, body)
```

## Name Mapping

Actions/reactions in the database have names like:
- `"GitHub - New Issue"`
- `"Trello - New Card"`

Handlers use simplified keys:
- `"new_issue"`
- `"new_card"`

The `action_name_to_key()` function converts between formats:
```python
from app.area_engine import action_name_to_key

key = action_name_to_key("GitHub - New Issue")  # Returns "new_issue"
```

## Adding a New Service

### 1. Create Handler File

Create `app/handlers/your_service.py`:

```python
from typing import Dict, Any, List
from app.handlers.base import BaseWebhookHandler, ActionResult

class YourServiceNewEventHandler(BaseWebhookHandler):
    @property
    def service_name(self) -> str:
        return "your_service"
    
    @property
    def action_type(self) -> str:
        return "new_event"  # Key that matches action name
    
    @property
    def webhook_events(self) -> List[str]:
        return ["event_type"]  # Webhook events from the service
    
    async def verify_signature(self, body: bytes, headers: Dict[str, str], secret: str) -> bool:
        # Implement signature verification
        return True
    
    async def setup_webhook(self, session, service_account, params: Dict[str, Any]) -> bool:
        # Create webhook on external service
        # Use params to get user-configured values (e.g., repository, board_id)
        return True
    
    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        # Parse webhook payload into standardized format
        return ActionResult(
            triggered=True,
            event_type="new_event",
            payload={
                "resource.id": raw_payload.get("id"),
                "resource.name": raw_payload.get("name"),
                # Flatten nested data for easy interpolation
            }
        )

# Export handlers
YOUR_SERVICE_HANDLERS = {
    "new_event": YourServiceNewEventHandler(),
}

YOUR_SERVICE_EVENT_MAP = {
    "event_type": [YourServiceNewEventHandler()],
}
```

### 2. Register Handlers

Update `app/handlers/__init__.py`:

```python
from app.handlers.your_service import YOUR_SERVICE_HANDLERS, YOUR_SERVICE_EVENT_MAP

HANDLERS: Dict[str, Dict[str, BaseActionHandler]] = {
    "github": GITHUB_HANDLERS,
    "trello": TRELLO_HANDLERS,
    "your_service": YOUR_SERVICE_HANDLERS,  # Add here
}

WEBHOOK_EVENT_MAP: Dict[str, Dict[str, List[BaseActionHandler]]] = {
    "github": GITHUB_EVENT_MAP,
    "trello": TRELLO_EVENT_MAP,
    "your_service": YOUR_SERVICE_EVENT_MAP,  # Add here
}
```

### 3. Add Webhook Endpoint

Update `app/routers/webhooks.py`:

```python
@webhooks_router.post("/your_service")
async def your_service_webhook(request: Request):
    body = await request.body()
    headers = dict(request.headers)
    
    # Verify signature
    webhook_secret = os.getenv("YOUR_SERVICE_WEBHOOK_SECRET", "")
    if webhook_secret:
        handler = get_webhook_handler("your_service", "new_event")
        if handler:
            is_valid = await handler.verify_signature(body, headers, webhook_secret)
            if not is_valid:
                raise HTTPException(status_code=401, detail="Invalid signature")
    
    payload = await request.json()
    event_type = payload.get("type", "unknown")  # Service-specific
    
    # Process through handlers
    results = await process_webhook("your_service", event_type, payload, headers, body)
    
    triggered_count = 0
    for result in results:
        if result.triggered:
            await trigger_areas_with_handlers(
                service="your_service",
                event_type=result.event_type,
                payload=result.payload
            )
            triggered_count += 1
    
    return {"status": "ok", "event": event_type, "handlers_triggered": triggered_count}
```

### 4. Create Action YAML

Create `Backend/actions/YourService/new_event.yaml`:

```yaml
name: "YourService - New Event"
description: "Triggers when a new event occurs"
service: your_service
is_polling: false  # or true for polling
parameters:
  resource_id: ""
```

## Payload Standardization

Handlers should flatten nested data for easy interpolation in reactions:

**Bad** (nested):
```python
{
    "repository": {
        "full_name": "owner/repo"
    }
}
```

**Good** (flattened):
```python
{
    "repository.full_name": "owner/repo",
    "repository.name": "repo",
}
```

This allows users to use `{{repository.full_name}}` in reaction parameters.

## Key Benefits

1. **Consistency**: Same pattern as Executors
2. **Extensibility**: Easy to add new services
3. **Separation of Concerns**: Each handler is self-contained
4. **Type Safety**: Strong typing with abstract base classes
5. **Testability**: Handlers can be tested independently
6. **Maintainability**: Changes to one service don't affect others

## Examples

### Existing Handlers

**GitHub Handlers**:
- `push` - Git push events
- `new_issue` - New issue creation
- `new_pull_request` - New PR creation
- `new_star` - Repository starred
- `issue_comment` - New issue comment
- `pull_request_review` - PR review submitted

**Trello Handlers**:
- `new_card` - Card created (webhook)
- `card_moved` - Card moved between lists (webhook)
- `card_due_soon` - Card due date approaching (polling)
