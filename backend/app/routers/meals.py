"""Meal tracking API endpoints."""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.meal import Meal, MealEntry
from app.schemas.meal import (
    MealCreate, MealResponse, MealEntryCreate, 
    MealEntryResponse, DailyMealsResponse
)

router = APIRouter()


@router.get("/daily/{date_str}", response_model=DailyMealsResponse)
async def get_daily_meals(
    date_str: str,
    db: AsyncSession = Depends(get_db),
):
    """Get all meals for a specific date."""
    try:
        meal_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    result = await db.execute(
        select(Meal)
        .options(selectinload(Meal.entries))
        .where(Meal.date == meal_date)
        .order_by(Meal.meal_type)
    )
    meals = result.scalars().all()
    
    # Calculate daily totals
    total_calories = sum(m.total_calories for m in meals)
    total_protein = sum(m.total_protein for m in meals)
    total_carbs = sum(m.total_carbs for m in meals)
    total_fat = sum(m.total_fat for m in meals)
    
    return DailyMealsResponse(
        date=meal_date,
        meals=meals,
        total_calories=total_calories,
        total_protein=total_protein,
        total_carbs=total_carbs,
        total_fat=total_fat,
    )


@router.post("/", response_model=MealResponse)
async def create_meal(
    meal: MealCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new meal or return existing one (upsert)."""
    # Check if meal already exists for this date and type
    result = await db.execute(
        select(Meal)
        .options(selectinload(Meal.entries))
        .where(
            and_(Meal.date == meal.date, Meal.meal_type == meal.meal_type)
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        # Return existing meal instead of erroring
        return existing
    
    db_meal = Meal(
        date=meal.date,
        meal_type=meal.meal_type,
        notes=meal.notes,
    )
    db.add(db_meal)
    await db.commit()
    await db.refresh(db_meal)
    
    # Reload with entries
    result = await db.execute(
        select(Meal)
        .options(selectinload(Meal.entries))
        .where(Meal.id == db_meal.id)
    )
    return result.scalar_one()


@router.get("/{meal_id}", response_model=MealResponse)
async def get_meal(
    meal_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific meal by ID."""
    result = await db.execute(
        select(Meal)
        .options(selectinload(Meal.entries))
        .where(Meal.id == meal_id)
    )
    meal = result.scalar_one_or_none()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@router.post("/{meal_id}/entries", response_model=MealEntryResponse)
async def add_meal_entry(
    meal_id: int,
    entry: MealEntryCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add a food entry to a meal."""
    # Verify meal exists
    result = await db.execute(select(Meal).where(Meal.id == meal_id))
    meal = result.scalar_one_or_none()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    db_entry = MealEntry(
        meal_id=meal_id,
        food_id=entry.food_id,
        food_name=entry.food_name,
        recipe_id=entry.recipe_id,
        amount=entry.amount,
        unit=entry.unit,
        calories=entry.calories,
        protein=entry.protein,
        carbs=entry.carbs,
        fat=entry.fat,
    )
    db.add(db_entry)
    
    # Update meal totals
    meal.total_calories += entry.calories
    meal.total_protein += entry.protein
    meal.total_carbs += entry.carbs
    meal.total_fat += entry.fat
    
    await db.commit()
    await db.refresh(db_entry)
    return db_entry


@router.delete("/{meal_id}/entries/{entry_id}")
async def remove_meal_entry(
    meal_id: int,
    entry_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Remove a food entry from a meal."""
    result = await db.execute(
        select(MealEntry).where(
            and_(MealEntry.id == entry_id, MealEntry.meal_id == meal_id)
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Update meal totals
    result = await db.execute(select(Meal).where(Meal.id == meal_id))
    meal = result.scalar_one()
    meal.total_calories -= entry.calories
    meal.total_protein -= entry.protein
    meal.total_carbs -= entry.carbs
    meal.total_fat -= entry.fat
    
    await db.delete(entry)
    await db.commit()
    return {"message": "Entry removed successfully"}


@router.delete("/{meal_id}")
async def delete_meal(
    meal_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete an entire meal."""
    result = await db.execute(select(Meal).where(Meal.id == meal_id))
    meal = result.scalar_one_or_none()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    await db.delete(meal)
    await db.commit()
    return {"message": "Meal deleted successfully"}
