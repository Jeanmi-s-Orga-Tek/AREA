from app.oauth2 import get_password_hash, verify_password


def test_password_hashing_and_verification():
    plain_password = "S0mething$ecur3"

    hashed = get_password_hash(plain_password)

    assert hashed != plain_password
    assert verify_password(plain_password, hashed)
    assert not verify_password("wrong", hashed)


def test_password_hash_is_unique_per_call():
    plain_password = "Idempotent123!"
    hashes = {get_password_hash(plain_password) for _ in range(3)}
    assert len(hashes) == 3

