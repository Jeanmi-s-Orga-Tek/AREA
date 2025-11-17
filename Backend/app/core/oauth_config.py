from dataclasses import dataclass
from typing import Dict, List, Optional, Literal
from app.core.settings import settings
import os, yaml, re

FlowType = Literal["web", "mobile"]

@dataclass(frozen=True)
class WebOAuthConfig:
    client_id: str
    client_secret: str
    redirect_uri: str
    scopes: List[str]

@dataclass(frozen=True)
class MobileOAuthConfig:
    client_id: str
    redirect_uri: str
    scopes: List[str]

@dataclass(frozen=True)
class ProviderConfig:
    key: str
    web: Optional[WebOAuthConfig]
    mobile: Optional[MobileOAuthConfig]

_PROVIDERS_CACHE: Optional[Dict[str, ProviderConfig]] = None

def _expand_env_vars(value: str) -> str:
    """Replace ${VAR_NAME} with environment variable value."""
    if isinstance(value, str):
        pattern = r'\$\{([^}]+)\}'
        matches = re.findall(pattern, value)
        for var_name in matches:
            env_value = os.environ.get(var_name, "")
            if not env_value:
                raise ValueError(f"Environment variable '{var_name}' is not set")
            value = value.replace(f"${{{var_name}}}", env_value)
    return value

def _load_providers_file(path: str) -> Dict[str, ProviderConfig]:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Providers config not found: {path}")
    raw = yaml.safe_load(open(path, "r", encoding="utf-8"))
    provs = raw.get("providers", {})
    out: Dict[str, ProviderConfig] = {}

    for key, cfg in provs.items():
        web_cfg = cfg.get("web")
        mob_cfg = cfg.get("mobile")

        web = None
        if web_cfg:
            web = WebOAuthConfig(
                client_id=_expand_env_vars(web_cfg["client_id"]),
                client_secret=_expand_env_vars(web_cfg["client_secret"]),
                redirect_uri=_expand_env_vars(web_cfg["redirect_uri"]),
                scopes=list(web_cfg.get("scopes", [])),
            )
        mobile = None
        if mob_cfg:
            mobile = MobileOAuthConfig(
                client_id=_expand_env_vars(mob_cfg["client_id"]),
                redirect_uri=_expand_env_vars(mob_cfg["redirect_uri"]),
                scopes=list(mob_cfg.get("scopes", [])),
            )

        out[key] = ProviderConfig(key=key, web=web, mobile=mobile)
    return out

def providers_registry() -> Dict[str, ProviderConfig]:
    global _PROVIDERS_CACHE
    if _PROVIDERS_CACHE is None:
        _PROVIDERS_CACHE = _load_providers_file(settings.PROVIDERS_CONFIG)
    return _PROVIDERS_CACHE

def public_provider_info(provider: str, flow: FlowType) -> dict:
    reg = providers_registry()
    if provider not in reg:
        raise ValueError(f"Unknown provider: {provider}")
    p = reg[provider]
    if flow == "web" and p.web:
        return {
            "provider": provider,
            "flow": "web",
            "client_id": p.web.client_id,
            "redirect_uri": p.web.redirect_uri,
            "scopes": p.web.scopes,
            "response_type": "code",
        }
    if flow == "mobile" and p.mobile:
        return {
            "provider": provider,
            "flow": "mobile",
            "client_id": p.mobile.client_id,
            "redirect_uri": p.mobile.redirect_uri,
            "scopes": p.mobile.scopes,
            "use_pkce": True,
        }
    raise ValueError(f"Flow not supported for '{provider}': {flow}")

def reload_providers() -> None:
    global _PROVIDERS_CACHE
    _PROVIDERS_CACHE = None
    providers_registry()
