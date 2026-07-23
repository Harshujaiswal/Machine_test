import os
from fastapi import FastAPI, Request
from fastapi.responses import Response

from .config import settings
from .database import Base, SessionLocal, engine
from .migrations import run_postgres_migrations, run_sqlite_migrations
from .routers import admin, auth, candidate, execution
from .seed import seed_admins, seed_app_settings, seed_questions


API_PREFIX = os.getenv("API_PREFIX", "").strip().rstrip("/")
if API_PREFIX and not API_PREFIX.startswith("/"):
    API_PREFIX = f"/{API_PREFIX}"

app = FastAPI(
    title=settings.app_name,
    docs_url=f"{API_PREFIX}/docs",
    openapi_url=f"{API_PREFIX}/openapi.json",
    redoc_url=f"{API_PREFIX}/redoc",
    swagger_ui_oauth2_redirect_url=f"{API_PREFIX}/docs/oauth2-redirect",
)


@app.middleware("http")
async def force_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response(status_code=200)
    else:
        response = await call_next(request)

    origin = request.headers.get("origin")
    response.headers["Access-Control-Allow-Origin"] = origin or "*"
    response.headers["Vary"] = "Origin"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = (
        "Authorization,Content-Type,Accept,Origin,ngrok-skip-browser-warning,"
        "X-Requested-With"
    )
    response.headers["Access-Control-Expose-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"
    return response


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_sqlite_migrations(db, settings.database_url)
        run_postgres_migrations(db, settings.database_url)
        seed_admins(db, settings.default_admins)
        seed_app_settings(db, settings.default_gemini_api_key)
        seed_questions(db)
    finally:
        db.close()


@app.get(f"{API_PREFIX}/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(candidate.router, prefix=API_PREFIX)
app.include_router(execution.router, prefix=API_PREFIX)
