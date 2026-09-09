from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_CONFIG_DIR = Path(__file__).resolve().parent
_API_ROOT = _CONFIG_DIR.parent
_REPO_ROOT = _API_ROOT.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(_REPO_ROOT / ".env"), str(_API_ROOT / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    nche_env: str = "development"
    cors_origins: str = "http://localhost:3000"
    sim_risk_source: str = "SIMULATED"
    database_url: str | None = None
    database_required: bool = False
    db_pool_size: int = 5
    db_max_overflow: int = 5
    log_level: str = "INFO"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.nche_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()