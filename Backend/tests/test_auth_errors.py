from fastapi import status


def test_register_missing_body(client):
    response = client.post("/user/register", json={})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_login_missing_form_fields(client):
    response = client.post("/user/login", data={}, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_login_invalid_content_type(client):
    response = client.post(
        "/user/login",
        json={"username": "charlie@example.com", "password": "whatever"},
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

