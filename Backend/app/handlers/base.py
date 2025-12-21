from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from sqlmodel import Session
from dataclasses import dataclass

@dataclass
class ActionResult:
    triggered: bool
    event_type: str
    payload: Dict[str, Any]
    error: Optional[str] = None

class BaseActionHandler(ABC):
    @property
    @abstractmethod
    def service_name(self) -> str:
        pass
    
    @property
    @abstractmethod
    def action_type(self) -> str:
        pass

    @property
    def webhook_events(self) -> List[str]:
        return []

    @abstractmethod
    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        pass

    async def matches_conditions(self, params: Dict[str, Any], payload: Dict[str, Any]) -> bool:
        return True

    def extract_trigger_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return payload


class BaseWebhookHandler(BaseActionHandler):
    @abstractmethod
    async def verify_signature(self, body: bytes, headers: Dict[str, str], secret: str) -> bool:
        pass

    @abstractmethod
    async def setup_webhook(self, session: Session, service_account: Any, params: Dict[str, Any]) -> bool:
        pass

    async def cleanup_webhook(self, session: Session, service_account: Any, params: Dict[str, Any]) -> bool:
        return True


class BasePollingHandler(BaseActionHandler):
    @property
    def polling_interval(self) -> int:
        return 60
    
    @abstractmethod
    async def poll(self, session: Session, user_id: int, params: Dict[str, Any]) -> Optional[ActionResult]:
        pass

    async def get_last_state(self, session: Session, area_id: int) -> Optional[Dict[str, Any]]:
        return None

    async def save_state(self, session: Session, area_id: int, state: Dict[str, Any]) -> None:
        pass
