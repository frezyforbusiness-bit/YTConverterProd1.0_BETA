"""
Mix Analyzer Service
Performs technical analysis for Mix & Master Analyzer:
- sample rate, bit depth
- integrated loudness (LUFS)
- true peak
- simple clipping detection
- simple mono compatibility / stereo field heuristics
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Dict, Any
import os

import numpy as np
import librosa
import soundfile as sf
import pyloudnorm as pyln

from utils.logger import setup_logger

logger = setup_logger(__name__)


@dataclass
class MixAnalysisResult:
    track_name: str
    sample_rate: str
    bit_depth: str
    clipping: bool
    mono_compatibility: bool
    integrated_loudness: float
    true_peak: float
    phase_issues: bool
    stereo_field: str
    suggested_changes: List[Dict[str, Any]]


class MixAnalyzerService:
    """High-level audio analysis for the Mix & Master Analyzer UI."""

    def analyze(
        self,
        audio_path: str,
        mix_type: str | None = None,
        genre: str | None = None,
        content_type: str | None = None,
    ) -> MixAnalysisResult:
        """
        Analyze uploaded audio file and build a report.
        The logic is intentionally heuristic and lightweight – good enough
        for guidance, not a mastering-grade meter.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        logger.info(f"[MixAnalyzer] Starting analysis for {audio_path}")

        # Defaults
        sample_rate_hz = 44100
        bit_depth_str = "16 bit"

        try:
            info = sf.info(audio_path)
            sample_rate_hz = int(info.samplerate)
            bit_depth_str = f"{info.subtype_info}" if info.subtype_info else bit_depth_str
        except Exception as e:
            logger.warning(f"[MixAnalyzer] Could not read audio info via soundfile: {e}")

        # Load mono mixdown for analysis (30s for speed)
        y, sr = librosa.load(audio_path, sr=None, mono=False, duration=30.0)

        if y.ndim == 1:
            mono = y
            stereo = False
        else:
            stereo = True
            left, right = y[0, :], y[1, :]
            mono = (left + right) / 2.0

        # Clipping detection
        peak_abs = float(np.max(np.abs(mono))) if mono.size else 0.0
        clipping = peak_abs >= 0.99

        # Loudness / true peak via pyloudnorm
        meter = pyln.Meter(sr)  # R128
        loudness = float(meter.integrated_loudness(mono.astype(float)))
        true_peak_linear = float(np.max(mono))
        # Convert to dBFS, guard against log(0)
        true_peak_db = 20 * np.log10(max(true_peak_linear, 1e-9))

        # Simple stereo metrics
        mono_compatibility = True
        phase_issues = False
        stereo_field = "Mono"

        if stereo:
            # Correlation coefficient between L and R
            try:
                corr = float(np.corrcoef(left, right)[0, 1])
            except Exception:
                corr = 1.0

            if corr < 0.0:
                phase_issues = True
            mono_compatibility = corr > -0.5

            if corr > 0.8:
                stereo_field = "Narrow"
            elif corr > 0.3:
                stereo_field = "Normal"
            else:
                stereo_field = "Wide"

        # Suggested changes
        suggestions: List[Dict[str, Any]] = []

        def add(title: str, description: str, is_issue: bool = True) -> None:
            suggestions.append(
                {
                    "title": title,
                    "description": description,
                    "is_issue": is_issue,
                }
            )

        # Clipping
        if clipping:
            add(
                "Clipping",
                "There appears to be major clipping occurring. Lower your master or limiter ceiling and check peaks.",
                True,
            )

        # Loudness thresholds based on mix vs master and genre (very approximate)
        is_master = (mix_type or "").lower() == "master"
        target_lufs = -9.0 if is_master else -14.0
        hard_loud_limit = -6.0 if is_master else -10.0

        if loudness > hard_loud_limit:
            add(
                "Loudness",
                "Your track is extremely loud and may suffer from distortion or pumping. Consider lowering the limiter.",
                True,
            )
        elif loudness > target_lufs + 1.0:
            add(
                "Loudness",
                "It looks like your mix might be too loud to be sent for mastering.",
                True,
            )
        elif loudness < target_lufs - 6.0:
            add(
                "Loudness",
                "Your track is significantly quieter than typical releases. You may have headroom for more loudness.",
                False,
            )

        # Very rough dynamic range hint: use loudness range on short windows
        try:
            # 3-second windows for macro dynamics
            frame_length = 3 * sr
            hop_length = frame_length // 2
            rms = librosa.feature.rms(y=mono, frame_length=frame_length, hop_length=hop_length)[0]
            rms_db = 20 * np.log10(np.maximum(rms, 1e-9))
            dyn_range = float(np.percentile(rms_db, 95) - np.percentile(rms_db, 5))

            if dyn_range < 4.0:
                add(
                    "Dynamic Range",
                    "Your track seems to have a limited dynamic range that may not be suitable for this genre.",
                    True,
                )
        except Exception as e:
            logger.warning(f"[MixAnalyzer] Could not compute dynamic range: {e}")

        # Genre-specific hint (placeholder logic)
        g = (genre or "").lower()
        if "trap" in g or "drill" in g:
            add(
                "Genre balance",
                "For trap / drill, make sure the low end (808 + kick) is controlled and not triggering constant limiting.",
                False,
            )
        elif "house" in g or "techno" in g or "club" in g:
            add(
                "Genre balance",
                "Club music often tolerates louder masters, but keep an eye on transient clarity and stereo mono-compatibility.",
                False,
            )

        track_name = os.path.basename(audio_path)

        return MixAnalysisResult(
            track_name=track_name,
            sample_rate=f"{sample_rate_hz} Hz",
            bit_depth=bit_depth_str,
            clipping=clipping,
            mono_compatibility=mono_compatibility,
            integrated_loudness=round(loudness, 1),
            true_peak=round(true_peak_db, 1),
            phase_issues=phase_issues,
            stereo_field=stereo_field,
            suggested_changes=suggestions,
        )

