"""
Database connection, session management, and table creation.
Supports SQLite (default persistent storage/storymxh.db) and PostgreSQL (via DATABASE_URL).
Ref: docs/DATA_MODEL.md
"""

import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator

# Ensure storage directory exists
STORAGE_DIR = Path(__file__).resolve().parent.parent.parent.parent / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_SQLITE_URL = f"sqlite:///{STORAGE_DIR / 'storymxh.db'}"
DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_SQLITE_URL)

# For SQLite, enable check_same_thread=False
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    future=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for FastAPI route handlers."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all database tables if they do not exist."""
    import app.db.models  # Ensure all models are registered with Base.metadata
    Base.metadata.create_all(bind=engine)
