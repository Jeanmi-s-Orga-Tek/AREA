import string


def validate_password(password: str) -> bool:
    """Return True if the password satisfies basic complexity requirements."""
    if len(password) < 8:
        return False
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    special_chars = set(string.punctuation)
    has_special = any(c in special_chars for c in password)
    return has_lower and has_upper and has_digit and has_special

