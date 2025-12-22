import asyncio
from typing import Dict, Any
from sqlmodel import Session, select

from app.oauth_models import Area, Service
from app.action import Action
from app.db import engine
from app.area_engine import execute_area, action_name_to_key
from app.handlers import get_polling_handler


async def polling_worker():
    print("Polling worker started")
    
    while True:
        try:
            with Session(engine) as session:
                polling_actions = session.exec(
                    select(Action).where(Action.is_polling == True)
                ).all()
                
                print(f"Found {len(polling_actions)} polling actions")
                for action in polling_actions:
                    print(f"Polling action: {action.name}")
                    await poll_action(session, action)
            
            await asyncio.sleep(60)
            
        except Exception as e:
            print(f"Polling worker error: {e}")
            import traceback
            traceback.print_exc()
            await asyncio.sleep(10)


async def poll_action(session: Session, action: Action):
    service = session.get(Service, action.service_id)
    if not service:
        print(f"Service not found for action {action.name}")
        return

    action_key = action_name_to_key(action.name)
    handler = get_polling_handler(service.name, action_key)
    
    if not handler:
        print(f"No handler found for {service.name}.{action_key}")
        return

    areas = session.exec(
        select(Area).where(
            Area.action_id == action.id,
            Area.is_active == True
        )
    ).all()

    print(f"Found {len(areas)} active areas for {service.name}.{action_key}")

    for area in areas:
        try:
            print(f"Polling AREA {area.id}: {area.name}")
            result = await handler.poll(session, area.user_id, area.params_action)
            
            if result and result.triggered:
                print(f"Polling triggered for AREA {area.id}: {area.name}")
                await execute_area(session, area, result.payload)
            else:
                print(f"No trigger for AREA {area.id}")
                
        except Exception as e:
            print(f"Error polling AREA {area.id}: {e}")
            import traceback
            traceback.print_exc()
