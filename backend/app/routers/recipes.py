"""Recipe-related API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.recipe import Recipe, RecipeIngredient
from app.schemas.recipe import RecipeCreate, RecipeResponse, RecipeUpdate

router = APIRouter()


@router.get("/", response_model=list[RecipeResponse])
async def get_recipes(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: str = Query(None, description="Search by name"),
):
    """Get all recipes with optional search."""
    query = select(Recipe).options(selectinload(Recipe.ingredients))
    
    if search:
        query = query.where(Recipe.name.ilike(f"%{search}%"))
    
    query = query.offset(skip).limit(limit).order_by(Recipe.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=RecipeResponse)
async def create_recipe(
    recipe: RecipeCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new recipe with ingredients."""
    # Create recipe
    db_recipe = Recipe(
        name=recipe.name,
        description=recipe.description,
        servings=recipe.servings,
        instructions=recipe.instructions,
    )
    db.add(db_recipe)
    await db.flush()  # Get the ID
    
    # Add ingredients
    for ing in recipe.ingredients:
        db_ingredient = RecipeIngredient(
            recipe_id=db_recipe.id,
            food_id=ing.food_id,
            food_name=ing.food_name,
            amount=ing.amount,
            unit=ing.unit,
            calories=ing.calories,
            protein=ing.protein,
            carbs=ing.carbs,
            fat=ing.fat,
        )
        db.add(db_ingredient)
    
    await db.commit()
    
    # Reload with ingredients
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.ingredients))
        .where(Recipe.id == db_recipe.id)
    )
    return result.scalar_one()


@router.get("/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(
    recipe_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific recipe by ID."""
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.ingredients))
        .where(Recipe.id == recipe_id)
    )
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@router.put("/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: int,
    recipe_update: RecipeUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing recipe."""
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.ingredients))
        .where(Recipe.id == recipe_id)
    )
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Update basic fields
    if recipe_update.name is not None:
        recipe.name = recipe_update.name
    if recipe_update.description is not None:
        recipe.description = recipe_update.description
    if recipe_update.servings is not None:
        recipe.servings = recipe_update.servings
    if recipe_update.instructions is not None:
        recipe.instructions = recipe_update.instructions
    
    # Update ingredients if provided
    if recipe_update.ingredients is not None:
        # Remove old ingredients
        for ing in recipe.ingredients:
            await db.delete(ing)
        
        # Add new ingredients
        for ing in recipe_update.ingredients:
            db_ingredient = RecipeIngredient(
                recipe_id=recipe.id,
                food_id=ing.food_id,
                food_name=ing.food_name,
                amount=ing.amount,
                unit=ing.unit,
                calories=ing.calories,
                protein=ing.protein,
                carbs=ing.carbs,
                fat=ing.fat,
            )
            db.add(db_ingredient)
    
    await db.commit()
    
    # Reload with ingredients
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.ingredients))
        .where(Recipe.id == recipe.id)
    )
    return result.scalar_one()


@router.delete("/{recipe_id}")
async def delete_recipe(
    recipe_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a recipe."""
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    await db.delete(recipe)
    await db.commit()
    return {"message": "Recipe deleted successfully"}
