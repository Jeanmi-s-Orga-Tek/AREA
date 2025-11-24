import time

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse


router = APIRouter(tags=["poc"])


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/about.json")
async def about(request: Request):
    client_host = get_client_ip(request)
    current_time = int(time.time())
    services = [
        {
            "name": "timer",
            "actions": [
                {"name": "at_time", "description": "The current time matches HH:MM"},
                {"name": "on_date", "description": "The current date matches DD/MM"},
            ],
            "reactions": [
                {"name": "log", "description": "Record a log entry"}
            ],
        }
    ]
    return JSONResponse(
        {
            "client": {"host": client_host},
            "server": {
                "current_time": current_time,
                "services": services,
            },
        }
    )

