"""Goal/target database model."""

from datetime import datetime
from sqlalchemy import Float, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Goal(Base):
    """Daily nutritional goals/targets."""
    
    __tablename__ = "goals"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Daily targets
    daily_calories: Mapped[float] = mapped_column(Float, nullable=False)
    daily_protein: Mapped[float] = mapped_column(Float, nullable=False)
    daily_carbs: Mapped[float] = mapped_column(Float, nullable=False)
    daily_fat: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Optional notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Only one goal can be active at a time
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    def __repr__(self) -> str:
        return f"<Goal(id={self.id}, calories={self.daily_calories}, active={self.is_active})>"
