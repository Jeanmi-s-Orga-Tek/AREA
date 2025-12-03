import os
from typing import Generator

TEST_DB_URL = "sqlite:///./test.db"
IN_MEMORY_ENV = {
    "SECRET_KEY": "test-secret-key",
    "ALGORITHM": "HS256",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
    "POSTGRESQL_URI": TEST_DB_URL,
    "SMTP_SERVER": "smtp.test",
    "SMTP_PORT": "1025",
    "EMAIL_USERNAME": "test@example.com",
    "EMAIL_PASSWORD": "secret",
    "STARTUPS_UPLOAD_PATH": "./uploads",
    "USERS_IMG_PATH": "./user_images",
    "EVENTS_IMG_PATH": "./event_images",
    "NEWS_IMG_PATH": "./news_images",
    "LEGACY_API_URL": "http://test",
    "VITE_APP_API_URL": "http://test",
    "GOOGLE_WEB_CLIENT_ID": "test",
    "GOOGLE_WEB_CLIENT_SECRET": "test",
    "GOOGLE_MOBILE_CLIENT_ID": "test",
    "MICROSOFT_WEB_CLIENT_ID": "test",
    "MICROSOFT_WEB_CLIENT_SECRET": "test",
    "MICROSOFT_MOBILE_CLIENT_ID": "test",
    "GITHUB_WEB_CLIENT_ID": "test",
    "GITHUB_WEB_CLIENT_SECRET": "test",
    "GITHUB_MOBILE_CLIENT_ID": "test",
    "GITHUB_MOBILE_CLIENT_SECRET": "test",
    "SPOTIFY_CLIENT_ID": "test",
    "SPOTIFY_CLIENT_SECRET": "test",
    "SPOTIFY_MOBILE_CLIENT_ID": "test",
    "SPOTIFY_MOBILE_CLIENT_SECRET": "test",
    "TRELLO_WEB_CLIENT_API_KEY": "test",
    "TRELLO_WEB_CLIENT_API_SECRET": "test",
}

for key, value in IN_MEMORY_ENV.items():
    os.environ[key] = value

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from app import main as main_module
from app.user import User
from app.main import app
import app.db as db_module

APP_GET_SESSION = db_module.get_session

TEST_DATABASE_URL = TEST_DB_URL
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
db_module.engine = engine


def create_user_tables():
    SQLModel.metadata.create_all(engine, tables=[User.__table__])


def drop_user_tables():
    SQLModel.metadata.drop_all(engine, tables=[User.__table__])


def override_get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


@pytest.fixture(scope="session", autouse=True)
def configure_test_app():
    main_module.create_db_tables = create_user_tables
    db_module.create_db_tables = create_user_tables
    create_user_tables()
    app.dependency_overrides[APP_GET_SESSION] = override_get_session
    db_module.get_session = override_get_session
    yield
    app.dependency_overrides.clear()
    db_module.get_session = APP_GET_SESSION
    drop_user_tables()
    if os.path.exists("./test.db"):
        os.remove("./test.db")


@pytest.fixture
def fresh_db():
    drop_user_tables()
    create_user_tables()
    yield


@pytest.fixture
def session(fresh_db) -> Generator[Session, None, None]:
    with Session(engine) as db_session:
        yield db_session


@pytest.fixture
def client(fresh_db) -> TestClient:
    with TestClient(app) as test_client:
        yield test_client
