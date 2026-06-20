from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="Litera API", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    database_url: str = Field(default="sqlite:///./litera.db", alias="DATABASE_URL")
    jwt_secret_key: str = Field(default="change-this-secret", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=120, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    frontend_origin: str = Field(default="http://127.0.0.1:5173", alias="FRONTEND_ORIGIN")
    frontend_origins: str = Field(default="", alias="FRONTEND_ORIGINS")
    frontend_origin_regex: str | None = Field(default=None, alias="FRONTEND_ORIGIN_REGEX")
    upload_dir: str = Field(default="uploads", alias="UPLOAD_DIR")
    max_pdf_size_mb: int = Field(default=15, ge=1, alias="MAX_PDF_SIZE_MB")
    storage_backend: Literal["local", "s3"] = Field(default="local", alias="STORAGE_BACKEND")
    s3_endpoint_url: str | None = Field(default=None, alias="S3_ENDPOINT_URL")
    s3_region: str = Field(default="us-east-1", alias="S3_REGION")
    s3_access_key_id: str | None = Field(default=None, alias="S3_ACCESS_KEY_ID")
    s3_secret_access_key: str | None = Field(default=None, alias="S3_SECRET_ACCESS_KEY")
    s3_bucket: str = Field(default="litera-pdfs", alias="S3_BUCKET")
    s3_prefix: str = Field(default="documents", alias="S3_PREFIX")
    api_v1_prefix: str = "/api/v1"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @property
    def allowed_frontend_origins(self) -> list[str]:
        values = [self.frontend_origin, *self.frontend_origins.split(",")]
        return list(dict.fromkeys(value.strip().rstrip("/") for value in values if value.strip()))


@lru_cache
def get_settings() -> Settings:
    return Settings()
