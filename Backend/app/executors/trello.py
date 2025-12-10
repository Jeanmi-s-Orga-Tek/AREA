from typing import Any, Dict
from app.executors.base import BaseExecutor
from app.oauth_models import ServiceAccount, Service
from sqlmodel import Session, select
import httpx
from fastapi import HTTPException
import os

class TrelloUpdateDoardTitleExecutor(BaseExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        trello_service = session.exec(
            select(Service).where(Service.name == "trello")
        ).first()
        
        if not trello_service:
            raise HTTPException(status_code=404, detail="trello service not found")

        trello_api_key = os.getenv("TRELLO_WEB_CLIENT_API_KEY", None)
        if trello_api_key is None:
            raise HTTPException(
                status_code=403, 
                detail="Dev forgot the Trello API key lmao"
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
                detail="User not connected to trello"
            )

        board_id = parameters.get("board_id")
        title = parameters.get("name")

        if not board_id or not title:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: board_id and title"
            )

        board_data = {
            "name": title
        }

        async with httpx.AsyncClient() as client:
            try:
                # TODO : Don't hardcode urls >:( (put them in the yaml)
                response = await client.put(
                    f"https://api.trello.com/1/boards/{board_id}?key={trello_api_key}&token={service_account.access_token}",
                    headers={
                    },
                    json=board_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    res = response.json()
                    print(f"Trello board updated: {res['html_url']}")
                    return True
                # elif response.status_code == 401:
                #     raise HTTPException(
                #         status_code=401,
                #         detail="Trello token expired or invalid"
                #     )
                else:
                    # error_msg = response.json()
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