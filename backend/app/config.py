from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Machine Test Platform"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8
    invite_token_expire_hours: int = 6

    database_url: str = Field(
        default="sqlite:///./machine_test.db",
        validation_alias=AliasChoices("DATABASE_URL", "database_url"),
    )

    smtp_host: str = Field(
        default="smtp.gmail.com",
        validation_alias=AliasChoices("SMTP_HOST", "smtp_host", "SMTP_SERVER", "smtp_server"),
    )
    smtp_port: int = Field(default=587, validation_alias=AliasChoices("SMTP_PORT", "smtp_port"))
    smtp_username: str = Field(
        default="",
        validation_alias=AliasChoices(
            "SMTP_USERNAME",
            "smtp_username",
            "SMTP_EMAIL",
            "smtp_email",
            "BREVO_SMTP_LOGIN",
            "brevo_smtp_login",
        ),
    )
    smtp_password: str = Field(
        default="",
        validation_alias=AliasChoices(
            "SMTP_PASSWORD",
            "smtp_password",
            "BREVO_SMTP_KEY",
            "brevo_smtp_key",
        ),
    )
    smtp_from_email: str = Field(
        default="noreply@example.com",
        validation_alias=AliasChoices("SMTP_FROM_EMAIL", "smtp_from_email", "BREVO_FROM_EMAIL", "brevo_from_email"),
    )
    smtp_use_tls: bool = Field(default=True, validation_alias=AliasChoices("SMTP_USE_TLS", "smtp_use_tls"))

    frontend_base_url: str = Field(
        default="http://localhost:5173",
        validation_alias=AliasChoices("FRONTEND_BASE_URL", "frontend_base_url"),
    )
    default_gemini_api_key: str = Field(
        default="AIzaSyC2NZ7UAGHzxMeZCg8m2TpeHWVKS6H-9dw",
        validation_alias=AliasChoices("DEFAULT_GEMINI_API_KEY", "default_gemini_api_key"),
    )

    default_admins: str = Field(
        default="admin1@example.com:admin123,admin2@example.com:admin123",
        validation_alias=AliasChoices("DEFAULT_ADMINS", "default_admins"),
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
