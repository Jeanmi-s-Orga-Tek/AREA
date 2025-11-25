# ACTION-REACTION (AREA)

Automation platform inspired by **IFTTT/Zapier**.  
This repository currently contains only the **backend server** (FastAPI + PostgreSQL).  
Web client, mobile client and docker‑compose root setup are **not implemented yet**.

---

## What we have now

### Tech stack

- Backend: **FastAPI** (Python 3.9)
- DB: **PostgreSQL** via **SQLModel**
- Auth: **JWT** (email + password)
- Email helper: SMTP (env‑based config)
- Container: Docker image for the backend only

### Implemented features

- **Health check**
  - `GET /health` → `{"status": "ok"}`
- **about.json** (subject requirement)
  - `GET /about.json` returns:
    - `client.host`: caller IP
    - `server.current_time`: Unix timestamp
    - `server.services`: example `timer` service with actions/reactions
- **User management (minimal)**
  - Model: `User` (id, email, name, hashed_password, image?)
  - Endpoints under `/user`:
    - `POST /user/register`  
      - Body: `{ "email", "name", "new_password" }`  
      - Creates user, returns `{"status": "login success"}` and sets JWT cookie
    - `POST /user/login`  
      - Form: `username` (email), `password`  
      - Returns `{ "access_token", "token_type": "Bearer" }` and sets JWT cookie
    - `GET /user/` → list users (for now, no auth guard)
    - `GET /user/{user_id}` → get one user
    - `PATCH /user/{user_id}` → update user (name/email)
    - `DELETE /user/{user_id}` → delete user

> Note: There is **no** service/AREA/hook logic yet.  
> Only a stub `timer` service is exposed through `/about.json`.

---

## How to launch the project

### 1. Requirements

- Python **3.9**
- PostgreSQL running locally or reachable (create an empty DB, e.g. `area`)
- Optionally Docker (to run the backend in a container)

### 2. Environment variables

Backend needs at least:

```bash
POSTGRESQL_URI=postgresql+psycopg://<user>:<password>@<host>:<port>/<dbname>
SMTP_SERVER=smtp.example.com       # can be dummy for now
SMTP_PORT=465                      # must be set (int)
EMAIL_USERNAME=area@example.com    # can be dummy for now
EMAIL_PASSWORD=supersecret         # can be dummy for now
```

Example for local dev:

```bash
export POSTGRESQL_URI="postgresql+psycopg://area:area@localhost:5432/area"
export SMTP_SERVER="smtp.example.com"
export SMTP_PORT="465"
export EMAIL_USERNAME="area@example.com"
export EMAIL_PASSWORD="supersecret"
```

### 3. Install dependencies (local)

From project root:

```bash
cd Backend
python3.9 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Run the backend without Docker

Still in `Backend/`:

```bash
export POSTGRESQL_URI="postgresql+psycopg://area:area@localhost:5432/area"
# export SMTP_* and EMAIL_* as shown above

fastapi run app/main.py --port 8080
```

Server will be reachable at:

- `http://localhost:8080/health`
- `http://localhost:8080/about.json`
- `http://localhost:8080/docs`

### 5. Build and run the backend with Docker

From `Backend/`:

```bash
./build_fastapi_docker_image.sh
```

Then run:

```bash
docker run --rm \
  -e POSTGRESQL_URI="postgresql+psycopg://area:area@host.docker.internal:5432/area" \
  -e SMTP_SERVER="smtp.example.com" \
  -e SMTP_PORT="465" \
  -e EMAIL_USERNAME="area@example.com" \
  -e EMAIL_PASSWORD="supersecret" \
  -p 8080:80 \
  area-fastapi
```

Check:

- `http://localhost:8080/health`
- `http://localhost:8080/about.json`

---

## Current limitations

- No AREA / hook engine.
- No external services (Gmail, GitHub, etc.).
- No web client, no mobile client, no root `docker-compose.yml`.

This README reflects only **what exists now** and **how to run it**.
