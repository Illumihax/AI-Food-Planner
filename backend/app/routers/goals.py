"""Goals and targets API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.goal import Goal
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate

router = APIRouter()


@router.get("/", response_model=GoalResponse | None)
async def get_current_goal(
    db: AsyncSession = Depends(get_db),
):
    """Get the current active goal (most recent)."""
    result = await db.execute(
        select(Goal).where(Goal.is_active == True).order_by(Goal.created_at.desc())
    )
    return result.scalar_one_or_none()


@router.get("/history", response_model=list[GoalResponse])
async def get_goal_history(
    db: AsyncSession = Depends(get_db),
):
    """Get all goals (history)."""
    result = await db.execute(select(Goal).order_by(Goal.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=GoalResponse)
async def create_goal(
    goal: GoalCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new goal (deactivates previous goals)."""
    # Deactivate all existing goals
    result = await db.execute(select(Goal).where(Goal.is_active == True))
    for existing_goal in result.scalars():
        existing_goal.is_active = False
    
    # Create new goal
    db_goal = Goal(
        daily_calories=goal.daily_calories,
        daily_protein=goal.daily_protein,
        daily_carbs=goal.daily_carbs,
        daily_fat=goal.daily_fat,
        notes=goal.notes,
        is_active=True,
    )
    db.add(db_goal)
    await db.commit()
    await db.refresh(db_goal)
    return db_goal


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing goal."""
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if goal_update.daily_calories is not None:
        goal.daily_calories = goal_update.daily_calories
    if goal_update.daily_protein is not None:
        goal.daily_protein = goal_update.daily_protein
    if goal_update.daily_carbs is not None:
        goal.daily_carbs = goal_update.daily_carbs
    if goal_update.daily_fat is not None:
        goal.daily_fat = goal_update.daily_fat
    if goal_update.notes is not None:
        goal.notes = goal_update.notes
    
    await db.commit()
    await db.refresh(goal)
    return goal


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a goal."""
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.delete(goal)
    await db.commit()
    return {"message": "Goal deleted successfully"}
