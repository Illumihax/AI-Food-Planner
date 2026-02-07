"""User preferences Pydantic schemas."""

from datetime import datetime
from pydantic import BaseModel, Field


class DietaryRestrictions(BaseModel):
    """Dietary restriction flags."""
    vegan: bool = False
    vegetarian: bool = False
    pescatarian: bool = False
    gluten_free: bool = False
    dairy_free: bool = False
    nut_free: bool = False
    halal: bool = False
    kosher: bool = False
    low_carb: bool = False
    keto: bool = False


class PreferencesBase(BaseModel):
    """Base preferences schema."""
    liked_foods: list[str] = Field(default_factory=list)
    disliked_foods: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    dietary_restrictions: DietaryRestrictions = Field(default_factory=DietaryRestrictions)
    budget_preference: str | None = Field(None, pattern="^(low|medium|high)$")
    max_cooking_time_minutes: int | None = Field(None, ge=5, le=480)
    notes: str | None = None


class PreferencesUpdate(BaseModel):
    """Schema for updating preferences."""
    liked_foods: list[str] | None = None
    disliked_foods: list[str] | None = None
    allergies: list[str] | None = None
    dietary_restrictions: DietaryRestrictions | None = None
    budget_preference: str | None = Field(None, pattern="^(low|medium|high)$")
    max_cooking_time_minutes: int | None = Field(None, ge=5, le=480)
    notes: str | None = None


class PreferencesResponse(PreferencesBase):
    """Schema for preferences response."""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
