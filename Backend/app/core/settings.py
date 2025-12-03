from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_HOST: str = Field("0.0.0.0")
    APP_PORT: int = Field(8080)
    PROVIDERS_CONFIG: str = Field("Backend/config/providers.yaml")

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
