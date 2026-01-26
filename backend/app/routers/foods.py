"""Food-related API endpoints."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.models.food import Food
from app.models.food_cache import FoodCache
from app.schemas.food import FoodCreate, FoodResponse, FoodSearchResult
from app.services.openfoodfacts import OpenFoodFactsService

router = APIRouter()
off_service = OpenFoodFactsService()

# Cache duration: 30 days
CACHE_DURATION_DAYS = 30


async def cache_food_results(
    db: AsyncSession,
    results: list[FoodSearchResult],
    search_query: str,
) -> None:
    """Cache food search results in the database."""
    expires_at = datetime.utcnow() + timedelta(days=CACHE_DURATION_DAYS)
    
    for food in results:
        if not food.barcode:
            continue
            
        # Check if already cached
        existing = await db.execute(
            select(FoodCache).where(FoodCache.barcode == food.barcode)
        )
        cached_food = existing.scalar_one_or_none()
        
        if cached_food:
            # Update existing cache entry
            cached_food.name = food.name
            cached_food.brand = food.brand
            cached_food.image_url = food.image_url
            cached_food.calories = food.calories
            cached_food.protein = food.protein
            cached_food.carbs = food.carbs
            cached_food.fat = food.fat
            cached_food.fiber = food.fiber
            cached_food.sugar = food.sugar
            cached_food.sodium = food.sodium
            cached_food.nutriscore_grade = food.nutriscore_grade
            cached_food.nova_group = food.nova_group
            cached_food.cached_at = datetime.utcnow()
            cached_food.expires_at = expires_at
            # Add search query if not already associated
            if cached_food.search_query and search_query.lower() not in cached_food.search_query.lower():
                cached_food.search_query = f"{cached_food.search_query}|{search_query.lower()}"
            elif not cached_food.search_query:
                cached_food.search_query = search_query.lower()
        else:
            # Create new cache entry
            new_cache = FoodCache(
                barcode=food.barcode,
                search_query=search_query.lower(),
                name=food.name,
                brand=food.brand,
                image_url=food.image_url,
                calories=food.calories,
                protein=food.protein,
                carbs=food.carbs,
                fat=food.fat,
                fiber=food.fiber,
                sugar=food.sugar,
                sodium=food.sodium,
                nutriscore_grade=food.nutriscore_grade,
                nova_group=food.nova_group,
                expires_at=expires_at,
            )
            db.add(new_cache)
    
    await db.commit()


async def get_cached_results(
    db: AsyncSession,
    search_query: str,
) -> list[FoodSearchResult] | None:
    """Get cached search results if available and not expired."""
    now = datetime.utcnow()
    query_lower = search_query.lower()
    
    # Search for cached results that match the query
    result = await db.execute(
        select(FoodCache).where(
            FoodCache.search_query.ilike(f"%{query_lower}%"),
            FoodCache.expires_at > now,
        ).limit(50)
    )
    cached_foods = result.scalars().all()
    
    if not cached_foods:
        return None
    
    return [
        FoodSearchResult(
            barcode=f.barcode,
            name=f.name,
            brand=f.brand,
            image_url=f.image_url,
            calories=f.calories,
            protein=f.protein,
            carbs=f.carbs,
            fat=f.fat,
            fiber=f.fiber,
            sugar=f.sugar,
            sodium=f.sodium,
            nutriscore_grade=f.nutriscore_grade,
            nova_group=f.nova_group,
        )
        for f in cached_foods
    ]


@router.get("/search", response_model=list[FoodSearchResult])
async def search_foods(
    query: str = Query(..., min_length=2, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    force_refresh: bool = Query(False, description="Force refresh from API"),
    db: AsyncSession = Depends(get_db),
):
    """Search for foods in Open Food Facts database with caching."""
    # Check cache first (only for page 1 and if not forcing refresh)
    if page == 1 and not force_refresh:
        cached = await get_cached_results(db, query)
        if cached and len(cached) >= 5:  # Return cache if we have enough results
            return cached
    
    # Fetch from Open Food Facts API
    results = await off_service.search_products(query, page, page_size)
    
    # Cache results in background (don't block response)
    if results:
        await cache_food_results(db, results, query)
    
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
