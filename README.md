# ACTION-REACTION (AREA)

Automation platform inspired by **IFTTT/Zapier** allowing users to create custom workflows by connecting actions and reactions across multiple services.

---

## Project Structure

- **Backend**: FastAPI server with AREA engine, OAuth2, webhooks, and polling workers
- **Front**: React web client (AREAA)
- **Mobile**: React Native mobile app (Android/iOS)
- **Database**: PostgreSQL with SQLModel ORM
- **Deployment**: Docker Compose orchestration

---

## Features

### Core Functionality
- **AREA Engine**: Action-Reaction automation system with polling and webhook support
- **7 Integrated Services**: Discord, GitHub, Google (Gmail/YouTube), Microsoft (Outlook/OneDrive), Spotify, Timer, Trello
- **User Management**: Registration, login, JWT authentication
- **OAuth2 Flow**: Complete OAuth integration for external services
- **Token Refresh**: Automatic token renewal for connected services
- **Service Manager**: Dynamic service configuration from YAML files

### API Endpoints
- **Health & Info**: `/health`, `/about.json` (client IP, timestamp, services)
- **User**: Registration, login, CRUD operations
- **Services**: List services, actions, reactions
- **OAuth**: `/oauth/{service}/authorize`, `/oauth/{service}/callback`, `/oauth/{service}/token/refresh`
- **AREA Management**: Create, list, update, delete user workflows
- **Webhooks**: Service-specific webhook receivers
- **Docs**: Interactive API documentation at `/docs`

### Architecture Highlights
- **Handlers**: Process incoming events from services
- **Executors**: Execute reactions based on triggers
- **Polling Worker**: Background task for polling-based actions
- **Webhook Manager**: Dynamic webhook registration/cleanup

---

## Quick Start

> **Fast Launch**: Run `./launch_docker.sh` from project root to start all services with Docker Compose.

### Requirements
- Docker & Docker Compose
- (Optional) Python 3.9+ for local backend development

### Environment Setup

Create a `.env` file at project root with:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=area
POSTGRESQL_URI=postgresql+psycopg://postgres:postgres@db:5432/area

# Email (can be dummy for basic testing)
SMTP_SERVER=smtp.example.com
SMTP_PORT=465
EMAIL_USERNAME=area@example.com
EMAIL_PASSWORD=supersecret

# OAuth credentials (required for service integrations)
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
TRELLO_API_KEY=your_trello_api_key
TRELLO_API_SECRET=your_trello_api_secret
```

### Launch with Docker Compose

```bash
# Build backend image
cd Backend && ./build_fastapi_docker_image.sh && cd ..

# Start all services
./launch_docker.sh
```

**Services will be available at:**
- Backend API: `http://localhost:8080` (see `/docs` for API documentation)
- Web Client: `http://localhost:8081`
- Database Admin: `http://localhost:8123` (Adminer)
- Mobile APK: Download from web client

### Manual Backend Development

```bash
cd Backend
python3.9 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Set environment variables (use localhost for local PostgreSQL)
export POSTGRESQL_URI="postgresql+psycopg://postgres:postgres@localhost:5432/area"
# ... other variables

# Run server
fastapi dev app/main.py --port 8080
```

---

## Current limitations

- No AREA / hook engine.
- No external services (Gmail, GitHub, etc.).
- No web client, no mobile client, no root `docker-compose.yml`.

This README reflects only **what exists now** and **how to run it**.
Development

### Available Services

Each service is configured via YAML files in `Backend/services/`:
- **Discord**: Webhooks for channel messages
- **GitHub**: Repository events (push, issues, PRs)
- **Google**: Gmail and YouTube integrations
- **Microsoft**: Outlook and OneDrive
- **Spotify**: Playlist and playback management
- **Timer**: Time-based triggers (cron-like)
- **Trello**: Board and card automations

### Testing

```bash
cd Backend
pytest tests/
```

---

## Project Status

Fully functional AREA automation platform with web/mobile clients, OAuth integrations, and multi-service support. Ready for deployment and customization