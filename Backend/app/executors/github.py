from typing import Any, Dict
from app.executors.base import BaseExecutor
from app.oauth_models import ServiceAccount
from sqlmodel import Session, select
import httpx

class GitHubCreateIssueExecutor(BaseExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session):
        pass