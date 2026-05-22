#!/usr/bin/env python3
"""
Quick test for conversion email notifications.
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
load_dotenv(PROJECT_ROOT / ".env")

from services.conversion_email_notifier import ConversionEmailNotifier


def main() -> int:
    notifier = ConversionEmailNotifier()

    if not notifier.enabled:
        print("CONVERSION_NOTIFY_ENABLED=false -> notifications disabled.")
        return 1

    if not notifier.is_configured():
        print("Email notifier is not configured.")
        print("Railway (recommended): set RESEND_API_KEY in .env")
        print("  https://resend.com/api-keys")
        print("VPS/local: set SMTP_HOST, SMTP_USER, SMTP_PASSWORD")
        return 1

    print(f"Provider: {notifier.provider_name()}")

    print(f"Sending test emails to: {notifier.to_email}")

    notifier.notify_success(
        task_id="test-success-task",
        source_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        audio_format="mp3",
        video_title="Test Track",
        video_id="dQw4w9WgXcQ",
        bpm=128,
        musical_key="A Minor",
        file_path="/tmp/test-track.mp3",
    )
    notifier.notify_error(
        task_id="test-error-task",
        source_url="https://www.youtube.com/watch?v=p833Oj36VnY",
        audio_format="mp3",
        error_message="Test error notification",
        video_title="Test Failed Track",
    )

    # Background thread needs a short wait before process exit.
    time.sleep(3)
    print("Done. Check inbox:", notifier.to_email)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
