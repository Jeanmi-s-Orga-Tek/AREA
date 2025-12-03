from sqlmodel import select

from app.user import RegisteringUser, User


def test_register_creates_user_and_sets_cookie(client, session):
    payload = {
        "email": "alice@example.com",
        "name": "Alice",
        "new_password": "Sup3rSecret!",
    }

    response = client.post("/user/register", json=payload)

    assert response.status_code == 200
    assert response.cookies.get("Authorization")

    user = session.exec(select(User).where(User.email == payload["email"])).first()
    assert user is not None
    assert user.name == payload["name"]
    assert user.hashed_password != payload["new_password"]


def test_register_rejects_duplicate_email(client):
    payload = {
        "email": "bob@example.com",
        "name": "Bob",
        "new_password": "AnotherSecret42",
    }

    first_response = client.post("/user/register", json=payload)
    assert first_response.status_code == 200

    duplicate_response = client.post("/user/register", json=payload)
    assert duplicate_response.status_code == 401
    assert duplicate_response.json()["detail"] == "user with this email already exists"

