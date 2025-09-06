from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .config import get_settings


def _create_engine_url() -> str:
    settings = get_settings()
    return settings.database_url


engine = create_engine(
    _create_engine_url(),
    connect_args={"check_same_thread": False} if _create_engine_url().startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


