# /*
# ** EPITECH PROJECT, 2025
# ** AREA
# ** File description:
# ** services.py
# */

from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select

from app.db import SessionDep
from app.models.services import Service, ServiceAction, ServiceReaction, UserServiceSubscription
from app.oauth2 import oauth2_scheme
from app.schemas.services import (
    ServiceActionRead,
    ServiceCapabilitiesRead,
    ServiceReactionRead,
    ServiceRead,
    SubscriptionRead,
)
from app.user import get_user_from_token


services_router = APIRouter(
    prefix="/services",
    tags=["services"],
)

TokenDep = Annotated[str, Depends(oauth2_scheme)]


@services_router.get("/", response_model=List[ServiceRead])
def list_services(session: SessionDep):
    statement = select(Service).where(Service.is_active == True).order_by(Service.name)
    services = session.exec(statement).all()
    return services


def serialize_subscription(subscription: UserServiceSubscription) -> SubscriptionRead:
    return SubscriptionRead(
        service_id=subscription.service_id,
        user_id=subscription.user_id,
        status="active" if subscription.is_active else "inactive",
        created_at=subscription.created_at,
    )


@services_router.get("/{service_id}/capabilities", response_model=ServiceCapabilitiesRead)
def get_service_capabilities(service_id: int, session: SessionDep):
    service = session.get(Service, service_id)
    if service is None or service.is_active is False:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    actions_statement = select(ServiceAction).where(
        ServiceAction.service_id == service_id,
        ServiceAction.is_active == True,
    ).order_by(ServiceAction.name)
    reactions_statement = select(ServiceReaction).where(
        ServiceReaction.service_id == service_id,
        ServiceReaction.is_active == True,
    ).order_by(ServiceReaction.name)
    actions = session.exec(actions_statement).all()
    reactions = session.exec(reactions_statement).all()
    return ServiceCapabilitiesRead(
        service=ServiceRead.model_validate(service),
        actions=[ServiceActionRead.model_validate(action) for action in actions],
        reactions=[ServiceReactionRead.model_validate(reaction) for reaction in reactions],
    )


@services_router.post("/{service_id}/subscribe", response_model=SubscriptionRead)
def subscribe_service(service_id: int, session: SessionDep, token: TokenDep):
    user = get_user_from_token(token, session)
    if user is None or user.id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user")
    service = session.get(Service, service_id)
    if service is None or service.is_active is False:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    statement = select(UserServiceSubscription).where(
        UserServiceSubscription.user_id == user.id,
        UserServiceSubscription.service_id == service_id,
    )
    subscription = session.exec(statement).first()
    if subscription is None:
        subscription = UserServiceSubscription(user_id=user.id, service_id=service_id, is_active=True)
        session.add(subscription)
    elif subscription.is_active is False:
        subscription.is_active = True
        session.add(subscription)
    session.commit()
    session.refresh(subscription)
    return serialize_subscription(subscription)


@services_router.delete("/{service_id}/subscribe", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe_service(service_id: int, session: SessionDep, token: TokenDep):
    user = get_user_from_token(token, session)
    if user is None or user.id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user")
    service = session.get(Service, service_id)
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    statement = select(UserServiceSubscription).where(
        UserServiceSubscription.user_id == user.id,
        UserServiceSubscription.service_id == service_id,
    )
    subscription = session.exec(statement).first()
    if subscription is None:
        return
    if subscription.is_active is False:
        return
    subscription.is_active = False
    session.add(subscription)
    session.commit()
