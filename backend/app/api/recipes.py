from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db import models, schemas
from app.services.recipe_service import RecipeService

router = APIRouter()

@router.get("/", response_model=List[schemas.Recipe])
def get_recipes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all recipes with pagination"""
    recipes = db.query(models.Recipe).offset(skip).limit(limit).all()
    return recipes

@router.get("/{recipe_id}", response_model=schemas.Recipe)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Get a specific recipe by ID"""
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

@router.post("/", response_model=schemas.Recipe, status_code=status.HTTP_201_CREATED)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    """Create a new recipe"""
    # For now, we'll use a default user_id of 1
    # In a real app, you'd get this from authentication
    return RecipeService.create_recipe(db, recipe, user_id=1)

@router.put("/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(recipe_id: int, recipe_update: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    """Update an existing recipe"""
    recipe = RecipeService.update_recipe(db, recipe_id, recipe_update)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

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