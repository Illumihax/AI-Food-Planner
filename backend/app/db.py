from typing import Generator
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import make_url

from .config import get_settings


def _create_engine_url() -> str:
    settings = get_settings()
    return settings.database_url


def _ensure_sqlite_dir(database_url: str) -> None:
    try:
        url = make_url(database_url)
    except Exception:
        return
    if url.drivername.startswith("sqlite"):
        db_path = url.database or ""
        if db_path and db_path != ":memory:":
            directory = os.path.dirname(db_path)
            if directory and not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)


DATABASE_URL = _create_engine_url()
_ensure_sqlite_dir(DATABASE_URL)
IS_SQLITE = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if IS_SQLITE else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


