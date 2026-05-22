# Conversion Email Notifications

## Prova rapida (solo 2 passi)

1. Apri `.env` e imposta `SMTP_PASSWORD` (Gmail App Password).
2. Esegui:

```bash
chmod +x scripts/shell/try_email_notifications.sh
./scripts/shell/try_email_notifications.sh
```

Se ricevi 2 email di test (success + error), avvia l'app e prova una conversione reale:

```bash
python start.py
```

Deploy automatico variabili email sul server:

```bash
chmod +x scripts/shell/deploy_email_env_to_server.sh
./scripts/shell/deploy_email_env_to_server.sh
```

---

The backend can send an email to `info.producertools@gmail.com` (or a custom recipient) whenever a conversion:

- completes successfully (`done`)
- fails (`error`)

## Required environment variables

Set these in your deployment `.env`:

```env
CONVERSION_NOTIFY_ENABLED=true
CONVERSION_NOTIFY_EMAIL=info.producertools@gmail.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USER=your-sender@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=your-sender@gmail.com
```

## Gmail setup

1. Enable 2FA on the Gmail account used as sender.
2. Create an App Password in Google Account security settings.
3. Use that App Password as `SMTP_PASSWORD`.

## Behavior

- Notifications are sent asynchronously and never block conversion.
- If SMTP is not configured, conversions still run normally; a warning is logged once at startup.
- Set `CONVERSION_NOTIFY_ENABLED=false` to disable alerts without removing SMTP settings.
