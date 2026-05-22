"""
Email notifications for conversion success and failure.

Supports:
- Resend HTTPS API (recommended on Railway Hobby — SMTP ports are blocked)
- SMTP (works on VPS/local or Railway Pro+)
"""

from __future__ import annotations

import os
import smtplib
import threading
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Optional

import requests

from utils.logger import setup_logger

logger = setup_logger(__name__)

DEFAULT_NOTIFY_EMAIL = "info.producertools@gmail.com"
RESEND_API_URL = "https://api.resend.com/emails"


class ConversionEmailNotifier:
    """Sends email alerts when conversions complete or fail."""

    def __init__(self):
        self.enabled = os.environ.get("CONVERSION_NOTIFY_ENABLED", "true").strip().lower() in (
            "1",
            "true",
            "yes",
            "on",
        )
        self.to_email = os.environ.get("CONVERSION_NOTIFY_EMAIL", DEFAULT_NOTIFY_EMAIL).strip()

        self.resend_api_key = os.environ.get("RESEND_API_KEY", "").strip()
        self.resend_from = os.environ.get(
            "RESEND_FROM",
            "YTConverter <onboarding@resend.dev>",
        ).strip()

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

        provider = os.environ.get("EMAIL_PROVIDER", "").strip().lower()
        if provider == "resend":
            self._provider = "resend"
        elif provider == "smtp":
            self._provider = "smtp"
        elif self.resend_api_key:
            self._provider = "resend"
        elif self._smtp_configured():
            self._provider = "smtp"
        else:
            self._provider = None

    def _smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    def is_configured(self) -> bool:
        if self._provider == "resend":
            return bool(self.resend_api_key and self.to_email)
        if self._provider == "smtp":
            return bool(self._smtp_configured() and self.to_email)
        return False

    def provider_name(self) -> Optional[str]:
        return self._provider

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
                "Conversion email notification skipped: configure RESEND_API_KEY (Railway) "
                "or SMTP_HOST/SMTP_USER/SMTP_PASSWORD (VPS)"
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
        try:
            if self._provider == "resend":
                self._send_resend(subject, body)
            else:
                self._send_smtp(subject, body)
            logger.info(
                f"Conversion notification email sent to {self.to_email} "
                f"via {self._provider}"
            )
        except Exception as exc:
            logger.error(f"Failed to send conversion notification email: {exc}")

    def _send_resend(self, subject: str, body: str) -> None:
        response = requests.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {self.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": self.resend_from,
                "to": [self.to_email],
                "subject": subject,
                "text": body,
            },
            timeout=20,
        )
        if response.status_code >= 400:
            raise RuntimeError(
                f"Resend API error {response.status_code}: {response.text[:500]}"
            )

    def _send_smtp(self, subject: str, body: str) -> None:
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = self.smtp_from
        message["To"] = self.to_email
        message.set_content(body)

        if self.smtp_port == 465 and not self.smtp_use_tls:
            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=20) as server:
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=20) as server:
                if self.smtp_use_tls:
                    server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)

    @staticmethod
    def _utc_now() -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
