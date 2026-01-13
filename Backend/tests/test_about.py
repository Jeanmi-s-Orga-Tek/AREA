##
## EPITECH PROJECT, 2026
## AREA
## File description:
## test_about
##

import time

from fastapi import status


def test_about_returns_services(client, sample_service, monkeypatch):
    fixed_time = 1_700_000_000
    monkeypatch.setattr(time, "time", lambda: fixed_time)

    response = client.get(
        "/about.json",
        headers={"X-Forwarded-For": "203.0.113.5, 10.0.0.1"},
    )

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()

    assert payload["client"]["host"] == "203.0.113.5"
    assert payload["server"]["current_time"] == fixed_time

    services = payload["server"]["services"]
    assert len(services) == 1
    service = services[0]
    assert service["name"] == "github"
    assert service["actions"] and service["actions"][0]["name"] == "push"
    assert service["reactions"] and service["reactions"][0]["name"] == "notify"


def test_about_without_forwarded_header_uses_client_host(client, sample_service, monkeypatch):
    monkeypatch.setattr(time, "time", lambda: 1_234_567_890)

    response = client.get("/about.json")

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload["client"]["host"] in {"testclient", "127.0.0.1"}
