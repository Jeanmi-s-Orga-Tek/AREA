# /*
# ** EPITECH PROJECT, 2025
# ** AREA
# ** File description:
# ** areas.py
# */

from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.main import SessionDep
from app.models.services import Area, Service, ServiceAction, ServiceReaction, UserServiceSubscription
from app.oauth2 import oauth2_scheme
from app.schemas.services import AreaCreate, AreaRead
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


def require_action(session: Session, action_id: int, service_id: int) -> ServiceAction:
    action = session.get(ServiceAction, action_id)
    if action is None or action.service_id != service_id or action.is_active is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action")
    return action


def require_reaction(session: Session, reaction_id: int, service_id: int) -> ServiceReaction:
    reaction = session.get(ServiceReaction, reaction_id)
    if reaction is None or reaction.service_id != service_id or reaction.is_active is False:
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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Subscription required")


@areas_router.post("/", response_model=AreaRead)
def create_area(area_data: AreaCreate, session: SessionDep, token: TokenDep):
    user = get_user_from_token(token, session)
    if user.id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user")
    require_service(session, area_data.action_service_id)
    require_service(session, area_data.reaction_service_id)
    require_action(session, area_data.action_id, area_data.action_service_id)
    require_reaction(session, area_data.reaction_id, area_data.reaction_service_id)
    require_subscription(session, user.id, area_data.action_service_id)
    require_subscription(session, user.id, area_data.reaction_service_id)
    area = Area(
        user_id=user.id,
        action_service_id=area_data.action_service_id,
        action_id=area_data.action_id,
        reaction_service_id=area_data.reaction_service_id,
        reaction_id=area_data.reaction_id,
        params_action=area_data.params_action,
        params_reaction=area_data.params_reaction,
        is_active=area_data.is_active,
    )
    session.add(area)
    session.commit()
    session.refresh(area)
    return AreaRead.model_validate(area)


@areas_router.get("/", response_model=List[AreaRead])
def list_areas(session: SessionDep, token: TokenDep):
    user = get_user_from_token(token, session)
    if user.id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user")
    statement = select(Area).where(Area.user_id == user.id).order_by(Area.created_at.desc())
    areas = session.exec(statement).all()
    return [AreaRead.model_validate(area) for area in areas]
