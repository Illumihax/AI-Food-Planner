"""Goal-related Pydantic schemas."""

from datetime import datetime
from pydantic import BaseModel, Field


class GoalBase(BaseModel):
    """Base goal schema."""
    daily_calories: float = Field(..., gt=0)
    daily_protein: float = Field(..., ge=0)
    daily_carbs: float = Field(..., ge=0)
    daily_fat: float = Field(..., ge=0)
    notes: str | None = None


class GoalCreate(GoalBase):
    """Schema for creating a goal."""
    pass


class GoalUpdate(BaseModel):
    """Schema for updating a goal."""
    daily_calories: float | None = Field(None, gt=0)
    daily_protein: float | None = Field(None, ge=0)
    daily_carbs: float | None = Field(None, ge=0)
    daily_fat: float | None = Field(None, ge=0)
    notes: str | None = None


class GoalResponse(GoalBase):
    """Schema for goal response."""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
