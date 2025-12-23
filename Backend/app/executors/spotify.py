from typing import Any, Dict
from app.executors.base import BaseExecutor
from app.oauth_models import ServiceAccount, Service
from sqlmodel import Session, select
import httpx
from fastapi import HTTPException

class SpotifyCreatePlaylistExecutor(BaseExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        name = parameters.get("name", "").strip()
        description = parameters.get("description", "")
        public = parameters.get("public", "true").lower() == "true"
        
        if not name:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameter: name"
            )
        
        spotify_service = session.exec(
            select(Service).where(Service.name == "spotify")
        ).first()
        
        if not spotify_service:
            raise HTTPException(
                status_code=404,
                detail="Spotify service not found"
            )
        
        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == user_id,
                ServiceAccount.service_id == spotify_service.id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            raise HTTPException(
                status_code=404,
                detail="Spotify account not connected"
            )

        async with httpx.AsyncClient() as client:
            try:
                user_response = await client.get(
                    "https://api.spotify.com/v1/me",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                    },
                    timeout=30.0
                )
                
                if user_response.status_code != 200:
                    raise HTTPException(
                        status_code=user_response.status_code,
                        detail=f"Failed to get Spotify user: {user_response.text}"
                    )
                
                spotify_user_id = user_response.json()["id"]

                response = await client.post(
                    f"https://api.spotify.com/v1/users/{spotify_user_id}/playlists",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "name": name,
                        "description": description,
                        "public": public,
                    },
                    timeout=30.0
                )
                
                if response.status_code in [200, 201]:
                    playlist_data = response.json()
                    print(f"Created playlist: {playlist_data['name']} (ID: {playlist_data['id']})")
                    return True
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Spotify API error: {response.text}"
                    )
                    
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=504,
                    detail="Spotify API timeout"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Network error: {str(e)}"
                )

class SpotifyAddTrackToPlaylistExecutor(BaseExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        playlist_id = parameters.get("playlist_id", "").strip()
        track_uri = parameters.get("track_uri", "").strip()
        
        if not playlist_id:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameter: playlist_id"
            )
        
        if not track_uri:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameter: track_uri"
            )

        if not track_uri.startswith("spotify:track:"):
            if "spotify.com/track/" in track_uri:
                track_id = track_uri.split("/track/")[1].split("?")[0]
                track_uri = f"spotify:track:{track_id}"
            elif len(track_uri) == 22:
                track_uri = f"spotify:track:{track_uri}"
        
        spotify_service = session.exec(
            select(Service).where(Service.name == "spotify")
        ).first()
        
        if not spotify_service:
            raise HTTPException(
                status_code=404,
                detail="Spotify service not found"
            )
        
        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == user_id,
                ServiceAccount.service_id == spotify_service.id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            raise HTTPException(
                status_code=404,
                detail="Spotify account not connected"
            )
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "uris": [track_uri],
                    },
                    timeout=30.0
                )
                
                if response.status_code == 201:
                    print(f"Added track {track_uri} to playlist {playlist_id}")
                    return True
                elif response.status_code == 404:
                    raise HTTPException(
                        status_code=404,
                        detail="Playlist or track not found"
                    )
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Spotify API error: {response.text}"
                    )
                    
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=504,
                    detail="Spotify API timeout"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Network error: {str(e)}"
                )
