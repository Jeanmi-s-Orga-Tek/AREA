from datetime import timedelta
from typing import Annotated, Any, Dict, List, Optional, Union, cast
import jwt
from fastapi import APIRouter, Depends, Form, HTTPException, Query, status
from fastapi.security import OAuth2, OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel, create_engine, select
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.dialects.postgresql import JSONB

from app.db import SessionDep

class Service(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = Field(default=None)
    parameters: Optional[dict] = Field(sa_type=JSONB)

class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    parameters: Optional[dict] = Field(sa_type=JSONB)

class ServiceCreate(ServiceBase):
    pass

class ServiceRead(ServiceBase):
    id: int

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

service_router = APIRouter(
    prefix="/service",
    tags=["services"],
    responses={404: {"description": "Not found"}},
)

@service_router.get("/", response_model=List[ServiceRead], tags=["services"])
def read_services(
    session: SessionDep,
    skip: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
    ):
    services = session.exec(select(Service).offset(skip).limit(limit)).all()
    return services

@service_router.get("/{service_id}", response_model=ServiceRead, tags=["services"])
def read_service(
    service_id: int,
    session: SessionDep,
    ):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="service not found")
    return service

# @service_router.post("/", response_model=ServiceRead, status_code=201, tags=["services"])
# def create_service(
#     service: ServiceCreate,
#     session: SessionDep,
#     ):
#     db_service = Service.model_validate(service)
#     session.add(db_service)
#     session.commit()
#     session.refresh(db_service)
#     return db_service

# @service_router.patch("/{service_id}", response_model=ServiceRead, tags=["services"])
# def update_service(
#     service_id: int,
#     service: ServiceUpdate,
#     session: SessionDep,
#     ):
#     db_service = session.get(Service, service_id)
#     if not db_service:
#         raise HTTPException(status_code=404, detail="service not found")
#     service_data = service.model_dump(exclude_unset=True)
#     db_service.sqlmodel_update(service_data)
#     session.add(db_service)
#     session.commit()
#     session.refresh(db_service)
#     return db_service

# @service_router.delete("/{service_id}", tags=["services"])
# def delete_service(
#     service_id: int,
#     session: SessionDep,
#     ):
#     db_service = session.get(Service, service_id)
#     if not db_service:
#         raise HTTPException(status_code=404, detail="service not found")
#     session.delete(db_service)
#     session.commit()
#     return {"ok": True}
