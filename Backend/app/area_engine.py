from typing import Dict, Any, List
from sqlmodel import Session, select
from app.oauth_models import Area, Service
from app.action import Action
from app.reaction import Reaction
from app.db import engine
import asyncio

async def trigger_areas(service: str, event_type: str, payload: Dict[str, Any]):
    with Session(engine) as session:
        service_obj = session.exec(select(Service).where(Service.name == service)).first()
        
        if not service_obj:
            return

        actions = session.exec(select(Action).where(Action.service_id == service_obj.id, Action.technical_key == event_type)).all()
        
        for action in actions:
            areas = session.exec(select(Area).where(Area.action_id == action.id, Area.is_active == True)).all()

            for area in areas:
                await execute_area(session, area, payload)

async def execute_area(session: Session, area: Area, trigger_data: Dict[str, Any]):
    try:
        reaction = session.get(Reaction, area.reaction_id)
        if not reaction:
            return

        reaction_service = session.get(Service, area.reaction_service_id)
        if not reaction_service:
            return

        if not check_action_conditions(area.params_action, trigger_data):
            return

        reaction_params = interpolate_parameters(
            area.params_reaction,
            trigger_data
        )

        await execute_reaction(
            service_name=reaction_service.name,
            reaction_key=reaction.technical_key,
            user_id=area.user_id,
            parameters=reaction_params,
            session=session
        )

        print(f"area {area.id} executed successfully")
        
    except Exception as e:
        print(f"err executing area {area.id}: {str(e)}")

def check_action_conditions(params: Dict[str, Any], data: Dict[str, Any]) -> bool:
    for key, expected_value in params.items():
        actual_value = get_nested_value(data, key)
        if actual_value != expected_value:
            return False
    
    return True

def interpolate_parameters(params: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
    result = {}
    for key, value in params.items():
        if isinstance(value, str) and value.startswith("{{") and value.endswith("}}"):
            var_path = value[2:-2].strip()
            result[key] = get_nested_value(data, var_path)
        else:
            result[key] = value
    
    return result

def get_nested_value(data: Dict, path: str) -> Any:
    keys = path.split(".")
    value = data
    for key in keys:
        value = value.get(key)
        if value is None:
            return None
    return value