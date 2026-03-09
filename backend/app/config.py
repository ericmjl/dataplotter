"""FastAPI application configuration."""

from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Dataplotter"
    debug: bool = False

    groq_api_key: str | None = None
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None

    llm_provider: str = "groq"

    templates_dir: Path = Path(__file__).parent.parent.parent / "frontend" / "templates"
    static_dir: Path = Path(__file__).parent.parent.parent / "frontend" / "static"


settings = Settings()
