"""
Analyze Audio Use Case

Coordinates running the Mix & Master technical analysis on an uploaded file.
"""

from __future__ import annotations

from typing import Any, Dict

from adapter.gateways.mix_analyzer_gateway import MixAnalyzerGateway


class AnalyzeAudioUseCase:
    """Use case for analyzing audio files for the Mix & Master Analyzer."""

    def __init__(self, analyzer_gateway: MixAnalyzerGateway):
        self._analyzer_gateway = analyzer_gateway

    def execute(
        self,
        audio_path: str,
        mix_type: str | None,
        genre: str | None,
        content_type: str | None,
    ) -> Dict[str, Any]:
        """
        Run the full analysis and return a JSON-serialisable dict ready for the API.
        """
        return self._analyzer_gateway.analyze_mix(
            audio_path=audio_path,
            mix_type=mix_type,
            genre=genre,
            content_type=content_type,
        )

