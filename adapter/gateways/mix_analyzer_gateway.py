"""
Mix Analyzer Gateway - Interface Adapter
Connects domain use case with MixAnalyzerService.
"""

from __future__ import annotations

from typing import Any, Dict

from services.mix_analyzer import MixAnalyzerService, MixAnalysisResult
from utils.logger import setup_logger

logger = setup_logger(__name__)


class MixAnalyzerGateway:
    """Gateway for mix/master technical analysis."""

    def __init__(self, service: MixAnalyzerService):
        self._service = service

    def analyze_mix(
        self,
        audio_path: str,
        mix_type: str | None,
        genre: str | None,
        content_type: str | None,
    ) -> Dict[str, Any]:
        """
        Run full mix/master analysis and return a JSON-serialisable dict
        matching the frontend's AnalysisResult shape (camelCase keys).
        """
        logger.info(
            "Running MixAnalyzerGateway.analyze_mix for %s [mix_type=%s, genre=%s, content_type=%s]",
            audio_path,
            mix_type,
            genre,
            content_type,
        )
        result: MixAnalysisResult = self._service.analyze(
            audio_path=audio_path,
            mix_type=mix_type,
            genre=genre,
            content_type=content_type,
        )

        return {
            "trackName": result.track_name,
            "sampleRate": result.sample_rate,
            "bitDepth": result.bit_depth,
            "clipping": result.clipping,
            "monoCompatibility": result.mono_compatibility,
            "integratedLoudness": result.integrated_loudness,
            "truePeak": result.true_peak,
            "phaseIssues": result.phase_issues,
            "stereoField": result.stereo_field,
            "suggestedChanges": result.suggested_changes,
        }

