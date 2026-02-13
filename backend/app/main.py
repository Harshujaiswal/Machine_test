from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, SessionLocal, engine
from .migrations import run_sqlite_migrations
from .routers import admin, auth, candidate, execution
from .seed import seed_admins, seed_app_settings, seed_questions


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", settings.frontend_base_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_sqlite_migrations(db, settings.database_url)
        seed_admins(db, settings.default_admins)
        seed_app_settings(db, settings.default_gemini_api_key)
        seed_questions(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(candidate.router)
app.include_router(execution.router)
