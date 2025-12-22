from typing import Dict, Any, Optional, List
from sqlmodel import Session, select
import httpx
import os
from datetime import datetime, timezone

from app.handlers.base import BaseWebhookHandler, ActionResult, BasePollingHandler
from app.oauth_models import ServiceAccount, Service

class GoogleDriveNewFileHandler(BasePollingHandler):
    @property
    def service_name(self) -> str:
        return "google"
    
    @property
    def action_type(self) -> str:
        return "drive__new_file"
    
    @property
    def polling_interval(self) -> int:
        return 60

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        return ActionResult(
            triggered=True,
            event_type="drive__new_file",
            payload=raw_payload
        )

    async def poll(self, session: Session, user_id: int, params: Dict[str, Any]) -> Optional[ActionResult]:
        # print("STARTING DRIVE POLL")

        google_service = session.exec(
            select(Service).where(Service.name == "google")
        ).first()
        
        if not google_service:
            return None

        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == user_id,
                ServiceAccount.service_id == google_service.id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            return None

        folder_id = params.get("folder_id", "root")
        file_type = params.get("file_type", "") or ""
        
        try:
            async with httpx.AsyncClient() as client:
                query_parts = [f"'{folder_id}' in parents", "trashed = false"]
                if file_type:
                    query_parts.append(f"mimeType contains '{file_type}'")
                
                query = " and ".join(query_parts)
                
                response = await client.get(
                    "https://www.googleapis.com/drive/v3/files",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                    },
                    params={
                        "q": query,
                        "orderBy": "createdTime desc",
                        "pageSize": 10,
                        "fields": "files(id,name,mimeType,createdTime,webViewLink,owners,size)"
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"Drive API error: {response.status_code} - {response.text}")
                    return None

                data = response.json()
                # print("DRIVE DATA : ", data)

                files = data.get("files", [])
                
                if not files:
                    return None

                latest_file = files[0]
                created_time = datetime.fromisoformat(latest_file["createdTime"].replace("Z", "+00:00"))

                now = datetime.now(timezone.utc)
                if (now - created_time).total_seconds() <= self.polling_interval:
                    owners = latest_file.get("owners", [{}])
                    owner = owners[0] if owners else {}
                    
                    return ActionResult(
                        triggered=True,
                        event_type="drive__new_file",
                        payload={
                            "file.id": latest_file.get("id"),
                            "file.name": latest_file.get("name"),
                            "file.mimeType": latest_file.get("mimeType"),
                            "file.createdTime": latest_file.get("createdTime"),
                            "file.webViewLink": latest_file.get("webViewLink"),
                            "file.size": latest_file.get("size"),
                            "file.owner.displayName": owner.get("displayName"),
                            "file.owner.emailAddress": owner.get("emailAddress"),
                            "folder_id": folder_id,
                        }
                    )
                
                return None
                    
        except Exception as e:
            print(f"Error polling Google Drive: {str(e)}")
            return None


