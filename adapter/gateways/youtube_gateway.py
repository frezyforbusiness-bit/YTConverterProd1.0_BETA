"""
YouTube Gateway - Interface Adapter
Wraps YouTubeAudioConverter and provides search helpers
"""

from __future__ import annotations

from typing import Tuple
import re

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

        Heuristics:
        - Prefer titles with 'audio', 'lyrics', 'lyric', 'official audio', 'visualizer'
        - Penalize 'official video', 'music video', 'clip', 'live'
        - Use position in results as a weak signal

        Returns:
            (video_url, info_dict)

        Raises:
            ValueError if no suitable result is found
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

        logger.info(f"Searching YouTube for audio version of: {query!r}")
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

