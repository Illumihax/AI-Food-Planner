"""Week plan database models."""

from datetime import date, datetime
from sqlalchemy import String, Float, Date, DateTime, ForeignKey, Text, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class WeekPlanStatus(str, enum.Enum):
    """Status of a week plan."""
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class WeekPlan(Base):
    """A week-long meal plan."""
    
    __tablename__ = "week_plans"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(20), 
        default=WeekPlanStatus.DRAFT.value,
        index=True
    )
    
    # Optional notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Cached totals for the week
    total_calories: Mapped[float] = mapped_column(Float, default=0)
    total_protein: Mapped[float] = mapped_column(Float, default=0)
    total_carbs: Mapped[float] = mapped_column(Float, default=0)
    total_fat: Mapped[float] = mapped_column(Float, default=0)
    
    # Relationships
    meals: Mapped[list["WeekPlanMeal"]] = relationship(
        "WeekPlanMeal",
        back_populates="week_plan",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    def __repr__(self) -> str:
        return f"<WeekPlan(id={self.id}, name='{self.name}', status='{self.status}')>"
    
    def update_totals(self):
        """Recalculate total macros from all meals."""
        self.total_calories = sum(m.calories for m in self.meals)
        self.total_protein = sum(m.protein for m in self.meals)
        self.total_carbs = sum(m.carbs for m in self.meals)
        self.total_fat = sum(m.fat for m in self.meals)


class WeekPlanMeal(Base):
    """A meal entry within a week plan."""
    
    __tablename__ = "week_plan_meals"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    week_plan_id: Mapped[int] = mapped_column(ForeignKey("week_plans.id"), nullable=False)
    
    # Day within the week (0 = Monday, 6 = Sunday)
    day_index: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Meal type
    meal_type: Mapped[str] = mapped_column(String(50), nullable=False)  # breakfast, lunch, dinner, snack
    
    # Can reference a saved food, cached food, or recipe
    food_id: Mapped[int | None] = mapped_column(ForeignKey("foods.id"), nullable=True)
    food_cache_id: Mapped[int | None] = mapped_column(ForeignKey("food_cache.id"), nullable=True)
    recipe_id: Mapped[int | None] = mapped_column(ForeignKey("recipes.id"), nullable=True)
    
    # Food details (denormalized for display)
    food_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Amount
    amount: Mapped[float] = mapped_column(Float, default=100)
    unit: Mapped[str] = mapped_column(String(50), default="g")
    
    # Nutritional values for this entry
    calories: Mapped[float] = mapped_column(Float, default=0)
    protein: Mapped[float] = mapped_column(Float, default=0)
    carbs: Mapped[float] = mapped_column(Float, default=0)
    fat: Mapped[float] = mapped_column(Float, default=0)
    
    # Relationships
    week_plan: Mapped["WeekPlan"] = relationship("WeekPlan", back_populates="meals")
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    
    def __repr__(self) -> str:
        return f"<WeekPlanMeal(id={self.id}, day={self.day_index}, type='{self.meal_type}', food='{self.food_name}')>"
