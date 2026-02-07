"""Week plan API endpoints."""

from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.week_plan import WeekPlan, WeekPlanMeal, WeekPlanStatus
from app.models.meal import Meal, MealEntry
from app.models.goal import Goal
from app.models.preferences import UserPreferences
from app.schemas.week_plan import (
    WeekPlanCreate, 
    WeekPlanUpdate, 
    WeekPlanResponse, 
    WeekPlanSummary,
    WeekPlanMealCreate,
    WeekPlanMealResponse,
    ApplyToDiaryRequest,
    CreateFromAIPlanRequest,
    RegenerateDayRequest,
)
from app.services.gemini import GeminiService

router = APIRouter()


@router.get("/", response_model=list[WeekPlanSummary])
async def get_week_plans(
    db: AsyncSession = Depends(get_db),
    status: str | None = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all week plans."""
    query = select(WeekPlan)
    
    if status:
        query = query.where(WeekPlan.status == status)
    
    query = query.order_by(WeekPlan.updated_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    plans = result.scalars().all()
    
    # Add meal count to summaries
    summaries = []
    for plan in plans:
        summary = WeekPlanSummary(
            id=plan.id,
            name=plan.name,
            start_date=plan.start_date,
            status=plan.status,
            total_calories=plan.total_calories,
            total_protein=plan.total_protein,
            total_carbs=plan.total_carbs,
            total_fat=plan.total_fat,
            meal_count=len(plan.meals),
            created_at=plan.created_at,
            updated_at=plan.updated_at,
        )
        summaries.append(summary)
    
    return summaries


@router.get("/draft", response_model=WeekPlanResponse | None)
async def get_draft_plan(
    db: AsyncSession = Depends(get_db),
):
    """Get the current draft week plan (most recent)."""
    result = await db.execute(
        select(WeekPlan)
        .where(WeekPlan.status == WeekPlanStatus.DRAFT.value)
        .order_by(WeekPlan.updated_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


@router.get("/{plan_id}", response_model=WeekPlanResponse)
async def get_week_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific week plan by ID."""
    result = await db.execute(
        select(WeekPlan).where(WeekPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Week plan not found")
    
    return plan


@router.post("/", response_model=WeekPlanResponse)
async def create_week_plan(
    plan: WeekPlanCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new week plan."""
    db_plan = WeekPlan(
        name=plan.name,
        start_date=plan.start_date,
        status=plan.status,
        notes=plan.notes,
    )
    
    # Add meals if provided
    for meal_data in plan.meals:
        meal = WeekPlanMeal(
            day_index=meal_data.day_index,
            meal_type=meal_data.meal_type,
            food_id=meal_data.food_id,
            food_cache_id=meal_data.food_cache_id,
            recipe_id=meal_data.recipe_id,
            food_name=meal_data.food_name,
            description=meal_data.description,
            amount=meal_data.amount,
            unit=meal_data.unit,
            calories=meal_data.calories,
            protein=meal_data.protein,
            carbs=meal_data.carbs,
            fat=meal_data.fat,
        )
        db_plan.meals.append(meal)
    
    # Update totals
    db_plan.update_totals()
    
    db.add(db_plan)
    await db.commit()
    await db.refresh(db_plan)
    return db_plan


@router.put("/{plan_id}", response_model=WeekPlanResponse)
async def update_week_plan(
    plan_id: int,
    plan_update: WeekPlanUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a week plan."""
    result = await db.execute(
        select(WeekPlan).where(WeekPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Week plan not found")
    
    if plan_update.name is not None:
        plan.name = plan_update.name
    if plan_update.start_date is not None:
        plan.start_date = plan_update.start_date
    if plan_update.status is not None:
        plan.status = plan_update.status
    if plan_update.notes is not None:
        plan.notes = plan_update.notes
    
    await db.commit()
    await db.refresh(plan)
    return plan


@router.delete("/{plan_id}")
async def delete_week_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a week plan."""
    result = await db.execute(
        select(WeekPlan).where(WeekPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Week plan not found")
    
    await db.delete(plan)
    await db.commit()
    return {"message": "Week plan deleted successfully"}


@router.post("/{plan_id}/meals", response_model=WeekPlanMealResponse)
async def add_meal_to_plan(
    plan_id: int,
    meal: WeekPlanMealCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add a meal to a week plan."""
    result = await db.execute(
        select(WeekPlan).where(WeekPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Week plan not found")
    
    db_meal = WeekPlanMeal(
        week_plan_id=plan_id,
        day_index=meal.day_index,
        meal_type=meal.meal_type,
        food_id=meal.food_id,
        food_cache_id=meal.food_cache_id,
        recipe_id=meal.recipe_id,
        food_name=meal.food_name,
        description=meal.description,
        amount=meal.amount,
        unit=meal.unit,
        calories=meal.calories,
        protein=meal.protein,
        carbs=meal.carbs,
        fat=meal.fat,
    )
    
    db.add(db_meal)
    
    # Update plan totals
    plan.total_calories += db_meal.calories
    plan.total_protein += db_meal.protein
    plan.total_carbs += db_meal.carbs
    plan.total_fat += db_meal.fat
    
    await db.commit()
    await db.refresh(db_meal)
    return db_meal


@router.delete("/{plan_id}/days/{day_index}")
async def clear_day_from_plan(
    plan_id: int,
    day_index: int,
    db: AsyncSession = Depends(get_db),
):
    """Remove all meals for a specific day from a week plan."""
    result = await db.execute(
        select(WeekPlan).where(WeekPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Week plan not found")
    
    # Find all meals for this day
    meals_result = await db.execute(
        select(WeekPlanMeal).where(
            WeekPlanMeal.week_plan_id == plan_id,
            WeekPlanMeal.day_index == day_index,
        )
    )
    meals = meals_result.scalars().all()
    
    # Update totals and delete meals
    for meal in meals:
        plan.total_calories -= meal.calories
        plan.total_protein -= meal.protein
        plan.total_carbs -= meal.carbs
        plan.total_fat -= meal.fat
        await db.delete(meal)
    
    await db.commit()
    return {"message": f"Cleared {len(meals)} meals from day {day_index}"}


@router.delete("/{plan_id}/meals/{meal_id}")
async def remove_meal_from_plan(
    plan_id: int,
    meal_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Remove a meal from a week plan."""
    result = await db.execute(
        select(WeekPlanMeal)
        .where(WeekPlanMeal.id == meal_id, WeekPlanMeal.week_plan_id == plan_id)
    )
    meal = result.scalar_one_or_none()
    
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found in this plan")
    
    # Get plan to update totals
    plan_result = await db.execute(
        select(WeekPlan).where(WeekPlan.id == plan_id)
    )
    plan = plan_result.scalar_one()
    
    # Update plan totals
    plan.total_calories -= meal.calories
    plan.total_protein -= meal.protein
    plan.total_carbs -= meal.carbs
    plan.total_fat -= meal.fat
    
    await db.delete(meal)
    await db.commit()
    return {"message": "Meal removed from plan"}


@router.post("/{plan_id}/apply-to-diary")
async def apply_plan_to_diary(
    plan_id: int,
    request: ApplyToDiaryRequest,
    db: AsyncSession = Depends(get_db),
):
    """Apply a week plan to the actual diary (create real meals)."""
    result = await db.execute(
        select(WeekPlan).where(WeekPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Week plan not found")
    
    meals_created = 0
    
    for plan_meal in plan.meals:
        # Calculate the actual date for this meal
        meal_date = request.target_start_date + timedelta(days=plan_meal.day_index)
        
        # Check if a meal already exists for this date and meal type
        existing_result = await db.execute(
            select(Meal)
            .where(Meal.date == meal_date, Meal.meal_type == plan_meal.meal_type)
        )
        existing_meal = existing_result.scalar_one_or_none()
        
        if not existing_meal:
            # Create new meal
            existing_meal = Meal(
                date=meal_date,
                meal_type=plan_meal.meal_type,
            )
            db.add(existing_meal)
            await db.flush()
        
        # Create meal entry
        entry = MealEntry(
            meal_id=existing_meal.id,
            food_id=plan_meal.food_id,
            recipe_id=plan_meal.recipe_id,
            food_name=plan_meal.food_name,
            amount=plan_meal.amount,
            unit=plan_meal.unit,
            calories=plan_meal.calories,
            protein=plan_meal.protein,
            carbs=plan_meal.carbs,
            fat=plan_meal.fat,
        )
        db.add(entry)
        
        # Update meal totals
        existing_meal.total_calories += plan_meal.calories
        existing_meal.total_protein += plan_meal.protein
        existing_meal.total_carbs += plan_meal.carbs
        existing_meal.total_fat += plan_meal.fat
        
        meals_created += 1
    
    # Mark plan as active
    plan.status = WeekPlanStatus.ACTIVE.value
    
    await db.commit()
    
    return {
        "message": f"Applied {meals_created} meals to diary",
        "meals_created": meals_created,
        "start_date": request.target_start_date.isoformat(),
        "end_date": (request.target_start_date + timedelta(days=6)).isoformat(),
    }


@router.post("/{plan_id}/regenerate-day", response_model=WeekPlanResponse)
async def regenerate_day(
    plan_id: int,
    request: RegenerateDayRequest,
    db: AsyncSession = Depends(get_db),
):
    """Regenerate a day (or specific meal) in the week plan using AI."""
    result = await db.execute(
        select(WeekPlan).where(WeekPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Week plan not found")
    
    # Get current goal
    goal_result = await db.execute(
        select(Goal).where(Goal.is_active == True)
    )
    goal = goal_result.scalar_one_or_none()
    calories = goal.daily_calories if goal else 2000
    protein = goal.daily_protein if goal else 150
    carbs = goal.daily_carbs if goal else 200
    fat = goal.daily_fat if goal else 65
    
    # Get user preferences
    pref_result = await db.execute(
        select(UserPreferences).order_by(UserPreferences.id.desc()).limit(1)
    )
    user_prefs = pref_result.scalar_one_or_none()
    
    preferences = []
    restrictions = []
    if user_prefs:
        if user_prefs.liked_foods:
            preferences.extend([f"Include: {food}" for food in user_prefs.liked_foods])
        if user_prefs.disliked_foods:
            restrictions.extend([f"Avoid: {food}" for food in user_prefs.disliked_foods])
        if user_prefs.allergies:
            restrictions.extend([f"ALLERGY - must avoid: {a}" for a in user_prefs.allergies])
        if user_prefs.dietary_restrictions:
            diet = user_prefs.dietary_restrictions
            if diet.get("vegan"): restrictions.append("Vegan")
            if diet.get("vegetarian"): restrictions.append("Vegetarian")
            if diet.get("gluten_free"): restrictions.append("Gluten-free")
            if diet.get("dairy_free"): restrictions.append("Dairy-free")
    
    # Build week context from existing meals (excluding the day being regenerated)
    existing_week_context = []
    for day_idx in range(7):
        if day_idx == request.day_index:
            continue
        day_meals = [m for m in plan.meals if m.day_index == day_idx]
        if day_meals:
            existing_week_context.append({
                "day": day_idx + 1,
                "meals": [m.food_name for m in day_meals],
            })
    
    # Call AI to generate the day
    gemini = GeminiService()
    ai_day = await gemini.generate_single_day(
        calories=calories,
        protein=protein,
        carbs=carbs,
        fat=fat,
        day_index=request.day_index,
        existing_week_context=existing_week_context,
        meal_type_filter=request.meal_type,
        preferences=preferences,
        restrictions=restrictions,
        language=request.language,
    )
    
    # Determine which meal types to regenerate
    meal_types_to_regenerate = (
        [request.meal_type] if request.meal_type
        else ["breakfast", "lunch", "dinner", "snack"]
    )
    
    # Delete old meals for the day/meal_type
    old_meals_result = await db.execute(
        select(WeekPlanMeal).where(
            WeekPlanMeal.week_plan_id == plan_id,
            WeekPlanMeal.day_index == request.day_index,
            WeekPlanMeal.meal_type.in_(meal_types_to_regenerate),
        )
    )
    old_meals = old_meals_result.scalars().all()
    for old_meal in old_meals:
        plan.total_calories -= old_meal.calories
        plan.total_protein -= old_meal.protein
        plan.total_carbs -= old_meal.carbs
        plan.total_fat -= old_meal.fat
        await db.delete(old_meal)
    
    # Add new meals from AI response
    meal_type_mapping = {
        "breakfast": ("breakfast", "breakfast_description", 0.25),
        "lunch": ("lunch", "lunch_description", 0.30),
        "dinner": ("dinner", "dinner_description", 0.35),
        "snack": ("snacks", None, 0.10),
    }
    
    for mtype in meal_types_to_regenerate:
        if mtype == "snack":
            snacks = ai_day.snacks or []
            for snack_name in snacks:
                cal_share = ai_day.estimated_calories * 0.10 / max(len(snacks), 1)
                prot_share = ai_day.estimated_protein * 0.10 / max(len(snacks), 1)
                carb_share = ai_day.estimated_carbs * 0.10 / max(len(snacks), 1)
                fat_share = ai_day.estimated_fat * 0.10 / max(len(snacks), 1)
                
                new_meal = WeekPlanMeal(
                    week_plan_id=plan_id,
                    day_index=request.day_index,
                    meal_type="snack",
                    food_name=snack_name,
                    amount=1,
                    unit="serving",
                    calories=cal_share,
                    protein=prot_share,
                    carbs=carb_share,
                    fat=fat_share,
                )
                db.add(new_meal)
                plan.total_calories += new_meal.calories
                plan.total_protein += new_meal.protein
                plan.total_carbs += new_meal.carbs
                plan.total_fat += new_meal.fat
        else:
            name_attr, desc_attr, factor = meal_type_mapping[mtype]
            food_name = getattr(ai_day, name_attr, "Unknown")
            description = getattr(ai_day, desc_attr, "") if desc_attr else ""
            
            new_meal = WeekPlanMeal(
                week_plan_id=plan_id,
                day_index=request.day_index,
                meal_type=mtype,
                food_name=food_name,
                description=description,
                amount=1,
                unit="serving",
                calories=ai_day.estimated_calories * factor,
                protein=ai_day.estimated_protein * factor,
                carbs=ai_day.estimated_carbs * factor,
                fat=ai_day.estimated_fat * factor,
            )
            db.add(new_meal)
            plan.total_calories += new_meal.calories
            plan.total_protein += new_meal.protein
            plan.total_carbs += new_meal.carbs
            plan.total_fat += new_meal.fat
    
    await db.commit()
    await db.refresh(plan)
    return plan


@router.post("/from-ai-plan", response_model=WeekPlanResponse)
async def create_from_ai_plan(
    request: CreateFromAIPlanRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create a week plan from an AI-generated meal plan."""
    db_plan = WeekPlan(
        name=request.name,
        start_date=request.start_date,
        status=WeekPlanStatus.DRAFT.value,
    )
    
    meal_type_mapping = {
        "breakfast": "breakfast",
        "lunch": "lunch",
        "dinner": "dinner",
        "snacks": "snack",
    }
    
    for day_index, day in enumerate(request.days):
        # Process each meal type for this day
        for meal_key, meal_type in meal_type_mapping.items():
            meals_list = getattr(day, meal_key, [])
            
            for meal_item in meals_list:
                food_name = meal_item.get("name", "Unknown")
                description = meal_item.get("description", "")
                
                # Estimate calories from the day if not provided per meal
                # This is a rough split based on typical meal distribution
                if meal_key == "breakfast":
                    cal_factor = 0.25
                elif meal_key == "lunch":
                    cal_factor = 0.30
                elif meal_key == "dinner":
                    cal_factor = 0.35
                else:
                    cal_factor = 0.10
                
                db_meal = WeekPlanMeal(
                    day_index=day_index,
                    meal_type=meal_type,
                    food_name=food_name,
                    description=description,
                    amount=1,
                    unit="serving",
                    calories=day.estimated_calories * cal_factor / max(len(meals_list), 1),
                    protein=day.estimated_protein * cal_factor / max(len(meals_list), 1),
                    carbs=day.estimated_carbs * cal_factor / max(len(meals_list), 1),
                    fat=day.estimated_fat * cal_factor / max(len(meals_list), 1),
                )
                db_plan.meals.append(db_meal)
    
    # Update totals
    db_plan.update_totals()
    
    db.add(db_plan)
    await db.commit()
    await db.refresh(db_plan)
    return db_plan
