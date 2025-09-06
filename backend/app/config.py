from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Uses a local .env file when present. Safe defaults are provided for local dev.
    """

    app_name: str = "AI Food Planner API"
    env: str = "development"
    debug: bool = True

    # SQLite file under backend/ when running from that cwd
    database_url: str = "sqlite:///./data/app.db"

    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


