from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.database import get_db
from app.db import models, schemas
from app.services.meal_plan_service import MealPlanService
from pydantic import BaseModel

router = APIRouter()

def get_meal_plan_safe(db: Session, meal_plan_id: int) -> Optional[dict]:
    """Get meal plan with safe serialization (no nested recipe ingredients)"""
    meal_plan = db.query(models.MealPlan).filter(models.MealPlan.id == meal_plan_id).first()
    if not meal_plan:
        return None
    
    # Get entries with basic recipe info only
    entries = []
    for entry in meal_plan.entries:
        recipe_data = None
        if entry.recipe:
            recipe_data = {
                "id": entry.recipe.id,
                "title": entry.recipe.title,
                "description": entry.recipe.description,
                "instructions": entry.recipe.instructions,
                "prep_time": entry.recipe.prep_time,
                "cook_time": entry.recipe.cook_time,
                "servings": entry.recipe.servings,
                "difficulty": entry.recipe.difficulty,
                "cuisine_type": entry.recipe.cuisine_type,
                "dietary_tags": entry.recipe.dietary_tags,
                "created_at": entry.recipe.created_at,
                "updated_at": entry.recipe.updated_at,
                "is_ai_generated": entry.recipe.is_ai_generated,
                "owner_id": entry.recipe.owner_id,
                "ingredients": [],  # Empty to avoid serialization issues
                "nutrition": None   # Can be calculated separately if needed
            }
        
        entry_data = {
            "id": entry.id,
            "meal_plan_id": entry.meal_plan_id,
            "date": entry.date,
            "meal_type": entry.meal_type,
            "recipe_id": entry.recipe_id,
            "servings": entry.servings,
            "notes": entry.notes,
            "recipe": recipe_data
        }
        entries.append(entry_data)
    
    return {
        "id": meal_plan.id,
        "name": meal_plan.name,
        "start_date": meal_plan.start_date,
        "end_date": meal_plan.end_date,
        "created_at": meal_plan.created_at,
        "updated_at": meal_plan.updated_at,
        "user_id": meal_plan.user_id,
        "entries": entries
    }

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

class WeekStartRequest(BaseModel):
    week_start: str

@router.get("/week/{week_start}")
def get_meal_plan_for_week(week_start: str, db: Session = Depends(get_db)):
    """Get meal plan for a specific week (YYYY-MM-DD format)"""
    try:
        # Parse the week start date
        week_start_date = datetime.strptime(week_start, '%Y-%m-%d').date()
        week_end_date = week_start_date + timedelta(days=6)
        
        # Convert to datetime
        week_start_dt = datetime.combine(week_start_date, datetime.min.time())
        week_end_dt = datetime.combine(week_end_date, datetime.max.time())
        
        # Find existing meal plan for this week
        meal_plan = db.query(models.MealPlan).filter(
            models.MealPlan.user_id == 1,
            models.MealPlan.start_date <= week_start_dt,
            models.MealPlan.end_date >= week_end_dt
        ).first()
        
        if not meal_plan:
            return None
            
        return get_meal_plan_safe(db, meal_plan.id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

@router.post("/create-for-week", status_code=status.HTTP_201_CREATED)
def create_meal_plan_for_week(request: WeekStartRequest, db: Session = Depends(get_db)):
    """Create a new meal plan for a specific week"""
    try:
        # Parse the week start date
        week_start_date = datetime.strptime(request.week_start, '%Y-%m-%d').date()
        week_end_date = week_start_date + timedelta(days=6)
        
        # Convert to datetime
        week_start_dt = datetime.combine(week_start_date, datetime.min.time())
        week_end_dt = datetime.combine(week_end_date, datetime.max.time())
        
        # Check if meal plan already exists for this week
        existing_plan = db.query(models.MealPlan).filter(
            models.MealPlan.user_id == 1,
            models.MealPlan.start_date <= week_start_dt,
            models.MealPlan.end_date >= week_end_dt
        ).first()
        
        if existing_plan:
            return get_meal_plan_safe(db, existing_plan.id)
        
        # Create new meal plan for the week
        meal_plan_data = schemas.MealPlanCreate(
            name=f"Week of {week_start_date.strftime('%B %d, %Y')}",
            start_date=week_start_dt,
            end_date=week_end_dt
        )
        meal_plan = MealPlanService.create_meal_plan(db, meal_plan_data, user_id=1)
        
        return get_meal_plan_safe(db, meal_plan.id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

class AssignMealRequest(BaseModel):
    date: str
    meal_type: str
    recipe_id: int
    servings: float = 1.0

class MealAssignmentResponse(BaseModel):
    id: int
    meal_plan_id: int
    date: datetime
    meal_type: str
    recipe_id: int
    servings: float
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.post("/assign-meal", response_model=MealAssignmentResponse, status_code=status.HTTP_201_CREATED)
def assign_meal_to_slot(request: AssignMealRequest, db: Session = Depends(get_db)):
    """Assign a meal to a specific time slot, creating meal plan if needed"""
    try:
        # Parse the date
        meal_date = datetime.strptime(request.date, '%Y-%m-%d').date()
        
        # Calculate week start (Monday)
        days_since_monday = meal_date.weekday()
        week_start = meal_date - timedelta(days=days_since_monday)
        week_end = week_start + timedelta(days=6)
        
        # Convert to datetime
        week_start_dt = datetime.combine(week_start, datetime.min.time())
        week_end_dt = datetime.combine(week_end, datetime.max.time())
        meal_date_dt = datetime.combine(meal_date, datetime.min.time())
        
        # Find existing meal plan for this week
        meal_plan = db.query(models.MealPlan).filter(
            models.MealPlan.user_id == 1,
            models.MealPlan.start_date <= week_start_dt,
            models.MealPlan.end_date >= week_end_dt
        ).first()
        
        # Create meal plan if it doesn't exist
        if meal_plan is None:
            meal_plan_data = schemas.MealPlanCreate(
                name=f"Week of {week_start.strftime('%B %d, %Y')}",
                start_date=week_start_dt,
                end_date=week_end_dt
            )
            meal_plan = MealPlanService.create_meal_plan(db, meal_plan_data, user_id=1)
        
        # Create the meal plan entry directly
        db_entry = models.MealPlanEntry(
            meal_plan_id=meal_plan.id,
            date=meal_date_dt,
            meal_type=request.meal_type,
            recipe_id=request.recipe_id,
            servings=request.servings
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        
        # Return simplified response
        return MealAssignmentResponse(
            id=db_entry.id,
            meal_plan_id=db_entry.meal_plan_id,
            date=db_entry.date,
            meal_type=db_entry.meal_type,
            recipe_id=db_entry.recipe_id,
            servings=db_entry.servings,
            notes=db_entry.notes
        )
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")