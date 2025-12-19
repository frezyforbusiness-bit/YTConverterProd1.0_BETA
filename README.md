# YouTube Audio Converter API

A Flask REST API for asynchronous YouTube video to audio conversion with BPM and key detection.

## Features

- **Asynchronous Conversion**: Non-blocking task-based conversion system
- **Multiple Formats**: Supports MP3, WAV, FLAC, OGG, M4A, and Opus
- **BPM & Key Detection**: Automatic tempo and musical key detection using librosa
- **Task Management**: Thread-safe task status tracking with polling support
- **Automatic Cleanup**: Background cleanup of old temporary files
- **Production Ready**: Configured for deployment on Render.com

## Requirements

- Python 3.11+
- ffmpeg (must be installed on the system)
- Internet connection for YouTube downloads

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd YTConverter
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Install ffmpeg:
   - **Linux**: `sudo apt-get install ffmpeg`
   - **macOS**: `brew install ffmpeg`
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

5. (Optional) Set up YouTube cookies:
```bash
yt-dlp --cookies-from-browser chrome --cookies cookies.txt
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key environment variables:
- `PORT`: Flask port (default: 5000)
- `FLASK_ENV`: development or production
- `TEMP_DIR`: Directory for temporary files
- `TASK_TIMEOUT`: Task timeout in seconds (default: 1800)
- `CLEANUP_INTERVAL`: Cleanup interval in seconds (default: 3600)
- `COOKIES_FILE`: Path to YouTube cookies file (optional)
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)

## Running Locally

### Opzione 1: Script automatico (consigliato)

Usa lo script Python che avvia tutto automaticamente e apre il browser:

```bash
python start.py
```

Oppure lo script bash (Linux/macOS):

```bash
./start.sh
```

Lo script:
- Crea/attiva il virtual environment
- Installa le dipendenze se necessario
- Avvia il server Flask
- Apre automaticamente il browser con il frontend

### Opzione 2: Avvio manuale

```bash
# Attiva virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Avvia il server
python app.py
```

Il frontend sarà disponibile su `http://localhost:5000`  
L'API sarà disponibile su `http://localhost:5000/api`

## API Endpoints

### GET /
Serves the frontend interface (index.html).

### GET /api
Returns API status and available endpoints.

**Response:**
```json
{
  "message": "YouTube Audio Converter API",
  "status": "running",
  "endpoints": {
    "health": "/health",
    "convert": "/convert (POST)",
    "status": "/status/<task_id> (GET)",
    "download": "/download/<task_id> (GET)"
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

### POST /convert
Starts a conversion task.

**Request Body:**
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=...",
  "format": "mp3"
}
```

**Response:**
```json
{
  "task_id": "<uuid>"
}
```

### GET /status/<task_id>
Gets the status of a conversion task.

**Response:**
```json
{
  "status": "pending" | "processing" | "done" | "error",
  "progress": 0-100,
  "file_path": null | "string",
  "error": null | "string",
  "message": "string"
}
```

### GET /download/<task_id>
Downloads the converted file (only when status is "done").

**Response:**
- File download (binary)
- 400 if task not completed
- 404 if task doesn't exist or file not found

## Frontend

The frontend is included in the `frontend/` directory. To serve it:

1. Use a static file server (e.g., Python's http.server):
```bash
cd frontend
python -m http.server 8000
```

2. Or integrate with Flask to serve static files (modify `app.py`)

## Deployment on Render.com

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. Create a new Web Service on Render.com

3. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Environment**: Python 3

4. Set environment variables in Render dashboard:
   - `PORT`: (auto-set by Render)
   - `FLASK_ENV`: `production`
   - `TASK_TIMEOUT`: `1800`
   - `CLEANUP_INTERVAL`: `3600`
   - `LOG_LEVEL`: `INFO`

5. **Important**: Render.com requires ffmpeg to be installed. You may need to:
   - Use a custom Dockerfile with ffmpeg
   - Or use a build script to install ffmpeg

## Project Structure

```
YTConverter/
├── app.py                 # Flask application entry point
├── requirements.txt       # Python dependencies
├── Procfile              # Render.com process file
├── runtime.txt           # Python version
├── .env.example          # Environment variables template
├── services/
│   ├── converter.py      # YouTube download and audio conversion
│   └── task_manager.py   # Task status management
├── utils/
│   ├── validators.py     # Input validation
│   ├── cleanup.py        # File cleanup utilities
│   └── logger.py         # Logging configuration
└── frontend/             # Frontend HTML/CSS/JS
    ├── index.html
    ├── script.js
    └── style.css
```

## Error Handling

The API returns consistent JSON error responses:

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid input)
- `404`: Resource not found
- `500`: Internal server error

## Logging

Logs are written to:
- Console (always)
- `logs/ytconverter.log` (in production mode)

Log levels can be controlled via `LOG_LEVEL` environment variable.

## License

[Your License Here]

## Contributing

[Contributing Guidelines Here]

