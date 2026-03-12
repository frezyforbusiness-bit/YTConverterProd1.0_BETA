"""
YouTube Gateway - Interface Adapter
Wraps YouTubeAudioConverter and provides search helpers
"""

from __future__ import annotations

from typing import Tuple, List, Dict, Any
import re
import os
import requests

from services.converter import YouTubeAudioConverter
from utils.logger import setup_logger


logger = setup_logger(__name__)


class YouTubeGateway:
    """
    Gateway that adapts YouTube operations for use cases.

    - Delegates video download to YouTubeAudioConverter
    - Provides a helper to search the best audio-oriented video for a query
    """

    def __init__(self, converter: YouTubeAudioConverter):
        self.converter = converter

    # === Basic delegation ==================================================

    def download_video(self, youtube_url: str, get_info_only: bool = False):
        """
        Download a YouTube video (or get info only) using the underlying converter.

        Returns (video_path, video_info) or (None, video_info) if get_info_only=True.
        """
        return self.converter.download_video(youtube_url, get_info_only=get_info_only)

    # === Search for best audio/lyrics version ==============================

    def search_best_audio_video(self, query: str) -> Tuple[str, dict]:
        """
        Search YouTube for the best audio-focused version of a track.

        Strategy:
        1. If YOUTUBE_API_KEY is configured, use YouTube Data API v3 search.
        2. Fallback to pytubefix/pytube Search if API key missing or request fails.

        Heuristics:
        - Prefer titles with 'audio', 'lyrics', 'lyric', 'official audio', 'visualizer'
        - Penalize 'official video', 'music video', 'clip', 'live'
        - Use position in results as a weak signal

        Returns:
            (video_url, info_dict)

        Raises:
            ValueError if no suitable result is found
        """
        api_key = os.environ.get("YOUTUBE_API_KEY")
        if api_key:
            try:
                return self._search_with_youtube_api(query, api_key)
            except Exception as e:
                logger.warning(f"YouTube Data API search failed for {query!r}: {e}. Falling back to pytube search.")

        # Fallback: HTML-based search via pytubefix/pytube
        return self._search_with_pytube(query)

    # === Implementations ===================================================

    def _search_with_youtube_api(self, query: str, api_key: str) -> Tuple[str, dict]:
        """
        Use YouTube Data API v3 to search for videos matching the query.
        """
        logger.info(f"Searching YouTube Data API for audio version of: {query!r}")
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "type": "video",
            "q": query,
            "maxResults": 8,
            "key": api_key,
            # Optional: bias towards music
            "videoCategoryId": "10",  # Music
        }
        resp = requests.get(url, params=params, timeout=5)
        if resp.status_code != 200:
            raise ValueError(f"YouTube API error: HTTP {resp.status_code} - {resp.text}")

        data = resp.json()
        items: List[Dict[str, Any]] = data.get("items", [])
        if not items:
            raise ValueError("No YouTube results found for this track (API).")

        def score_item(item: Dict[str, Any], index: int) -> float:
            snippet = item.get("snippet", {}) or {}
            title = (snippet.get("title") or "").lower()
            channel = (snippet.get("channelTitle") or "").lower()

            score = 0.0

            # Base score: earlier results are slightly better
            score += max(0, 10 - index)

            positive_keywords = [
                "audio",
                "official audio",
                "lyrics",
                "lyric",
                "visualizer",
                "topic",
            ]
            negative_keywords = [
                "official video",
                "music video",
                "video ufficiale",
                "clip",
                "live",
                "concert",
            ]

            for kw in positive_keywords:
                if kw in title:
                    score += 15
            if " - topic" in channel:
                score += 10

            for kw in negative_keywords:
                if kw in title:
                    score -= 20
            if re.search(r"\b(official\s+video|music\s+video|mv)\b", title):
                score -= 25

            return score

        best_item = None
        best_score = float("-inf")
        for idx, item in enumerate(items):
            s = score_item(item, idx)
            logger.debug(f"[API] Candidate {idx}: title={item.get('snippet', {}).get('title')!r}, score={s}")
            if s > best_score:
                best_score = s
                best_item = item

        if not best_item:
            raise ValueError("No suitable audio result found on YouTube (API).")

        vid_id = best_item["id"]["videoId"]
        snippet = best_item["snippet"]
        video_url = f"https://www.youtube.com/watch?v={vid_id}"
        info = {
            "id": vid_id,
            "title": snippet.get("title"),
            "duration": None,  # would require an extra videos.list call
            "uploader": snippet.get("channelTitle"),
            "thumbnail": (snippet.get("thumbnails") or {}).get("high", {}).get("url"),
        }

        logger.info(f"[API] Selected YouTube audio candidate: {video_url} (score={best_score})")
        return video_url, info

    def _search_with_pytube(self, query: str) -> Tuple[str, dict]:
        """
        Fallback search using pytubefix/pytube HTML-based Search.
        """
        try:
            try:
                from pytubefix import Search  # type: ignore
                logger.debug("Using pytubefix.Search for YouTube search")
            except ImportError:
                from pytube import Search  # type: ignore
                logger.debug("Using pytube.Search for YouTube search")
        except ImportError:
            raise ValueError(
                "YouTube search is not available (pytube/pytubefix not installed). "
                "Please install pytubefix or pytube on the server."
            )

        logger.info(f"Searching YouTube (pytube) for audio version of: {query!r}")
        try:
            search = Search(query)
            # results is a list of YouTube objects
            results = list(search.results or [])[:8]
        except Exception as e:
            logger.error(f"YouTube search failed for query {query!r}: {e}")
            raise ValueError("Failed to search YouTube for this track")

        if not results:
            raise ValueError("No YouTube results found for this track")

        def score_result(yt_obj, index: int) -> float:
            """
            Compute score based on title/channel/duration.
            Higher is better.
            """
            title = (yt_obj.title or "").lower()
            channel = (yt_obj.author or "").lower()

            score = 0.0

            # Base score: earlier results are slightly better
            score += max(0, 10 - index)

            # Prefer official audio / lyrics / topic
            positive_keywords = [
                "audio",
                "official audio",
                "lyrics",
                "lyric",
                "visualizer",
                "topic",
            ]
            negative_keywords = [
                "official video",
                "music video",
                "video ufficiale",
                "clip",
                "live",
                "concert",
            ]

            for kw in positive_keywords:
                if kw in title:
                    score += 15
            # Channel hints (topic channels)
            if " - topic" in channel:
                score += 10

            for kw in negative_keywords:
                if kw in title:
                    score -= 20

            # Light penalty if very clearly a clip/highly visual
            if re.search(r"\b(official\s+video|music\s+video|mv)\b", title):
                score -= 25

            # Use view count as a soft signal if available
            try:
                views = int(getattr(yt_obj, "views", 0) or 0)
                if views > 0:
                    score += min(views / 1_000_000, 20)  # cap contribution
            except Exception:
                pass

            return score

        best = None
        best_score = float("-inf")

        for idx, yt in enumerate(results):
            s = score_result(yt, idx)
            logger.debug(f"Candidate {idx}: title={yt.title!r}, author={yt.author!r}, score={s}")
            if s > best_score:
                best_score = s
                best = yt

        if not best:
            raise ValueError("No suitable audio result found on YouTube")

        info = {
            "id": best.video_id,
            "title": best.title,
            "duration": getattr(best, "length", None),
            "uploader": best.author,
            "thumbnail": getattr(best, "thumbnail_url", None),
        }

        logger.info(f"Selected YouTube audio candidate: {best.watch_url} (score={best_score})")
        return best.watch_url, info

