# /*
# ** EPITECH PROJECT, 2025
# ** AREA
# ** File description:
# ** services.py
# */

from typing import List

from fastapi import APIRouter
from sqlmodel import select

from app.main import SessionDep
from app.models.services import Service
from app.schemas.services import ServiceRead


services_router = APIRouter(
    prefix="/services",
    tags=["services"],
)


@services_router.get("/", response_model=List[ServiceRead])
def list_services(session: SessionDep):
    statement = select(Service).where(Service.is_active == True).order_by(Service.name)
    services = session.exec(statement).all()
    return services
