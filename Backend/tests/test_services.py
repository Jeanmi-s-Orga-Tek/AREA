##
## EPITECH PROJECT, 2026
## AREA
## File description:
## test_services
##

from datetime import timedelta

from fastapi import status

from app.oauth2 import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token


def test_get_service_capabilities_returns_actions_and_reactions(client, sample_service):
    service_id = sample_service["service"].id

    response = client.get(f"/services/{service_id}/capabilities")

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload["service"]["id"] == service_id
    assert payload["actions"][0]["name"] == "push"
    assert payload["reactions"][0]["name"] == "notify"


def test_get_my_services_returns_active_subscriptions(client, sample_service, user):
    token = create_access_token({"sub": user.email}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/services/my-services", headers=headers)

    assert response.status_code == status.HTTP_200_OK
    services = response.json()
    assert len(services) == 1
    assert services[0]["service_id"] == sample_service["service"].id
    assert services[0]["status"] == "active"
