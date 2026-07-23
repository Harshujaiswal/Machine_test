from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from .config import settings


def _normalize_database_url(url: str) -> str:
    # SQLAlchemy requires the explicit PostgreSQL dialect name.
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


db_url = _normalize_database_url(settings.database_url)
is_sqlite = db_url.startswith("sqlite")

engine_options = {
    "connect_args": {"check_same_thread": False} if is_sqlite else {"connect_timeout": 10},
}

# Supabase transaction pooling is designed for short-lived/serverless clients.
# NullPool prevents a Vercel function instance from holding stale DB connections.
if not is_sqlite:
    engine_options["poolclass"] = NullPool

engine = create_engine(db_url, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
