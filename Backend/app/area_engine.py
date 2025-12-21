from typing import Dict, Any, List
from sqlmodel import Session, select
from app.oauth_models import Area, Service
from app.action import Action
from app.reaction import Reaction
from app.db import engine
from app.executors.base import execute_reaction
import asyncio
import re


def reaction_name_to_key(name: str) -> str:
    if " - " in name:
        name = name.split(" - ", 1)[1]
    key = name.lower().replace(" ", "_")
    key = re.sub(r'[^a-z0-9_]', '', key)
    return key


def action_name_to_key(name: str) -> str:
    if " - " in name:
        name = name.split(" - ", 1)[1]
    key = name.lower().replace(" ", "_")
    key = re.sub(r'[^a-z0-9_]', '', key)
    return key


async def trigger_areas_with_handlers(service: str, event_type: str, payload: Dict[str, Any]):
    with Session(engine) as session:
        service_obj = session.exec(select(Service).where(Service.name == service)).first()
        
        if not service_obj:
            print(f"Service {service} not found")
            return

        all_actions = session.exec(
            select(Action).where(Action.service_id == service_obj.id)
        ).all()

        matching_actions = [
            action for action in all_actions 
            if action_name_to_key(action.name) == event_type
        ]
        
        if not matching_actions:
            print(f"No actions found for {service}.{event_type}")
            return

        for action in matching_actions:
            areas = session.exec(
                select(Area).where(
                    Area.action_id == action.id, 
                    Area.is_active == True
                )
            ).all()

            for area in areas:
                await execute_area(session, area, payload)


async def trigger_areas(service: str, event_type: str, payload: Dict[str, Any]):
    with Session(engine) as session:
        service_obj = session.exec(select(Service).where(Service.name == service)).first()
        
        if not service_obj:
            return

        actions = session.exec(select(Action).where(Action.service_id == service_obj.id, Action.name == event_type)).all()
        
        for action in actions:
            areas = session.exec(select(Area).where(Area.action_id == action.id, Area.is_active == True)).all()

            for area in areas:
                await execute_area(session, area, payload)

async def execute_area(session: Session, area: Area, trigger_data: Dict[str, Any]):
    try:
        reaction = session.get(Reaction, area.reaction_id)
        if not reaction:
            print(f"Reaction not found for AREA {area.id}")
            return

        reaction_service = session.get(Service, area.reaction_service_id)
        if not reaction_service:
            print(f"Service not found for AREA {area.id}")
            return

        print(f"Checking conditions for AREA {area.id}: {area.name}")
        if not check_action_conditions(area.params_action, trigger_data):
            print(f"Conditions not met, skipping AREA {area.id}")
            return

        print(f"Conditions met, interpolating parameters")
        reaction_params = interpolate_parameters(
            area.params_reaction,
            trigger_data
        )

        print(f"Executing AREA {area.id}: {area.name}")
        print(f"Reaction: {reaction_service.name}.{reaction.name}")
        print(f"Parameters: {reaction_params}")

        reaction_key = reaction_name_to_key(reaction.name)
        print(f"Executor key: {reaction_key}")

        await execute_reaction(
            service_name=reaction_service.name,
            reaction_key=reaction_key,
            user_id=area.user_id,
            parameters=reaction_params,
            session=session
        )

        print(f"AREA {area.id} executed successfully !!!!!!")
        
    except Exception as e:
        print(f"Error executing AREA {area.id}: {str(e)}")
        import traceback
        traceback.print_exc()

def check_action_conditions(params: Dict[str, Any], data: Dict[str, Any]) -> bool:
    for key, expected_value in params.items():
        actual_value = get_nested_value(data, key)
        if actual_value != expected_value:
            print(f"WRONG VALUE ! {key} : {actual_value} != {expected_value}")
            return False
    
    return True

def interpolate_parameters(params: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
    import re
    
    result = {}
    for key, value in params.items():
        if isinstance(value, str):
            if "{{" in value and "}}" in value:
                def replace_var(match):
                    var_path = match.group(1).strip()
                    var_value = get_nested_value(data, var_path)
                    return str(var_value) if var_value is not None else ""
                
                result[key] = re.sub(r'\{\{([^}]+)\}\}', replace_var, value)
            else:
                result[key] = value
        elif isinstance(value, list):
            result[key] = [
                interpolate_single_value(item, data) if isinstance(item, str) else item
                for item in value
            ]
        else:
            result[key] = value
    
    return result

def interpolate_single_value(value: str, data: Dict[str, Any]) -> str:
    import re
    
    if "{{" not in value or "}}" not in value:
        return value
    
    def replace_var(match):
        var_path = match.group(1).strip()
        var_value = get_nested_value(data, var_path)
        return str(var_value) if var_value is not None else ""
    
    return re.sub(r'\{\{([^}]+)\}\}', replace_var, value)

def get_nested_value(data: Dict, path: str) -> Any:
    import re

    components = re.split(r'[\.\[]', path)
    value = data
    
    for component in components:
        if not component:
            continue

        if component.endswith(']'):
            index = int(component[:-1])
            if isinstance(value, list) and 0 <= index < len(value):
                value = value[index]
            else:
                return None
        elif isinstance(value, dict):
            value = value.get(component)
        else:
            return None
        
        if value is None:
            return None
    
    return value