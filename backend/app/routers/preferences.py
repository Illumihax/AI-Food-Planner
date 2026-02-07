"""User preferences API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.preferences import UserPreferences
from app.schemas.preferences import PreferencesResponse, PreferencesUpdate, DietaryRestrictions

router = APIRouter()


@router.get("/", response_model=PreferencesResponse | None)
async def get_preferences(
    db: AsyncSession = Depends(get_db),
):
    """Get current user preferences."""
    result = await db.execute(
        select(UserPreferences).order_by(UserPreferences.id.desc()).limit(1)
    )
    preferences = result.scalar_one_or_none()
    
    if preferences:
        # Ensure dietary_restrictions is properly structured
        if preferences.dietary_restrictions is None:
            preferences.dietary_restrictions = {}
        return preferences
    return None


@router.put("/", response_model=PreferencesResponse)
async def update_preferences(
    preferences_update: PreferencesUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update user preferences (creates if doesn't exist)."""
    result = await db.execute(
        select(UserPreferences).order_by(UserPreferences.id.desc()).limit(1)
    )
    preferences = result.scalar_one_or_none()
    
    if not preferences:
        # Create new preferences
        preferences = UserPreferences(
            liked_foods=preferences_update.liked_foods or [],
            disliked_foods=preferences_update.disliked_foods or [],
            allergies=preferences_update.allergies or [],
            dietary_restrictions=preferences_update.dietary_restrictions.model_dump() if preferences_update.dietary_restrictions else {},
            budget_preference=preferences_update.budget_preference,
            max_cooking_time_minutes=preferences_update.max_cooking_time_minutes,
            notes=preferences_update.notes,
        )
        db.add(preferences)
    else:
        # Update existing preferences
        if preferences_update.liked_foods is not None:
            preferences.liked_foods = preferences_update.liked_foods
        if preferences_update.disliked_foods is not None:
            preferences.disliked_foods = preferences_update.disliked_foods
        if preferences_update.allergies is not None:
            preferences.allergies = preferences_update.allergies
        if preferences_update.dietary_restrictions is not None:
            preferences.dietary_restrictions = preferences_update.dietary_restrictions.model_dump()
        if preferences_update.budget_preference is not None:
            preferences.budget_preference = preferences_update.budget_preference
        if preferences_update.max_cooking_time_minutes is not None:
            preferences.max_cooking_time_minutes = preferences_update.max_cooking_time_minutes
        if preferences_update.notes is not None:
            preferences.notes = preferences_update.notes
    
    await db.commit()
    await db.refresh(preferences)
    return preferences
