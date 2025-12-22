from abc import ABC, abstractmethod
from typing import Dict, Any
from sqlmodel import Session

class BaseExecutor(ABC):
    @abstractmethod
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        pass

from app.executors.github import GitHubCreateIssueExecutor, GitHubAddCommentExecutor, GitHubCreateBranchExecutor
from app.executors.trello import TrelloUpdateBoardTitleExecutor, TrelloAddCommentExecutor, TrelloCreateCardExecutor, TrelloMoveCardExecutor
from app.executors.google import GoogleSendEmailExecutor, GoogleCreateFolderExecutor, GoogleCreateEventExecutor, GoogleUpdateCellExecutor

EXECUTORS = {
    "github": {
        "create_issue": GitHubCreateIssueExecutor(),
        "add_comment": GitHubAddCommentExecutor(),
        "create_branch": GitHubCreateBranchExecutor(),
    },
    "trello": {
        "update_board_title": TrelloUpdateBoardTitleExecutor(),
        "add_comment": TrelloAddCommentExecutor(),
        "create_card": TrelloCreateCardExecutor(),
        "move_card": TrelloMoveCardExecutor(),
    },
    "google": {
        "gmail__send_email": GoogleSendEmailExecutor(),
        "drive__create_folder": GoogleCreateFolderExecutor(),
        "calendar__create_event": GoogleCreateEventExecutor(),
        "sheets__update_cell": GoogleUpdateCellExecutor(),
    },
    # add the others lol
}

async def execute_reaction(service_name: str, reaction_key: str, user_id: int, parameters: Dict[str, Any], session: Session):  
    executor = EXECUTORS.get(service_name, {}).get(reaction_key)
    if not executor:
        raise Exception(f"No executor found for {service_name}.{reaction_key} :(")
    
    return await executor.execute(user_id, parameters, session)
