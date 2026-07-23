from pathlib import Path

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
        default="",
        validation_alias=AliasChoices("SMTP_FROM_EMAIL", "smtp_from_email", "BREVO_FROM_EMAIL", "brevo_from_email"),
    )
    smtp_use_tls: bool = Field(default=True, validation_alias=AliasChoices("SMTP_USE_TLS", "smtp_use_tls"))

    frontend_base_url: str = Field(
        default="https://machine-tests.netlify.app",
        validation_alias=AliasChoices("FRONTEND_BASE_URL", "frontend_base_url"),
    )

    default_gemini_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("DEFAULT_GEMINI_API_KEY", "default_gemini_api_key"),
    )
    default_admins: str = Field(
        default="",
        validation_alias=AliasChoices("DEFAULT_ADMINS", "default_admins"),
    )

    openai_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("OPENAI_API_KEY", "openai_api_key"),
    )
    openai_model: str = Field(
        default="gpt-4o-mini",
        validation_alias=AliasChoices("OPENAI_MODEL", "openai_model"),
    )
    openai_timeout_seconds: int = Field(
        default=30,
        validation_alias=AliasChoices("OPENAI_TIMEOUT_SECONDS", "openai_timeout_seconds"),
    )

    emailjs_service_id: str = Field(
        default="",
        validation_alias=AliasChoices("EMAILJS_SERVICE_ID", "emailjs_service_id"),
    )
    emailjs_template_id: str = Field(
        default="",
        validation_alias=AliasChoices("EMAILJS_TEMPLATE_ID", "emailjs_template_id"),
    )
    emailjs_invite_template_id: str = Field(
        default="",
        validation_alias=AliasChoices("EMAILJS_INVITE_TEMPLATE_ID", "emailjs_invite_template_id"),
    )
    emailjs_submit_candidate_template_id: str = Field(
        default="",
        validation_alias=AliasChoices("EMAILJS_SUBMIT_CANDIDATE_TEMPLATE_ID", "emailjs_submit_candidate_template_id"),
    )
    emailjs_submit_reviewer_template_id: str = Field(
        default="",
        validation_alias=AliasChoices("EMAILJS_SUBMIT_REVIEWER_TEMPLATE_ID", "emailjs_submit_reviewer_template_id"),
    )
    emailjs_public_key: str = Field(
        default="",
        validation_alias=AliasChoices("EMAILJS_PUBLIC_KEY", "emailjs_public_key"),
    )
    emailjs_private_key: str = Field(
        default="",
        validation_alias=AliasChoices("EMAILJS_PRIVATE_KEY", "emailjs_private_key"),
    )

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[1] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
