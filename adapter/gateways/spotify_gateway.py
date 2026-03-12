"""
Spotify Gateway - Interface Adapter
Uses Spotify Web API (client credentials) to fetch track/playlist metadata.
"""

from __future__ import annotations

from typing import Dict, Any, List, Optional
import time
import base64
import os

import requests

from utils.logger import setup_logger


logger = setup_logger(__name__)


class SpotifyGateway:
    """
    Gateway for Spotify metadata.

    Currently used for:
    - Resolving track title/artist from a Spotify track URL or ID.
    """

    TOKEN_URL = "https://accounts.spotify.com/api/token"
    API_BASE_URL = "https://api.spotify.com/v1"

    def __init__(self, client_id: str, client_secret: str, market: str = "US") -> None:
        self.client_id = client_id
        self.client_secret = client_secret
        self.market = market
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0.0

    # === Authentication =====================================================

    def _get_access_token(self) -> str:
        """
        Get (and cache) an application access token using client credentials flow.
        """
        now = time.time()
        if self._access_token and now < self._token_expires_at - 30:
            return self._access_token

        logger.info("Requesting new Spotify access token via client credentials flow")
        auth_header = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode("utf-8")).decode(
            "utf-8"
        )
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {"grant_type": "client_credentials"}
        resp = requests.post(self.TOKEN_URL, headers=headers, data=data, timeout=5)
        if resp.status_code != 200:
            logger.error(f"Spotify token request failed: {resp.status_code} {resp.text}")
            raise ValueError("Failed to authenticate with Spotify. Please check client id/secret.")

        payload = resp.json()
        access_token = payload.get("access_token")
        expires_in = int(payload.get("expires_in", 3600))
        if not access_token:
            raise ValueError("Spotify token response missing access_token")

        self._access_token = access_token
        self._token_expires_at = now + expires_in
        return access_token

    def _get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        token = self._get_access_token()
        headers = {"Authorization": f"Bearer {token}"}
        url = f"{self.API_BASE_URL}{path}"
        resp = requests.get(url, headers=headers, params=params or {}, timeout=5)
        if resp.status_code != 200:
            logger.error(f"Spotify API GET {path} failed: {resp.status_code} {resp.text}")
            raise ValueError("Spotify API request failed")
        return resp.json()

    # === Helpers ============================================================

    @staticmethod
    def _extract_track_id(spotify_url: str) -> str:
        """
        Extract track ID from:
        - https://open.spotify.com/track/{id}
        - spotify:track:{id}
        """
        url = (spotify_url or "").strip()
        if "spotify:track:" in url:
            return url.split("spotify:track:")[-1].split("?")[0]
        if "open.spotify.com/track/" in url:
            part = url.split("open.spotify.com/track/")[-1]
            return part.split("?")[0].split("/")[0]
        raise ValueError("Invalid Spotify track URL")

    @staticmethod
    def _extract_playlist_id(spotify_url: str) -> str:
        """
        Extract playlist ID from:
        - https://open.spotify.com/playlist/{id}
        - spotify:playlist:{id}
        """
        url = (spotify_url or "").strip()
        if "spotify:playlist:" in url:
            return url.split("spotify:playlist:")[-1].split("?")[0]
        if "open.spotify.com/playlist/" in url:
            part = url.split("open.spotify.com/playlist/")[-1]
            return part.split("?")[0].split("/")[0]
        raise ValueError("Invalid Spotify playlist URL")

    # === Public API =========================================================

    def get_track_metadata(self, spotify_url: str) -> Dict[str, Any]:
        """
        Return basic metadata for a Spotify track URL:
        - name
        - artists (comma-separated)
        - duration_ms
        """
        track_id = self._extract_track_id(spotify_url)
        data = self._get(f"/tracks/{track_id}", params={"market": self.market})

        name = data.get("name") or ""
        artists_items = data.get("artists") or []
        artists = ", ".join(a.get("name", "") for a in artists_items if a.get("name"))

        return {
            "id": track_id,
            "name": name,
            "artists": artists,
            "duration_ms": data.get("duration_ms"),
        }

    def get_playlist_tracks(self, playlist_url: str, limit: int | None = None) -> List[Dict[str, Any]]:
        """
        Return a list of tracks for a Spotify playlist URL.

        Each item contains:
        - id
        - name
        - artists (comma-separated)
        - duration_ms

        limit: optional maximum number of tracks to return.
        """
        playlist_id = self._extract_playlist_id(playlist_url)

        tracks: List[Dict[str, Any]] = []
        path = f"/playlists/{playlist_id}/tracks"
        params: Dict[str, Any] = {"market": self.market, "limit": 100}
        next_url: Optional[str] = None

        while True:
            if next_url:
                resp = self._get(next_url.replace(self.API_BASE_URL, ""), params=None)
            else:
                resp = self._get(path, params=params)

            items = resp.get("items") or []
            for item in items:
                track = item.get("track") or {}
                if not track or track.get("type") != "track":
                    continue
                name = track.get("name") or ""
                artist_items = track.get("artists") or []
                artists = ", ".join(a.get("name", "") for a in artist_items if a.get("name"))
                tracks.append(
                    {
                        "id": track.get("id"),
                        "name": name,
                        "artists": artists,
                        "duration_ms": track.get("duration_ms"),
                    }
                )
                if limit is not None and len(tracks) >= limit:
                    return tracks

            next_url = resp.get("next")
            if not next_url:
                break

        return tracks

