"""
Database connection, session management, and table creation.
Supports SQLite (default persistent storage/storymxh.db) and PostgreSQL (via DATABASE_URL).
Ref: docs/DATA_MODEL.md
"""

import os
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator

# Ensure storage directory exists
STORAGE_DIR = Path(__file__).resolve().parent.parent.parent.parent / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_SQLITE_URL = f"sqlite:///{STORAGE_DIR / 'storymxh.db'}"
DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_SQLITE_URL)

# For SQLite, enable check_same_thread=False and 30s lock timeout
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 30.0}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    future=True
)

if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

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
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            res = conn.execute(text("PRAGMA table_info(post_queues)"))
            cols = [row[1] for row in res.fetchall()]
            if cols and "is_cleaned_up" not in cols:
                conn.execute(text("ALTER TABLE post_queues ADD COLUMN is_cleaned_up BOOLEAN DEFAULT 0"))
                conn.commit()
    except Exception:
        pass