class GoogleGmailNewEmailHandler(BasePollingHandler):
    @property
    def service_name(self) -> str:
        return "google"
    
    @property
    def action_type(self) -> str:
        return "gmail__new_email"
    
    @property
    def polling_interval(self) -> int:
        return 60

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        return ActionResult(
            triggered=True,
            event_type="gmail__new_email",
            payload=raw_payload
        )

    async def poll(self, session: Session, user_id: int, params: Dict[str, Any]) -> Optional[ActionResult]:
        google_service = session.exec(
            select(Service).where(Service.name == "google")
        ).first()
        
        if not google_service:
            return None

        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == user_id,
                ServiceAccount.service_id == google_service.id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            return None

        from_address = params.get("from_address", "")
        subject_contains = params.get("subject_contains", "")
        label = params.get("label", "")
        if not label:
            label = "INBOX"
        
        try:
            async with httpx.AsyncClient() as client:
                query_parts = ["is:unread"]
                if from_address:
                    query_parts.append(f"from:{from_address}")
                if subject_contains:
                    query_parts.append(f"subject:{subject_contains}")
                
                query = " ".join(query_parts)
                
                api_params = {
                    "q": query,
                    "maxResults": 5
                }
                if label:
                    api_params["labelIds"] = label
                
                response = await client.get(
                    "https://gmail.googleapis.com/gmail/v1/users/me/messages",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                    },
                    params=api_params,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"Gmail API error: {response.status_code} - {response.text}")
                    return None

                data = response.json()
                # print("GMAIL DATA : ", data)
                messages = data.get("messages", [])
                
                if not messages:
                    return None

                message_id = messages[0]["id"]
                msg_response = await client.get(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                    },
                    params={
                        "format": "metadata",
                        "metadataHeaders": ["From", "To", "Subject", "Date"]
                    },
                    timeout=30.0
                )
                
                if msg_response.status_code != 200:
                    return None

                msg_data = msg_response.json()

                headers_dict = {}
                for header in msg_data.get("payload", {}).get("headers", []):
                    headers_dict[header["name"]] = header["value"]

                internal_date = int(msg_data.get("internalDate", 0)) / 1000
                msg_time = datetime.fromtimestamp(internal_date, tz=timezone.utc)
                now = datetime.now(timezone.utc)
                
                if (now - msg_time).total_seconds() <= self.polling_interval:
                    return ActionResult(
                        triggered=True,
                        event_type="gmail__new_email",
                        payload={
                            "email.id": message_id,
                            "email.threadId": msg_data.get("threadId"),
                            "email.from": headers_dict.get("From", ""),
                            "email.to": headers_dict.get("To", ""),
                            "email.subject": headers_dict.get("Subject", ""),
                            "email.date": headers_dict.get("Date", ""),
                            "email.snippet": msg_data.get("snippet", ""),
                            "email.labelIds": msg_data.get("labelIds", []),
                        }
                    )
                
                return None
                    
        except Exception as e:
            print(f"Error polling Gmail: {str(e)}")
            return None


class GoogleYoutubeNewUploadHandler(BasePollingHandler):
    
    @property
    def service_name(self) -> str:
        return "google"
    
    @property
    def action_type(self) -> str:
        return "youtube__new_channel_upload"
    
    @property
    def polling_interval(self) -> int:
        return 60

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        return ActionResult(
            triggered=True,
            event_type="youtube__new_channel_upload",
            payload=raw_payload
        )

    async def poll(self, session: Session, user_id: int, params: Dict[str, Any]) -> Optional[ActionResult]:
        google_service = session.exec(
            select(Service).where(Service.name == "google")
        ).first()
        
        if not google_service:
            return None

        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == user_id,
                ServiceAccount.service_id == google_service.id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            return None

        channel_id = params.get("channel_id")
        if not channel_id:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/youtube/v3/search",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                    },
                    params={
                        "part": "snippet",
                        "channelId": channel_id,
                        "order": "date",
                        "type": "video",
                        "maxResults": 1
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"YouTube API error: {response.status_code} - {response.text}")
                    return None

                data = response.json()
                # print("YOUTUBE DATA : ", data)
                items = data.get("items", [])
                
                if not items:
                    return None

                latest_video = items[0]
                snippet = latest_video.get("snippet", {})
                video_id = latest_video.get("id", {}).get("videoId")
                published_at = snippet.get("publishedAt", "")
                
                published_time = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)
                
                if (now - published_time).total_seconds() <= self.polling_interval:
                    return ActionResult(
                        triggered=True,
                        event_type="youtube__new_channel_upload",
                        payload={
                            "video.id": video_id,
                            "video.title": snippet.get("title"),
                            "video.url": f"https://www.youtube.com/watch?v={video_id}",
                            "video.description": snippet.get("description"),
                            "video.published": published_at,
                            "channel.id": channel_id,
                            "channel.name": snippet.get("channelTitle"),
                            "channel.url": f"https://www.youtube.com/channel/{channel_id}",
                            "thumbnail.url": snippet.get("thumbnails", {}).get("high", {}).get("url"),
                        }
                    )
                
                return None
                    
        except Exception as e:
            print(f"Error polling YouTube: {str(e)}")
            return None

GOOGLE_HANDLERS = {
    "drive__new_file": GoogleDriveNewFileHandler(),
    "gmail__new_email": GoogleGmailNewEmailHandler(),
    "youtube__new_channel_upload": GoogleYoutubeNewUploadHandler(),
}

GOOGLE_EVENT_MAP = {}
