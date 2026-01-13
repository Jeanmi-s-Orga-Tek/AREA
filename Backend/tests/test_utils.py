##
## EPITECH PROJECT, 2026
## AREA
## File description:
## test_utils
##

import datetime

from starlette.requests import Request

from app.main import get_client_ip
from app.routers.services import serialize_subscription
from app.oauth_models import UserServiceSubscription


def _build_request(headers=None, client=None):
    scope = {
        "type": "http",
        "headers": headers or [],
        "client": client,
    }
    return Request(scope)


def test_get_client_ip_prefers_forwarded_header():
    request = _build_request(
        headers=[(b"x-forwarded-for", b"198.51.100.1, 10.0.0.2")],
        client=("192.0.2.10", 1234),
    )

    assert get_client_ip(request) == "198.51.100.1"


def test_get_client_ip_uses_client_host_when_no_header():
    request = _build_request(client=("203.0.113.7", 4321))

    assert get_client_ip(request) == "203.0.113.7"


def test_get_client_ip_falls_back_to_unknown():
    request = _build_request()

    assert get_client_ip(request) == "unknown"


def test_serialize_subscription_returns_expected_shape():
    created_at = datetime.datetime(2024, 1, 1, 12, 0, 0)
    subscription = UserServiceSubscription(
        user_id=42,
        service_id=7,
        is_active=True,
        created_at=created_at,
    )

    result = serialize_subscription(subscription)

    assert result.service_id == 7
    assert result.user_id == 42
    assert result.status == "active"
    assert result.created_at == created_at


def test_serialize_subscription_inactive_status():
    subscription = UserServiceSubscription(
        user_id=99,
        service_id=5,
        is_active=False,
    )

    result = serialize_subscription(subscription)

    assert result.status == "inactive"
