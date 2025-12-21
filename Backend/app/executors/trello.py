from typing import Any, Dict, Optional
from app.executors.base import BaseExecutor
from app.oauth_models import ServiceAccount, Service
from sqlmodel import Session, select
import httpx
from fastapi import HTTPException
import os

class BaseTrelloExecutor(BaseExecutor):
    async def _get_trello_credentials(self, user_id: int, session: Session) -> tuple[str, ServiceAccount]:
        trello_service = session.exec(
            select(Service).where(Service.name == "trello")
        ).first()

        if not trello_service:
            raise HTTPException(status_code=404, detail="Trello service not found")

        api_key = os.getenv("TRELLO_WEB_CLIENT_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500, 
                detail="Trello API key not configured"
            )

        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == user_id,
                ServiceAccount.service_id == trello_service.id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            raise HTTPException(
                status_code=403, 
                detail="User not connected to Trello"
            )
        
        return api_key, service_account
    
    async def _make_trello_request(self, method: str,  url: str, api_key: str, token: str, json_data: Optional[Dict] = None, extra_params: Optional[Dict] = None) -> Dict[str, Any]:
        params = {"key": api_key, "token": token}
        if extra_params:
            params.update(extra_params)
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    params=params,
                    json=json_data,
                    timeout=30.0
                )
                
                if response.status_code in [200, 201]:
                    return response.json()
                elif response.status_code == 401:
                    raise HTTPException(
                        status_code=401,
                        detail="Trello token expired or invalid"
                    )
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Trello API error: {response.text}"
                    )
                    
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=504,
                    detail="Trello API timeout"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Network error: {str(e)}"
                )


class TrelloUpdateBoardTitleExecutor(BaseTrelloExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        board_id = parameters.get("board_id")
        title = parameters.get("name")

        if not board_id or not title:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: board_id and name"
            )

        api_key, service_account = await self._get_trello_credentials(user_id, session)

        await self._make_trello_request(
            method="PUT",
            url=f"https://api.trello.com/1/boards/{board_id}",
            api_key=api_key,
            token=service_account.access_token,
            json_data={"name": title}
        )
        
        print(f"Trello board {board_id} title updated to: {title}")
        return True


class TrelloAddCommentExecutor(BaseTrelloExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        card_id = parameters.get("card_id")
        comment = parameters.get("comment")

        if not card_id or not comment:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: card_id and comment"
            )

        api_key, service_account = await self._get_trello_credentials(user_id, session)

        await self._make_trello_request(
            method="POST",
            url=f"https://api.trello.com/1/cards/{card_id}/actions/comments",
            api_key=api_key,
            token=service_account.access_token,
            extra_params={"text": comment}
        )
        
        print(f"Comment added to Trello card {card_id}")
        return True


class TrelloCreateCardExecutor(BaseTrelloExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        list_id = parameters.get("list_id")
        name = parameters.get("name")
        desc = parameters.get("desc", "")

        if not list_id:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameter: list_id"
            )

        api_key, service_account = await self._get_trello_credentials(user_id, session)

        card_data = {"idList": list_id}
        if name:
            card_data["name"] = name
        if desc:
            card_data["desc"] = desc

        result = await self._make_trello_request(
            method="POST",
            url="https://api.trello.com/1/cards",
            api_key=api_key,
            token=service_account.access_token,
            json_data=card_data
        )
        
        print(f"Trello card created: {result.get('id')} - {result.get('name')}")
        return True


class TrelloMoveCardExecutor(BaseTrelloExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        card_id = parameters.get("card_id")
        list_id = parameters.get("list_id")

        if not card_id or not list_id:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: card_id and list_id"
            )

        api_key, service_account = await self._get_trello_credentials(user_id, session)

        await self._make_trello_request(
            method="PUT",
            url=f"https://api.trello.com/1/cards/{card_id}",
            api_key=api_key,
            token=service_account.access_token,
            json_data={"idList": list_id}
        )
        
        print(f"Trello card {card_id} moved to list {list_id}")
        return True
