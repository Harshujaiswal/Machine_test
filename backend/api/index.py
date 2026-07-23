"""Vercel Python Function entrypoint."""

import os

os.environ["API_PREFIX"] = "/api"

from app.main import app

__all__ = ["app"]
