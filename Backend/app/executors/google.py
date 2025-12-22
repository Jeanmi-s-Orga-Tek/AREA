from typing import Any, Dict, Optional
from app.executors.base import BaseExecutor
from app.oauth_models import ServiceAccount, Service
from sqlmodel import Session, select
import httpx
from fastapi import HTTPException
import base64
from email.mime.text import MIMEText

class BaseGoogleExecutor(BaseExecutor):
    async def _get_google_credentials(self, user_id: int, session: Session) -> ServiceAccount:
        google_service = session.exec(
            select(Service).where(Service.name == "google")
        ).first()
        
        if not google_service:
            raise HTTPException(status_code=404, detail="Google service not found")

        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == user_id,
                ServiceAccount.service_id == google_service.id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            raise HTTPException(
                status_code=403, 
                detail="User not connected to Google"
            )
        
        return service_account
    
    async def _make_google_request(self, method: str, url: str, access_token: str, json_data: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=json_data,
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code in [200, 201, 204]:
                    if response.content:
                        return response.json()
                    return {}
                elif response.status_code == 401:
                    raise HTTPException(
                        status_code=401,
                        detail="Google token expired or invalid"
                    )
                else:
                    error_msg = response.text
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Google API error: {error_msg}"
                    )
                    
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=504,
                    detail="Google API timeout"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Network error: {str(e)}"
                )

class GoogleSendEmailExecutor(BaseGoogleExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        to = parameters.get("to")
        subject = parameters.get("subject", "")
        body = parameters.get("body", "")
        cc = parameters.get("cc", "")
        
        if not to:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameter: to"
            )

        service_account = await self._get_google_credentials(user_id, session)

        message = MIMEText(body)
        message["to"] = to
        message["subject"] = subject
        if cc:
            message["cc"] = cc

        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")

        result = await self._make_google_request(
            method="POST",
            url="https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            access_token=service_account.access_token,
            json_data={"raw": raw_message}
        )
        
        print(f"Gmail email sent to: {to}")
        return True

class GoogleCreateFolderExecutor(BaseGoogleExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        folder_name = parameters.get("folder_name")
        parent_folder_id = parameters.get("parent_folder_id", "")
        
        if not folder_name:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameter: folder_name"
            )

        service_account = await self._get_google_credentials(user_id, session)

        folder_data = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder"
        }
        
        if parent_folder_id:
            folder_data["parents"] = [parent_folder_id]

        result = await self._make_google_request(
            method="POST",
            url="https://www.googleapis.com/drive/v3/files",
            access_token=service_account.access_token,
            json_data=folder_data
        )
        
        print(f"Google Drive folder created: {result.get('id')} - {folder_name}")
        return True

class GoogleCreateEventExecutor(BaseGoogleExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        title = parameters.get("title") or parameters.get("summary")
        description = parameters.get("description", "")
        start_datetime = parameters.get("start_datetime")
        end_datetime = parameters.get("end_datetime")
        location = parameters.get("location", "")
        
        if not title or not start_datetime or not end_datetime:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: title, start_datetime, end_datetime"
            )

        service_account = await self._get_google_credentials(user_id, session)

        start_iso = start_datetime.replace(" ", "T")
        if not start_iso.endswith("Z") and "+" not in start_iso:
            start_iso += "Z"
        
        end_iso = end_datetime.replace(" ", "T")
        if not end_iso.endswith("Z") and "+" not in end_iso:
            end_iso += "Z"

        # swap the 2 in case of mistake
        if start_iso > end_iso:
            start_iso, end_iso = end_iso, start_iso

        event_data = {
            "summary": title,
            "description": description,
            "start": {
                "dateTime": start_iso,
                "timeZone": "UTC"
            },
            "end": {
                "dateTime": end_iso,
                "timeZone": "UTC"
            }
        }
        
        if location:
            event_data["location"] = location

        result = await self._make_google_request(
            method="POST",
            url="https://www.googleapis.com/calendar/v3/calendars/primary/events",
            access_token=service_account.access_token,
            json_data=event_data
        )
        
        print(f"Google Calendar event created: {result.get('id')} - {title}")
        return True

class GoogleUpdateCellExecutor(BaseGoogleExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        spreadsheet_id = parameters.get("spreadsheet_id")
        sheet_name = parameters.get("sheet_name", "Sheet1")
        cell_range = parameters.get("cell_range")
        value = parameters.get("value", "")
        
        if not spreadsheet_id or not cell_range:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: spreadsheet_id, cell_range"
            )

        service_account = await self._get_google_credentials(user_id, session)

        range_notation = f"{sheet_name}!{cell_range}"
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range_notation}"

        result = await self._make_google_request(
            method="PUT",
            url=url,
            access_token=service_account.access_token,
            json_data={
                "values": [[value]]
            },
            params={
                "valueInputOption": "USER_ENTERED"
            }
        )
        
        print(f"Google Sheets cell updated: {spreadsheet_id} - {range_notation}")
        return True
