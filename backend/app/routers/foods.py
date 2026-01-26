"""Food-related API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.food import Food
from app.schemas.food import FoodCreate, FoodResponse, FoodSearchResult
from app.services.openfoodfacts import OpenFoodFactsService

router = APIRouter()
off_service = OpenFoodFactsService()


@router.get("/search", response_model=list[FoodSearchResult])
async def search_foods(
    query: str = Query(..., min_length=2, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
):
    """Search for foods in Open Food Facts database."""
    results = await off_service.search_products(query, page, page_size)
    return results


@router.get("/barcode/{barcode}", response_model=FoodSearchResult)
async def get_food_by_barcode(barcode: str):
    """Get food information by barcode from Open Food Facts."""
    result = await off_service.get_product_by_barcode(barcode)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return result


@router.get("/saved", response_model=list[FoodResponse])
async def get_saved_foods(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """Get all saved custom foods."""
    result = await db.execute(
        select(Food).offset(skip).limit(limit).order_by(Food.name)
    )
    return result.scalars().all()


@router.post("/", response_model=FoodResponse)
async def create_custom_food(
    food: FoodCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a custom food entry."""
    db_food = Food(**food.model_dump())
    db.add(db_food)
    await db.commit()
    await db.refresh(db_food)
    return db_food


@router.get("/{food_id}", response_model=FoodResponse)
async def get_food(
    food_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific saved food by ID."""
    result = await db.execute(select(Food).where(Food.id == food_id))
    food = result.scalar_one_or_none()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return food


@router.delete("/{food_id}")
async def delete_food(
    food_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a custom food entry."""
    result = await db.execute(select(Food).where(Food.id == food_id))
    food = result.scalar_one_or_none()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    await db.delete(food)
    await db.commit()
    return {"message": "Food deleted successfully"}
