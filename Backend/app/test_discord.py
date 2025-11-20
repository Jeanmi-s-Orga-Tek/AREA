import asyncio
import json
from typing import Any, Dict

import httpx

from app.client_discord import send_discord_message


async def _main() -> None:
    captured: Dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["json"] = json.loads(request.content)
        return httpx.Response(status_code=204)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        await send_discord_message(
            "Test message from test_discord.py",
            webhook_url="https://discord.com/api/webhooks/test",
            client=client,
        )

    print("Captured Discord call:", captured)


if __name__ == "__main__":
    asyncio.run(_main())
