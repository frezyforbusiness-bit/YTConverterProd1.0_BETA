"""
Email notifications for conversion success and failure.
"""

from __future__ import annotations

import os
import smtplib
import threading
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Optional

from utils.logger import setup_logger

logger = setup_logger(__name__)

DEFAULT_NOTIFY_EMAIL = "info.producertools@gmail.com"


class ConversionEmailNotifier:
    """Sends SMTP email alerts when conversions complete or fail."""

    def __init__(self):
        self.enabled = os.environ.get("CONVERSION_NOTIFY_ENABLED", "true").strip().lower() in (
            "1",
            "true",
            "yes",
            "on",
        )
        self.to_email = os.environ.get("CONVERSION_NOTIFY_EMAIL", DEFAULT_NOTIFY_EMAIL).strip()
        self.smtp_host = os.environ.get("SMTP_HOST", "").strip()
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_user = os.environ.get("SMTP_USER", "").strip()
        self.smtp_password = os.environ.get("SMTP_PASSWORD", "").strip()
        self.smtp_from = os.environ.get("SMTP_FROM", self.smtp_user).strip()
        self.smtp_use_tls = os.environ.get("SMTP_USE_TLS", "true").strip().lower() in (
            "1",
            "true",
            "yes",
            "on",
        )

    def is_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password and self.to_email)

    def notify_success(
        self,
        *,
        task_id: str,
        source_url: str,
        audio_format: str,
        video_title: str,
        video_id: Optional[str] = None,
        bpm: Optional[int] = None,
        musical_key: Optional[str] = None,
        file_path: Optional[str] = None,
    ) -> None:
        subject = f"[YTConverter] Conversion completed - {video_title or task_id}"
        body = "\n".join(
            [
                "A conversion completed successfully.",
                "",
                f"Task ID: {task_id}",
                f"Status: done",
                f"Source URL: {source_url}",
                f"Video ID: {video_id or 'n/a'}",
                f"Title: {video_title or 'Unknown'}",
                f"Format: {audio_format}",
                f"BPM: {bpm if bpm is not None else 'n/a'}",
                f"Key: {musical_key or 'n/a'}",
                f"Output file: {file_path or 'n/a'}",
                f"Timestamp (UTC): {self._utc_now()}",
            ]
        )
        self._send_async(subject, body)

    def notify_error(
        self,
        *,
        task_id: str,
        source_url: str,
        audio_format: str,
        error_message: str,
        video_title: Optional[str] = None,
    ) -> None:
        subject = f"[YTConverter] Conversion failed - {task_id}"
        body = "\n".join(
            [
                "A conversion failed.",
                "",
                f"Task ID: {task_id}",
                f"Status: error",
                f"Source URL: {source_url}",
                f"Title: {video_title or 'Unknown'}",
                f"Format: {audio_format}",
                f"Error: {error_message}",
                f"Timestamp (UTC): {self._utc_now()}",
            ]
        )
        self._send_async(subject, body)

    def _send_async(self, subject: str, body: str) -> None:
        if not self.enabled:
            logger.debug("Conversion email notifications disabled")
            return
        if not self.is_configured():
            logger.warning(
                "Conversion email notification skipped: SMTP is not fully configured "
                "(SMTP_HOST, SMTP_USER, SMTP_PASSWORD required)"
            )
            return

        thread = threading.Thread(
            target=self._send,
            args=(subject, body),
            daemon=True,
            name="conversion-email-notifier",
        )
        thread.start()

    def _send(self, subject: str, body: str) -> None:
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = self.smtp_from
        message["To"] = self.to_email
        message.set_content(body)

        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=20) as server:
                if self.smtp_use_tls:
                    server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)
            logger.info(f"Conversion notification email sent to {self.to_email}")
        except Exception as exc:
            logger.error(f"Failed to send conversion notification email: {exc}")

    @staticmethod
    def _utc_now() -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
