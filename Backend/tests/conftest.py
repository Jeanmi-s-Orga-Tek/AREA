##
## EPITECH PROJECT, 2026
## AREA
## File description:
## conftest
##

import os
import sys
from contextlib import asynccontextmanager
from datetime import timedelta
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy import JSON as SAJSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.pool import StaticPool

os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
os.environ["POSTGRESQL_URI"] = "postgresql+psycopg://test:test@localhost/test"

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

try:
    import sqlite3
except ModuleNotFoundError:
    import pysqlite3

    sys.modules["sqlite3"] = pysqlite3
    sys.modules["_sqlite3"] = pysqlite3.dbapi2

try:
    import pydantic_settings
except ImportError:
    import types

    class _BaseSettings:  # minimal stub
        def __init__(self, *args, **kwargs):
            pass

    class _SettingsConfigDict(dict):
        pass

    pydantic_settings = types.SimpleNamespace(  # type: ignore
        BaseSettings=_BaseSettings,
        SettingsConfigDict=_SettingsConfigDict,
    )
    sys.modules["pydantic_settings"] = pydantic_settings

from app.main import app
from app.db import get_session
from app.user import User
from app.oauth2 import create_access_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from app.oauth_models import Service, UserServiceSubscription
from app.action import Action
from app.reaction import Reaction


@pytest.fixture(scope="session")
def test_engine():
    """In-memory SQLite engine for isolated tests."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    for table in SQLModel.metadata.tables.values():
        for column in table.columns:
            if isinstance(column.type, JSONB):
                column.type = SAJSON()
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture
def session(test_engine) -> Generator[Session, None, None]:
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(autouse=True)
def override_session_dependency(session: Session):
    def _get_test_session():
        yield session

    app.dependency_overrides[get_session] = _get_test_session
    yield
    app.dependency_overrides.clear()


@asynccontextmanager
async def _lifespan_override(_app):
    yield


@pytest.fixture(scope="session")
def client(test_engine):
    app.router.lifespan_context = _lifespan_override
    with TestClient(app) as client:
        yield client


@pytest.fixture
def user(session: Session):
    user = User(
        email="test@example.com",
        name="Test User",
        hashed_password=get_password_hash("password123"),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def auth_token(user: User):
    expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token({"sub": user.email}, expires)


@pytest.fixture
def sample_service(session: Session, user: User):
    service = Service(
        name="github",
        display_name="GitHub",
        description="Code hosting",
        is_active=True,
        icon_url="https://example.com/icon.png",
    )
    session.add(service)
    session.commit()
    session.refresh(service)

    action = Action(
        name="push",
        description="Push events",
        is_polling=False,
        service_id=service.id,
        parameters={"branch": "main"},
    )
    reaction = Reaction(
        name="notify",
        description="Send notification",
        url="https://example.com/hook",
        service_id=service.id,
        parameters={"channel": "dev"},
    )
    session.add(action)
    session.add(reaction)

    subscription = UserServiceSubscription(
        user_id=user.id,
        service_id=service.id,
        is_active=True,
    )
    session.add(subscription)
    session.commit()

    session.refresh(action)
    session.refresh(reaction)
    session.refresh(subscription)

    return {
        "service": service,
        "action": action,
        "reaction": reaction,
        "subscription": subscription,
    }
