from abc import ABC, abstractmethod
from typing import Dict, Any
from sqlmodel import Session

class BaseExecutor(ABC):
    @abstractmethod
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session):
        pass

from app.executors.github import GitHubCreateIssueExecutor

EXECUTORS = {
    "github": {
        "create_issue": GitHubCreateIssueExecutor(),
    },
    # add the others lol
}

async def execute_reaction(service_name: str, reaction_key: str, user_id: int, parameters: Dict[str, Any], session: Session):  
    executor = EXECUTORS.get(service_name, {}).get(reaction_key)
    if not executor:
        raise Exception(f"No executor found for {service_name}.{reaction_key} :(")
    
    return await executor.execute(user_id, parameters, session)
