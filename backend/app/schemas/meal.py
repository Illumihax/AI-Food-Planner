"""Meal-related Pydantic schemas."""

from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Literal


MealType = Literal["breakfast", "lunch", "dinner", "snack"]


class MealEntryBase(BaseModel):
    """Base meal entry schema."""
    food_id: int | None = None
    recipe_id: int | None = None
    food_name: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0)
    unit: str = "g"
    
    # Nutritional values for this entry
    calories: float = Field(0, ge=0)
    protein: float = Field(0, ge=0)
    carbs: float = Field(0, ge=0)
    fat: float = Field(0, ge=0)


class MealEntryCreate(MealEntryBase):
    """Schema for creating a meal entry."""
    pass


class MealEntryResponse(MealEntryBase):
    """Schema for meal entry response."""
    id: int
    meal_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class MealBase(BaseModel):
    """Base meal schema."""
    date: date
    meal_type: MealType
    notes: str | None = None


class MealCreate(MealBase):
    """Schema for creating a meal."""
    pass


class MealResponse(MealBase):
    """Schema for meal response."""
    id: int
    entries: list[MealEntryResponse] = []
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class DailyMealsResponse(BaseModel):
    """Schema for daily meals summary."""
    date: date
    meals: list[MealResponse]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
