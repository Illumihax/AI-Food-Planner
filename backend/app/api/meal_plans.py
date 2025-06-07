from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.db.database import get_db
from app.db import models, schemas
from app.services.meal_plan_service import MealPlanService

router = APIRouter()

@router.get("/", response_model=List[schemas.MealPlan])
def get_meal_plans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all meal plans with pagination"""
    # For now, we'll use a default user_id of 1
    meal_plans = db.query(models.MealPlan).filter(models.MealPlan.user_id == 1).offset(skip).limit(limit).all()
    return meal_plans



@router.get("/{meal_plan_id}", response_model=schemas.MealPlan)
def get_meal_plan(meal_plan_id: int, db: Session = Depends(get_db)):
    """Get a specific meal plan by ID"""
    meal_plan = db.query(models.MealPlan).filter(models.MealPlan.id == meal_plan_id).first()
    if meal_plan is None:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    return meal_plan

@router.post("/", response_model=schemas.MealPlan, status_code=status.HTTP_201_CREATED)
def create_meal_plan(meal_plan: schemas.MealPlanCreate, db: Session = Depends(get_db)):
    """Create a new meal plan"""
    # For now, we'll use a default user_id of 1
    return MealPlanService.create_meal_plan(db, meal_plan, user_id=1)

@router.put("/{meal_plan_id}", response_model=schemas.MealPlan)
def update_meal_plan(meal_plan_id: int, meal_plan_update: schemas.MealPlanUpdate, db: Session = Depends(get_db)):
    """Update an existing meal plan"""
    meal_plan = MealPlanService.update_meal_plan(db, meal_plan_id, meal_plan_update)
    if meal_plan is None:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    return meal_plan

@router.delete("/{meal_plan_id}")
def delete_meal_plan(meal_plan_id: int, db: Session = Depends(get_db)):
    """Delete a meal plan"""
    success = MealPlanService.delete_meal_plan(db, meal_plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    return {"message": "Meal plan deleted successfully"}

@router.post("/{meal_plan_id}/entries", response_model=schemas.MealPlanEntry, status_code=status.HTTP_201_CREATED)
def add_meal_plan_entry(meal_plan_id: int, entry: schemas.MealPlanEntryCreate, db: Session = Depends(get_db)):
    """Add an entry to a meal plan"""
    return MealPlanService.add_meal_plan_entry(db, meal_plan_id, entry)

@router.put("/entries/{entry_id}", response_model=schemas.MealPlanEntry)
def update_meal_plan_entry(entry_id: int, entry_update: schemas.MealPlanEntryUpdate, db: Session = Depends(get_db)):
    """Update a meal plan entry"""
    entry = MealPlanService.update_meal_plan_entry(db, entry_id, entry_update)
    if entry is None:
        raise HTTPException(status_code=404, detail="Meal plan entry not found")
    return entry

@router.delete("/entries/{entry_id}")
def delete_meal_plan_entry(entry_id: int, db: Session = Depends(get_db)):
    """Delete a meal plan entry"""
    success = MealPlanService.delete_meal_plan_entry(db, entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meal plan entry not found")
    return {"message": "Meal plan entry deleted successfully"}

@router.get("/{meal_plan_id}/nutrition", response_model=schemas.WeeklyNutrition)
def get_meal_plan_nutrition(meal_plan_id: int, db: Session = Depends(get_db)):
    """Get nutrition summary for a meal plan"""
    nutrition = MealPlanService.calculate_meal_plan_nutrition(db, meal_plan_id)
    if nutrition is None:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    return nutrition

@router.get("/current-week", response_model=schemas.MealPlan)
def get_current_week_meal_plan(db: Session = Depends(get_db)):
    """Get or create meal plan for current week"""
    # Calculate current week start (Monday)
    today = datetime.now().date()
    days_since_monday = today.weekday()
    week_start = today - timedelta(days=days_since_monday)
    week_end = week_start + timedelta(days=6)
    
    # Convert to datetime
    week_start_dt = datetime.combine(week_start, datetime.min.time())
    week_end_dt = datetime.combine(week_end, datetime.max.time())
    
    # Try to find existing meal plan for this week
    meal_plan = db.query(models.MealPlan).filter(
        models.MealPlan.user_id == 1,
        models.MealPlan.start_date <= week_start_dt,
        models.MealPlan.end_date >= week_end_dt
    ).first()
    
    if meal_plan is None:
        # Create new meal plan for current week
        meal_plan_data = schemas.MealPlanCreate(
            name=f"Week of {week_start.strftime('%B %d, %Y')}",
            start_date=week_start_dt,
            end_date=week_end_dt
        )
        meal_plan = MealPlanService.create_meal_plan(db, meal_plan_data, user_id=1)
    
    return meal_plan 