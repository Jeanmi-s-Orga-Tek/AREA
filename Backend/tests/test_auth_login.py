from fastapi import status
from sqlmodel import select

from app.user import User
from app.oauth2 import get_password_hash


def create_user(session, **overrides):
    user = User(
        email="charlie@example.com",
        name="Charlie",
        hashed_password=get_password_hash("CorrectHorseBatteryStaple"),
        **overrides,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def test_login_success_sets_cookie(client, session):
    create_user(session)

    response = client.post(
        "/user/login",
        data={"username": "charlie@example.com", "password": "CorrectHorseBatteryStaple"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.cookies.get("Authorization")
    assert response.json()["token_type"] == "Bearer"


def test_login_fails_for_unknown_user(client):
    response = client.post(
        "/user/login",
        data={"username": "ghost@example.com", "password": "whatever"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "no user with that username / email found"


def test_login_fails_for_wrong_password(client, session):
    create_user(session)

    response = client.post(
        "/user/login",
        data={"username": "charlie@example.com", "password": "WrongPassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "wrong password"

