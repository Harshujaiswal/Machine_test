from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Machine Test Platform"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8
    invite_token_expire_hours: int = 6

    # database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/machine_test"

    database_url: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/machine_test",
        validation_alias=AliasChoices("DATABASE_URL", "database_url"),
    )

    smtp_host: str = Field(
        default="smtp.gmail.com",
        validation_alias=AliasChoices("SMTP_HOST", "smtp_host", "SMTP_SERVER", "smtp_server"),
    )
    smtp_port: int = 587
    smtp_username: str = Field(
        default="",
        validation_alias=AliasChoices("SMTP_USERNAME", "smtp_username", "SMTP_EMAIL", "smtp_email"),
    )
    smtp_password: str = ""
    smtp_from_email: str = "noreply@example.com"
    smtp_use_tls: bool = True

    frontend_base_url: str = "http://localhost:5173"
    default_gemini_api_key: str = "AIzaSyC2NZ7UAGHzxMeZCg8m2TpeHWVKS6H-9dw"

    # Format: email:password,email2:password2
    default_admins: str = "admin1@example.com:admin123,admin2@example.com:admin123"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
