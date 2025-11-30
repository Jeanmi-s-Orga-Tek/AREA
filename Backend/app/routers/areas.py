# /*
# ** EPITECH PROJECT, 2025
# ** AREA
# ** File description:
# ** areas.py
# */

from datetime import datetime
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import SessionDep
from app.oauth_models import Area, Service, UserServiceSubscription
from app.action import Action
from app.reaction import Reaction
from app.oauth2 import oauth2_scheme
from app.schemas.services import AreaCreate, AreaRead, AreaDetailRead, AreaActionDetail, AreaReactionDetail, ServiceBasicRead, ActionRead, ReactionRead
from app.user import get_user_from_token

areas_router = APIRouter(
    prefix="/areas",
    tags=["areas"],
)

TokenDep = Annotated[str, Depends(oauth2_scheme)]

def require_service(session: Session, service_id: int) -> Service:
    service = session.get(Service, service_id)
    if service is None or service.is_active is False:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service

def require_action(session: Session, action_id: int, service_id: int) -> Action:
    action = session.get(Action, action_id)
    if action is None or action.service_id != service_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action")
    return action


def require_reaction(session: Session, reaction_id: int, service_id: int) -> Reaction:
    reaction = session.get(Reaction, reaction_id)
    if reaction is None or reaction.service_id != service_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reaction")
    return reaction


def require_subscription(session: Session, user_id: int, service_id: int):
    statement = select(UserServiceSubscription).where(
        UserServiceSubscription.user_id == user_id,
        UserServiceSubscription.service_id == service_id,
        UserServiceSubscription.is_active == True,
    )
    subscription = session.exec(statement).first()
    if subscription is None:
        subscription = UserServiceSubscription(
            user_id = user_id,
            service_id = service_id,
            is_active = True
        )
        session.add(subscription)
        session.commit()
        session.refresh(subscription)


@areas_router.post("/", response_model=AreaRead)
def create_area(area_data: AreaCreate, session: SessionDep, token: TokenDep):
    user = get_user_from_token(token, session)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    require_service(session, area_data.action_service_id)
    require_service(session, area_data.reaction_service_id)
    require_action(session, area_data.action_id, area_data.action_service_id)
    require_reaction(session, area_data.reaction_id, area_data.reaction_service_id)
    require_subscription(session, user.id, area_data.action_service_id)
    require_subscription(session, user.id, area_data.reaction_service_id)
    
    # Generate default name if not provided
    action = session.get(Action, area_data.action_id)
    reaction = session.get(Reaction, area_data.reaction_id)
    default_name = f"{action.name} → {reaction.name}" if action and reaction else "Unnamed AREA"
    
    area = Area(
        user_id=user.id,
        name=area_data.name or default_name,
        action_service_id=area_data.action_service_id,
        action_id=area_data.action_id,
        reaction_service_id=area_data.reaction_service_id,
        reaction_id=area_data.reaction_id,
        params_action=area_data.action_parameters,
        params_reaction=area_data.reaction_parameters,
        is_active=area_data.is_active,
    )
    session.add(area)
    session.commit()
    session.refresh(area)
    return AreaRead.model_validate(area)


@areas_router.get("/", response_model=List[AreaDetailRead])
def list_areas(session: SessionDep, token: TokenDep):
    user = get_user_from_token(token, session)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    statement = select(Area).where(Area.user_id == user.id)
    areas = session.exec(statement).all()
    
    result = []
    for area in areas:
        action_service = session.get(Service, area.action_service_id)
        action = session.get(Action, area.action_id)

        reaction_service = session.get(Service, area.reaction_service_id)
        reaction = session.get(Reaction, area.reaction_id)
        
        if not all([action_service, action, reaction_service, reaction]):
            continue

        area_name = area.name or f"{action.name} → {reaction.name}"
        
        area_detail = AreaDetailRead(
            id = area.id,
            name = area_name,
            action = AreaActionDetail(
                service = ServiceBasicRead(
                    id = action_service.id,
                    name = action_service.name,
                    display_name = action_service.display_name,
                    description = action_service.description,
                    icon_url = action_service.icon_url,
                ),
                action = ActionRead(
                    id = action.id,
                    name = action.name,
                    description = action.description,
                    is_polling = action.is_polling,
                    service_id = action.service_id,
                ),
            ),
            reaction = AreaReactionDetail(
                service = ServiceBasicRead(
                    id = reaction_service.id,
                    name = reaction_service.name,
                    display_name = reaction_service.display_name,
                    description = reaction_service.description,
                    icon_url = reaction_service.icon_url,
                ),
                reaction = ReactionRead(
                    id = reaction.id,
                    name = reaction.name,
                    description = reaction.description,
                    url = reaction.url,
                    service_id = reaction.service_id,
                ),
            ),
            action_parameters = area.params_action or {},
            reaction_parameters = area.params_reaction or {},
            is_active = area.is_active,
            created_at = area.created_at,
            updated_at = area.updated_at,
        )
        result.append(area_detail)
    
    return result


def require_area(session: SessionDep, area_id: int, user_id: int) -> Area:
    area = session.get(Area, area_id)
    if area is None or area.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    return area


@areas_router.patch("/{area_id}/toggle", response_model=AreaRead)
def toggle_area(area_id: int, session: SessionDep, token: TokenDep):
    user = get_user_from_token(token, session)
    area = require_area(session, area_id, user.id)
    area.is_active = not area.is_active
    area.updated_at = datetime.utcnow()
    session.add(area)
    session.commit()
    session.refresh(area)
    return AreaRead.model_validate(area)


@areas_router.delete("/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_area(area_id: int, session: SessionDep, token: TokenDep):
    user = get_user_from_token(token, session)
    area = require_area(session, area_id, user.id)
    session.delete(area)
    session.commit()
