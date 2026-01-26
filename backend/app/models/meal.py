"""Meal tracking database models."""

from datetime import date, datetime
from sqlalchemy import String, Float, Date, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Meal(Base):
    """A meal (breakfast, lunch, dinner, snack) for a specific date."""
    
    __tablename__ = "meals"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    meal_type: Mapped[str] = mapped_column(String(50), nullable=False)  # breakfast, lunch, dinner, snack
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Cached totals (updated when entries change)
    total_calories: Mapped[float] = mapped_column(Float, default=0)
    total_protein: Mapped[float] = mapped_column(Float, default=0)
    total_carbs: Mapped[float] = mapped_column(Float, default=0)
    total_fat: Mapped[float] = mapped_column(Float, default=0)
    
    # Relationships
    entries: Mapped[list["MealEntry"]] = relationship(
        "MealEntry",
        back_populates="meal",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    
    def __repr__(self) -> str:
        return f"<Meal(id={self.id}, date={self.date}, type='{self.meal_type}')>"


class MealEntry(Base):
    """A food entry within a meal."""
    
    __tablename__ = "meal_entries"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    meal_id: Mapped[int] = mapped_column(ForeignKey("meals.id"), nullable=False)
    
    # Can reference a saved food, recipe, or be custom
    food_id: Mapped[int | None] = mapped_column(ForeignKey("foods.id"), nullable=True)
    recipe_id: Mapped[int | None] = mapped_column(ForeignKey("recipes.id"), nullable=True)
    food_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Amount consumed
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), default="g")
    
    # Nutritional values for this entry
    calories: Mapped[float] = mapped_column(Float, default=0)
    protein: Mapped[float] = mapped_column(Float, default=0)
    carbs: Mapped[float] = mapped_column(Float, default=0)
    fat: Mapped[float] = mapped_column(Float, default=0)
    
    # Relationships
    meal: Mapped["Meal"] = relationship("Meal", back_populates="entries")
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    
    def __repr__(self) -> str:
        return f"<MealEntry(id={self.id}, food='{self.food_name}', amount={self.amount})>"
