from typing import Dict, Any, Optional, List
from sqlmodel import Session, select
import httpx

from app.handlers.base import BasePollingHandler, ActionResult
from app.oauth_models import ServiceAccount, Service

class SpotifyNewPlaylistCreatedHandler(BasePollingHandler):
    _user_playlists_cache: Dict[int, set] = {}
    
    @property
    def service_name(self) -> str:
        return "spotify"
    
    @property
    def action_type(self) -> str:
        return "new_playlist_created"
    
    @property
    def polling_interval(self) -> int:
        return 60

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        return ActionResult(
            triggered=True,
            event_type="new_playlist_created",
            payload=raw_payload
        )

    async def poll(self, session: Session, user_id: int, params: Dict[str, Any]) -> Optional[ActionResult]:
        spotify_service = session.exec(
            select(Service).where(Service.name == "spotify")
        ).first()
        
        if not spotify_service:
            return None

        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == user_id,
                ServiceAccount.service_id == spotify_service.id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.spotify.com/v1/me/playlists",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                    },
                    params={"limit": 50},
                    timeout=30.0
                )

                if response.status_code != 200:
                    print(f"Spotify API error : {response.status_code} {response.text}")
                    return None

                data = response.json()
                playlists = data.get("items", [])
                
                current_playlist_ids = {p["id"] for p in playlists}
                
                cache_key = user_id
                previous_playlists = self._user_playlists_cache.get(cache_key, set())
                
                new_playlists = current_playlist_ids - previous_playlists
                self._user_playlists_cache[cache_key] = current_playlist_ids
                
                if not previous_playlists:
                    return None
                
                for playlist in playlists:
                    if playlist["id"] in new_playlists:
                        return ActionResult(
                            triggered=True,
                            event_type="new_playlist_created",
                            payload={
                                "playlist.id": playlist["id"],
                                "playlist.name": playlist["name"],
                                "playlist.description": playlist.get("description", ""),
                                "playlist.public": playlist.get("public", False),
                                "playlist.tracks_total": playlist["tracks"]["total"],
                                "playlist.url": playlist["external_urls"].get("spotify", ""),
                                "playlist.owner": playlist["owner"]["display_name"],
                            }
                        )
                
                return None
                    
        except Exception as e:
            print(f"Error Spotify playlists : {str(e)}")
            return None


class SpotifyTrackAddedToPlaylistHandler(BasePollingHandler):
    _playlist_tracks_cache: Dict[tuple, set] = {}
    
    @property
    def service_name(self) -> str:
        return "spotify"
    
    @property
    def action_type(self) -> str:
        return "track_added_to_playlist"
    
    @property
    def polling_interval(self) -> int:
        return 60

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        return ActionResult(
            triggered=True,
            event_type="track_added_to_playlist",
            payload=raw_payload
        )

    async def poll(self, session: Session, user_id: int, params: Dict[str, Any]) -> Optional[ActionResult]:
        spotify_service = session.exec(
            select(Service).where(Service.name == "spotify")
        ).first()
        
        if not spotify_service:
            return None

        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == user_id,
                ServiceAccount.service_id == spotify_service.id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            return None

        target_playlist_id = params.get("playlist_id", "").strip()

        try:
            async with httpx.AsyncClient() as client:
                if target_playlist_id:
                    playlist_ids = [target_playlist_id]
                else:
                    response = await client.get(
                        "https://api.spotify.com/v1/me/playlists",
                        headers={
                            "Authorization": f"Bearer {service_account.access_token}",
                        },
                        params={"limit": 20},
                        timeout=30.0
                    )
                    
                    if response.status_code != 200:
                        print(f"Spotify API error : {response.status_code} {response.text}")
                        return None
                    
                    data = response.json()
                    playlist_ids = [p["id"] for p in data.get("items", [])]

                for playlist_id in playlist_ids:
                    result = await self._check_playlist_for_new_tracks(
                        client,
                        service_account.access_token,
                        playlist_id,
                        user_id
                    )
                    if result:
                        return result
                
                return None
                    
        except Exception as e:
            print(f"Error : {str(e)}")
            return None
    
    async def _check_playlist_for_new_tracks(
        self,
        client: httpx.AsyncClient,
        access_token: str,
        playlist_id: str,
        user_id: int
    ) -> Optional[ActionResult]:
        response = await client.get(
            f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
            headers={
                "Authorization": f"Bearer {access_token}",
            },
            params={"limit": 20, "fields": "items(added_at,track(id,name,artists,album,uri,external_urls))"},
            timeout=30.0
        )
        
        if response.status_code != 200:
            return None
        
        data = response.json()
        # print("PLAYLIST DATA : ", data)
        items = data.get("items", [])

        current_track_ids = {item["track"]["id"] for item in items if item.get("track")}
        
        cache_key = (user_id, playlist_id)
        previous_tracks = self._playlist_tracks_cache.get(cache_key, set())
        
        new_tracks = current_track_ids - previous_tracks
        self._playlist_tracks_cache[cache_key] = current_track_ids

        if not previous_tracks:
            return None
        
        for item in items:
            track = item.get("track")
            if track and track["id"] in new_tracks:
                artists = ", ".join([a["name"] for a in track.get("artists", [])])
                return ActionResult(
                    triggered=True,
                    event_type="track_added_to_playlist",
                    payload={
                        "track.id": track["id"],
                        "track.name": track["name"],
                        "track.artists": artists,
                        "track.album": track.get("album", {}).get("name", ""),
                        "track.uri": track["uri"],
                        "track.url": track["external_urls"].get("spotify", ""),
                        "playlist.id": playlist_id,
                        "added_at": item.get("added_at", ""),
                    }
                )
        
        return None

SPOTIFY_HANDLERS = {
    "new_playlist_created": SpotifyNewPlaylistCreatedHandler(),
    "track_added_to_playlist": SpotifyTrackAddedToPlaylistHandler(),
}

SPOTIFY_EVENT_MAP = {}
