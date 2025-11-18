from typing import NoReturn
import asyncio

from app.client_discord import send_discord_message


async def _main() -> None:
    await send_discord_message("This is a test from client")


if __name__ == "__main__":
    asyncio.run(_main())

