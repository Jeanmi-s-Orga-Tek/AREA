import os
import httpx

DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL")

async def send_discord_message(content: str) -> None:
    """
    Send a simple content message to a Discord channel via webhook.
    If DISCORD_WEBHOOK_URL is not set, just log and return.
    """
    if not DISCORD_WEBHOOK_URL:
        print("[DISCORD] DISCORD_WEBHOOK_URL not set, skipping message")
        return
    payload = {"content": content}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10)
        if resp.status_code >= 400:
            print(f"[DISCORD] Error {resp.status_code}: {resp.text}")
        else:
            print(f"[DISCORD] Message sent: {content}")
    except Exception as e:
        print(f"[DISCORD] Exception while sending message: {e}")
