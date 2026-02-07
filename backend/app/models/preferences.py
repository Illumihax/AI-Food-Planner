"""User preferences database model."""

from datetime import datetime
from sqlalchemy import Integer, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserPreferences(Base):
    """User preferences for meal planning and food choices."""
    
    __tablename__ = "user_preferences"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Food preferences (stored as JSON arrays)
    liked_foods: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)
    disliked_foods: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)
    allergies: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)
    
    # Dietary restrictions (stored as JSON object with boolean flags)
    # e.g., {"vegan": true, "vegetarian": false, "gluten_free": true}
    dietary_restrictions: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=dict)
    
    # Budget preference: "low", "medium", "high"
    budget_preference: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Maximum cooking time in minutes
    max_cooking_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Additional notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    def __repr__(self) -> str:
        return f"<UserPreferences(id={self.id}, budget={self.budget_preference})>"
