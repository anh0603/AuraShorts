"""
Quality Gate Verifiers for the Autonomous Task Orchestrator.
Ref: PROJECT.md Section 118 & docs/ARCHITECTURE.md
"""

from typing import Dict, Any, List, Tuple
from app.models.orchestration import QualityGateStatus


class QualityGateFailedError(Exception):
    """Raised when an artifact fails deterministic Quality Gate checks."""
    pass


class QualityGates:
    """
    Deterministic validation routines for each pipeline artifact.
    """

    @staticmethod
    def verify_script(script_payload: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validates script structure:
        - Must have a non-empty title and hook.
        - Must have at least 1 scene.
        - Spoken text must have at least 10 words.
        """
        if not isinstance(script_payload, dict):
            return False, "Script payload must be a JSON object."

        title = script_payload.get("title", "")
        if not title or len(title.strip()) < 5:
            return False, "Script title is missing or too short."

        scenes = script_payload.get("scenes", [])
        if not isinstance(scenes, list) or len(scenes) == 0:
            return False, "Script must contain at least one scene."

        total_words = sum(len(scene.get("text", "").split()) for scene in scenes)
        if total_words < 10:
            return False, f"Total word count ({total_words}) is too low for a video."

        return True, "Script Quality Gate passed."

    @staticmethod
    def verify_audio(audio_metadata: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validates audio asset:
        - duration_ms > 1000 (at least 1 second).
        - duration_ms <= 180000 (max 3 minutes for Shorts).
        """
        duration_ms = audio_metadata.get("duration_ms", 0)
        if not isinstance(duration_ms, (int, float)) or duration_ms <= 1000:
            return False, f"Invalid audio duration: {duration_ms}ms (must be > 1000ms)."

        if duration_ms > 180000:
            return False, f"Audio duration exceeds maximum 3 minutes limit: {duration_ms}ms."

        return True, "Audio Quality Gate passed."

    @staticmethod
    def verify_alignment(alignment_data: Dict[str, Any], audio_duration_ms: int) -> Tuple[bool, str]:
        """
        Validates word timestamps:
        - segments list must not be empty.
        - each segment: start_ms <= end_ms.
        - timestamps must not exceed audio_duration_ms + 500ms tolerance.
        - strictly non-decreasing start times.
        """
        segments = alignment_data.get("segments", [])
        if not isinstance(segments, list) or len(segments) == 0:
            return False, "Alignment segments list is empty."

        last_start = -1
        for seg in segments:
            start_ms = seg.get("start_ms", 0)
            end_ms = seg.get("end_ms", 0)

            if start_ms < 0 or end_ms < 0:
                return False, f"Negative timestamp found: start={start_ms}, end={end_ms}."

            if start_ms > end_ms:
                return False, f"Inverted timestamp: start_ms ({start_ms}) > end_ms ({end_ms})."

            if start_ms < last_start:
                return False, f"Non-chronological timestamp order: {start_ms} after {last_start}."

            if end_ms > (audio_duration_ms + 500):
                return False, f"Timestamp ({end_ms}ms) exceeds audio duration ({audio_duration_ms}ms)."

            last_start = start_ms

        return True, "Alignment Quality Gate passed."

    @staticmethod
    def verify_video(video_metadata: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validates rendered MP4:
        - Width: 1080, Height: 1920 (9:16).
        - Codec: h264.
        - Duration within range (10s to 120s).
        """
        width = video_metadata.get("width")
        height = video_metadata.get("height")
        if width != 1080 or height != 1920:
            return False, f"Invalid aspect ratio or dimensions: {width}x{height} (expected 1080x1920 9:16)."

        codec = video_metadata.get("codec", "").lower()
        if codec and codec != "h264":
            return False, f"Unsupported video codec: {codec} (expected h264)."

        duration_seconds = video_metadata.get("duration_seconds", 0)
        if duration_seconds < 10 or duration_seconds > 120:
            return False, f"Video duration {duration_seconds}s outside acceptable range (10s - 120s)."

        return True, "Video Quality Gate passed."
