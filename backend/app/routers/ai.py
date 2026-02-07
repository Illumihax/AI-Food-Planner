"""AI-powered features API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.goal import Goal
from app.models.preferences import UserPreferences
from app.schemas.ai import (
    MealPlanRequest, MealPlanResponse,
    RecipeSuggestionRequest, RecipeSuggestionResponse,
    ChatRequest, ChatResponse
)
from app.services.gemini import GeminiService

router = APIRouter()
gemini_service = GeminiService()


@router.post("/meal-plan", response_model=MealPlanResponse)
async def generate_meal_plan(
    request: MealPlanRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate a weekly meal plan based on goals, preferences, and user settings."""
    # Get current goal if not provided in request
    goal = None
    if request.use_current_goal:
        result = await db.execute(
            select(Goal).where(Goal.is_active == True)
        )
        goal = result.scalar_one_or_none()
    
    # Get user preferences
    pref_result = await db.execute(
        select(UserPreferences).order_by(UserPreferences.id.desc()).limit(1)
    )
    user_prefs = pref_result.scalar_one_or_none()
    
    # Combine request preferences with user preferences
    preferences = list(request.preferences or [])
    restrictions = list(request.restrictions or [])
    
    if user_prefs:
        # Add liked foods as preferences
        if user_prefs.liked_foods:
            preferences.extend([f"Include: {food}" for food in user_prefs.liked_foods])
        
        # Add disliked foods as restrictions
        if user_prefs.disliked_foods:
            restrictions.extend([f"Avoid: {food}" for food in user_prefs.disliked_foods])
        
        # Add allergies as strict restrictions
        if user_prefs.allergies:
            restrictions.extend([f"ALLERGY - must avoid: {allergy}" for allergy in user_prefs.allergies])
        
        # Add dietary restrictions
        if user_prefs.dietary_restrictions:
            diet_prefs = user_prefs.dietary_restrictions
            if diet_prefs.get("vegan"):
                restrictions.append("Vegan (no animal products)")
            if diet_prefs.get("vegetarian"):
                restrictions.append("Vegetarian (no meat)")
            if diet_prefs.get("pescatarian"):
                restrictions.append("Pescatarian (fish ok, no other meat)")
            if diet_prefs.get("gluten_free"):
                restrictions.append("Gluten-free")
            if diet_prefs.get("dairy_free"):
                restrictions.append("Dairy-free")
            if diet_prefs.get("nut_free"):
                restrictions.append("Nut-free")
            if diet_prefs.get("halal"):
                restrictions.append("Halal")
            if diet_prefs.get("kosher"):
                restrictions.append("Kosher")
            if diet_prefs.get("low_carb"):
                preferences.append("Low carb diet")
            if diet_prefs.get("keto"):
                preferences.append("Keto diet (very low carb, high fat)")
        
        # Add budget preference
        if user_prefs.budget_preference:
            budget_map = {
                "low": "Budget-friendly, affordable ingredients",
                "medium": "Moderate budget, balance of quality and cost",
                "high": "Premium ingredients, no budget constraints"
            }
            preferences.append(budget_map.get(user_prefs.budget_preference, ""))
        
        # Add cooking time preference
        if user_prefs.max_cooking_time_minutes:
            preferences.append(f"Recipes should take max {user_prefs.max_cooking_time_minutes} minutes to cook")
    
    try:
        plan = await gemini_service.generate_meal_plan(
            calories=request.daily_calories or (goal.daily_calories if goal else 2000),
            protein=request.daily_protein or (goal.daily_protein if goal else 150),
            carbs=request.daily_carbs or (goal.daily_carbs if goal else 200),
            fat=request.daily_fat or (goal.daily_fat if goal else 65),
            days=request.days,
            preferences=preferences,
            restrictions=restrictions,
            language=request.language,
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/suggest-recipes", response_model=RecipeSuggestionResponse)
async def suggest_recipes(
    request: RecipeSuggestionRequest,
):
    """Suggest recipes based on available ingredients."""
    try:
        suggestions = await gemini_service.suggest_recipes(
            ingredients=request.ingredients,
            meal_type=request.meal_type,
            cuisine=request.cuisine,
            max_recipes=request.max_recipes,
            language=request.language,
        )
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
async def nutrition_chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Chat with AI about nutrition and food planning."""
    # Get current goal for context
    goal = None
    result = await db.execute(
        select(Goal).where(Goal.is_active == True)
    )
    goal = result.scalar_one_or_none()
    
    goal_context = None
    if goal:
        goal_context = {
            "calories": goal.daily_calories,
            "protein": goal.daily_protein,
            "carbs": goal.daily_carbs,
            "fat": goal.daily_fat,
        }
    
    try:
        response = await gemini_service.chat(
            message=request.message,
            conversation_history=request.conversation_history,
            goal_context=goal_context,
            language=request.language,
        )
        return response
    except Exception as e:
        import logging
        logging.error(f"AI chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
