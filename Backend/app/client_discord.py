import os
from typing import Optional

import httpx


async def send_discord_message(
    content: str,
    *,
    webhook_url: Optional[str] = None,
    client: Optional[httpx.AsyncClient] = None,
) -> None:
    """Send JSON payload to the configured Discord webhook."""
    url = webhook_url or os.environ.get("DISCORD_WEBHOOK_URL")
    if not url:
        print("[DISCORD] DISCORD_WEBHOOK_URL not set, skipping message")
        return

    payload = {"content": content}
    should_close = client is None
    client = client or httpx.AsyncClient()

    try:
        resp = await client.post(url, json=payload, timeout=10)
        if resp.status_code >= 400:
            print(f"[DISCORD] Error {resp.status_code}: {resp.text}")
        else:
            print(f"[DISCORD] Message sent: {content}")
    except Exception as e:
        print(f"[DISCORD] Exception while sending message: {e}")
    finally:
        if should_close:
            await client.aclose()
