"""Week plan Pydantic schemas."""

from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Literal


class WeekPlanMealBase(BaseModel):
    """Base schema for week plan meal."""
    day_index: int = Field(..., ge=0, le=6)  # 0 = Monday, 6 = Sunday
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"]
    food_id: int | None = None
    food_cache_id: int | None = None
    recipe_id: int | None = None
    food_name: str
    description: str | None = None
    amount: float = Field(100, gt=0)
    unit: str = "g"
    calories: float = Field(0, ge=0)
    protein: float = Field(0, ge=0)
    carbs: float = Field(0, ge=0)
    fat: float = Field(0, ge=0)


class WeekPlanMealCreate(WeekPlanMealBase):
    """Schema for creating a week plan meal."""
    pass


class WeekPlanMealResponse(WeekPlanMealBase):
    """Schema for week plan meal response."""
    id: int
    week_plan_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class WeekPlanBase(BaseModel):
    """Base schema for week plan."""
    name: str = Field(..., min_length=1, max_length=255)
    start_date: date
    status: Literal["draft", "active", "archived"] = "draft"
    notes: str | None = None


class WeekPlanCreate(WeekPlanBase):
    """Schema for creating a week plan."""
    meals: list[WeekPlanMealCreate] = Field(default_factory=list)


class WeekPlanUpdate(BaseModel):
    """Schema for updating a week plan."""
    name: str | None = None
    start_date: date | None = None
    status: Literal["draft", "active", "archived"] | None = None
    notes: str | None = None


class WeekPlanResponse(WeekPlanBase):
    """Schema for week plan response."""
    id: int
    meals: list[WeekPlanMealResponse] = []
    total_calories: float = 0
    total_protein: float = 0
    total_carbs: float = 0
    total_fat: float = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class WeekPlanSummary(BaseModel):
    """Summary of a week plan (without meals)."""
    id: int
    name: str
    start_date: date
    status: str
    total_calories: float = 0
    total_protein: float = 0
    total_carbs: float = 0
    total_fat: float = 0
    meal_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ApplyToDiaryRequest(BaseModel):
    """Request to apply week plan to diary."""
    target_start_date: date


class AIMealPlanDay(BaseModel):
    """A day in an AI-generated meal plan."""
    breakfast: list[dict] = []
    lunch: list[dict] = []
    dinner: list[dict] = []
    snacks: list[dict] = []
    estimated_calories: float = 0
    estimated_protein: float = 0
    estimated_carbs: float = 0
    estimated_fat: float = 0


class CreateFromAIPlanRequest(BaseModel):
    """Request to create week plan from AI-generated plan."""
    name: str
    start_date: date
    days: list[AIMealPlanDay]


class RegenerateDayRequest(BaseModel):
    """Request to regenerate a day in the week plan using AI."""
    day_index: int = Field(..., ge=0, le=6)
    meal_type: str | None = None  # None = regenerate all meals, or specific like 'breakfast'
    language: str = "en"
