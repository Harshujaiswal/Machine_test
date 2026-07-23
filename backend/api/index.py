"""Vercel Python Function entrypoint."""

from app.main import app

# Requests reach this function under /api; FastAPI strips this root path
# before matching the application's existing /health, /auth, and other routes.
app.root_path = "/api"

__all__ = ["app"]
