from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.db.database import get_db
from app.db import models, schemas
from app.services.recipe_service import RecipeService

router = APIRouter()

def build_recipe_response(recipe, recipe_ingredients):
    """Helper function to build a properly formatted recipe response"""
    # Build ingredients list
    ingredients = []
    for ri in recipe_ingredients:
        ingredients.append({
            "ingredient_id": ri.ingredient_id,
            "quantity": ri.quantity,
            "unit": ri.unit,
            "ingredient": {
                "id": ri.ingredient_id,
                "name": ri.name,
                "calories_per_100g": ri.calories_per_100g,
                "protein_per_100g": ri.protein_per_100g,
                "carbs_per_100g": ri.carbs_per_100g,
                "fat_per_100g": ri.fat_per_100g,
                "fiber_per_100g": ri.fiber_per_100g,
                "sugar_per_100g": ri.sugar_per_100g,
                "sodium_per_100g": ri.sodium_per_100g,
                "calories_per_serving": ri.calories_per_serving,
                "protein_per_serving": ri.protein_per_serving,
                "carbs_per_serving": ri.carbs_per_serving,
                "fat_per_serving": ri.fat_per_serving,
                "fiber_per_serving": ri.fiber_per_serving,
                "sugar_per_serving": ri.sugar_per_serving,
                "sodium_per_serving": ri.sodium_per_serving,
                "serving_size": ri.serving_size,
                "serving_unit": ri.serving_unit,
                "serving_description": ri.serving_description,
                "category": ri.category
            }
        })
    
    # Build recipe response
    return {
        "id": recipe.id,
        "title": recipe.title,
        "description": recipe.description,
        "instructions": recipe.instructions,
        "prep_time": recipe.prep_time,
        "cook_time": recipe.cook_time,
        "servings": recipe.servings,
        "difficulty": recipe.difficulty,
        "cuisine_type": recipe.cuisine_type,
        "dietary_tags": recipe.dietary_tags,
        "created_at": recipe.created_at,
        "updated_at": recipe.updated_at,
        "is_ai_generated": recipe.is_ai_generated,
        "owner_id": recipe.owner_id,
        "ingredients": ingredients
    }

def get_recipe_ingredients(db: Session, recipe_id: int):
    """Helper function to get recipe ingredients with full nutrition data"""
    return db.execute(
        text("""
        SELECT ri.ingredient_id, ri.quantity, ri.unit, i.name, i.calories_per_100g, 
               i.protein_per_100g, i.carbs_per_100g, i.fat_per_100g, i.fiber_per_100g,
               i.sugar_per_100g, i.sodium_per_100g, i.category,
               i.calories_per_serving, i.protein_per_serving, i.carbs_per_serving, 
               i.fat_per_serving, i.fiber_per_serving, i.sugar_per_serving, 
               i.sodium_per_serving, i.serving_size, i.serving_unit, i.serving_description
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = :recipe_id
        """), {"recipe_id": recipe_id}
    ).fetchall()

@router.get("/", response_model=List[schemas.Recipe])
def get_recipes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all recipes with pagination"""
    recipes = db.query(models.Recipe).offset(skip).limit(limit).all()
    
    # Convert to response format with ingredients
    result = []
    for recipe in recipes:
        recipe_ingredients = get_recipe_ingredients(db, recipe.id)
        recipe_data = build_recipe_response(recipe, recipe_ingredients)
        result.append(recipe_data)
    
    return result

@router.get("/{recipe_id}", response_model=schemas.Recipe)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Get a specific recipe by ID"""
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe_ingredients = get_recipe_ingredients(db, recipe_id)
    return build_recipe_response(recipe, recipe_ingredients)

@router.post("/", response_model=schemas.Recipe, status_code=status.HTTP_201_CREATED)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    """Create a new recipe"""
    # For now, we'll use a default user_id of 1
    # In a real app, you'd get this from authentication
    created_recipe = RecipeService.create_recipe(db, recipe, user_id=1)
    
    recipe_ingredients = get_recipe_ingredients(db, created_recipe.id)
    return build_recipe_response(created_recipe, recipe_ingredients)

@router.put("/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(recipe_id: int, recipe_update: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    """Update an existing recipe"""
    recipe = RecipeService.update_recipe(db, recipe_id, recipe_update)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe_ingredients = get_recipe_ingredients(db, recipe.id)
    return build_recipe_response(recipe, recipe_ingredients)

@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Delete a recipe"""
    success = RecipeService.delete_recipe(db, recipe_id)
    if not success:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"message": "Recipe deleted successfully"}

@router.get("/{recipe_id}/nutrition", response_model=schemas.RecipeNutrition)
def get_recipe_nutrition(recipe_id: int, servings: float = 1.0, db: Session = Depends(get_db)):
    """Calculate nutrition for a recipe with custom serving size"""
    nutrition = RecipeService.calculate_nutrition(db, recipe_id, servings)
    if nutrition is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return nutrition 