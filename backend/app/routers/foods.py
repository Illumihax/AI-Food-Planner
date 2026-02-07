"""Food-related API endpoints."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.database import get_db
from app.models.food import Food
from app.models.food_cache import FoodCache
from app.schemas.food import FoodCreate, FoodResponse, FoodSearchResult, FoodCacheResponse, FoodCacheUpdate
from app.services.openfoodfacts import OpenFoodFactsService

router = APIRouter()
off_service = OpenFoodFactsService()

# Cache duration: 30 days
CACHE_DURATION_DAYS = 30


async def cache_food_results(
    db: AsyncSession,
    results: list[FoodSearchResult],
    search_query: str,
    max_cache: int = 10,
) -> None:
    """Cache top N food search results in the database."""
    expires_at = datetime.utcnow() + timedelta(days=CACHE_DURATION_DAYS)
    
    for food in results[:max_cache]:
        if not food.barcode:
            continue
            
        # Check if already cached
        existing = await db.execute(
            select(FoodCache).where(FoodCache.barcode == food.barcode)
        )
        cached_food = existing.scalar_one_or_none()
        
        if cached_food:
            # Update existing cache entry (but preserve is_saved and usage_count)
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
                is_saved=False,
                usage_count=0,
            )
            db.add(new_cache)
    
    await db.commit()


async def search_local_db(
    db: AsyncSession,
    search_query: str,
    limit: int = 50,
) -> list[FoodSearchResult]:
    """Search for foods in local database (custom foods + saved cached foods)."""
    query_lower = search_query.lower()
    results: list[FoodSearchResult] = []
    
    # Search custom foods
    custom_result = await db.execute(
        select(Food).where(
            or_(
                func.lower(Food.name).contains(query_lower),
                func.lower(Food.brand).contains(query_lower),
            )
        ).limit(limit)
    )
    for food in custom_result.scalars().all():
        results.append(FoodSearchResult(
            barcode=food.barcode,
            name=food.name,
            brand=food.brand,
            image_url=None,
            calories=food.calories,
            protein=food.protein,
            carbs=food.carbs,
            fat=food.fat,
            fiber=food.fiber,
            sugar=food.sugar,
            sodium=food.sodium,
            nutriscore_grade=None,
            nova_group=None,
            source="custom",
        ))
    
    # Search saved cached foods
    cache_result = await db.execute(
        select(FoodCache).where(
            FoodCache.is_saved == True,
            or_(
                func.lower(FoodCache.name).contains(query_lower),
                func.lower(FoodCache.brand).contains(query_lower),
                FoodCache.barcode.contains(query_lower),
            )
        ).order_by(FoodCache.usage_count.desc()).limit(limit)
    )
    for food in cache_result.scalars().all():
        results.append(FoodSearchResult(
            barcode=food.barcode,
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
            source="cached",
        ))
    
    return results


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
            or_(
                FoodCache.search_query.ilike(f"%{query_lower}%"),
                func.lower(FoodCache.name).contains(query_lower),
                func.lower(FoodCache.brand).contains(query_lower),
            ),
            FoodCache.expires_at > now,
        ).order_by(FoodCache.usage_count.desc()).limit(50)
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
            source="cached",
        )
        for f in cached_foods
    ]


@router.get("/search", response_model=list[FoodSearchResult])
async def search_foods(
    query: str = Query(..., min_length=2, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    force_refresh: bool = Query(False, description="Force refresh from API"),
    local_only: bool = Query(False, description="Search only local database"),
    db: AsyncSession = Depends(get_db),
):
    """Search for foods - local database first, then Open Food Facts."""
    # Always search local database first
    local_results = await search_local_db(db, query, limit=page_size)
    
    # If local_only is requested, return local results
    if local_only:
        return local_results
    
    # Check cache for additional results (only for page 1 and if not forcing refresh)
    if page == 1 and not force_refresh:
        cached = await get_cached_results(db, query)
        if cached:
            # Merge local results with cached, avoiding duplicates
            seen_barcodes = {r.barcode for r in local_results if r.barcode}
            for food in cached:
                if food.barcode and food.barcode not in seen_barcodes:
                    local_results.append(food)
                    seen_barcodes.add(food.barcode)
            
            # If we have enough results, sort and return them
            if len(local_results) >= page_size:
                source_priority = {"custom": 0, "cached": 1, "openfoodfacts": 2}
                local_results.sort(key=lambda r: source_priority.get(r.source, 3))
                return local_results[:page_size]
    
    # Fetch from Open Food Facts API if we need more results
    api_results = await off_service.search_products(query, page, page_size)
    
    # Mark API results with source
    for result in api_results:
        result.source = "openfoodfacts"
    
    # Cache results
    if api_results:
        await cache_food_results(db, api_results, query)
    
    # Merge results, local first
    seen_barcodes = {r.barcode for r in local_results if r.barcode}
    for food in api_results:
        if food.barcode and food.barcode not in seen_barcodes:
            local_results.append(food)
            seen_barcodes.add(food.barcode)
    
    # Sort: custom first, then saved/cached, then openfoodfacts
    source_priority = {"custom": 0, "cached": 1, "openfoodfacts": 2}
    local_results.sort(key=lambda r: source_priority.get(r.source, 3))
    
    return local_results[:page_size * page]


@router.get("/barcode/{barcode}", response_model=FoodSearchResult)
async def get_food_by_barcode(
    barcode: str,
    db: AsyncSession = Depends(get_db),
):
    """Get food information by barcode - check local cache first, then Open Food Facts."""
    # Check local cache first
    cache_result = await db.execute(
        select(FoodCache).where(FoodCache.barcode == barcode)
    )
    cached_food = cache_result.scalar_one_or_none()
    
    if cached_food:
        return FoodSearchResult(
            barcode=cached_food.barcode,
            name=cached_food.name,
            brand=cached_food.brand,
            image_url=cached_food.image_url,
            calories=cached_food.calories,
            protein=cached_food.protein,
            carbs=cached_food.carbs,
            fat=cached_food.fat,
            fiber=cached_food.fiber,
            sugar=cached_food.sugar,
            sodium=cached_food.sodium,
            nutriscore_grade=cached_food.nutriscore_grade,
            nova_group=cached_food.nova_group,
            source="cached",
        )
    
    # Fetch from Open Food Facts API
    result = await off_service.get_product_by_barcode(barcode)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Cache the result
    expires_at = datetime.utcnow() + timedelta(days=CACHE_DURATION_DAYS)
    new_cache = FoodCache(
        barcode=result.barcode,
        search_query=None,
        name=result.name,
        brand=result.brand,
        image_url=result.image_url,
        calories=result.calories,
        protein=result.protein,
        carbs=result.carbs,
        fat=result.fat,
        fiber=result.fiber,
        sugar=result.sugar,
        sodium=result.sodium,
        nutriscore_grade=result.nutriscore_grade,
        nova_group=result.nova_group,
        expires_at=expires_at,
        is_saved=False,
        usage_count=0,
    )
    db.add(new_cache)
    await db.commit()
    
    result.source = "openfoodfacts"
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


@router.get("/cached", response_model=list[FoodCacheResponse])
async def get_cached_foods(
    db: AsyncSession = Depends(get_db),
    saved_only: bool = Query(False, description="Only return saved foods"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """Get all cached foods from database."""
    query = select(FoodCache)
    
    if saved_only:
        query = query.where(FoodCache.is_saved == True)
    
    query = query.order_by(
        FoodCache.is_saved.desc(),
        FoodCache.usage_count.desc(),
        FoodCache.name
    ).offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/cached/{cache_id}/save", response_model=FoodCacheResponse)
async def toggle_save_cached_food(
    cache_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Toggle the saved status of a cached food."""
    result = await db.execute(
        select(FoodCache).where(FoodCache.id == cache_id)
    )
    cached_food = result.scalar_one_or_none()
    
    if not cached_food:
        raise HTTPException(status_code=404, detail="Cached food not found")
    
    cached_food.is_saved = not cached_food.is_saved
    await db.commit()
    await db.refresh(cached_food)
    return cached_food


@router.put("/cached/{cache_id}", response_model=FoodCacheResponse)
async def update_cached_food(
    cache_id: int,
    food_update: FoodCacheUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update cached food details."""
    result = await db.execute(
        select(FoodCache).where(FoodCache.id == cache_id)
    )
    cached_food = result.scalar_one_or_none()
    
    if not cached_food:
        raise HTTPException(status_code=404, detail="Cached food not found")
    
    if food_update.name is not None:
        cached_food.name = food_update.name
    if food_update.brand is not None:
        cached_food.brand = food_update.brand
    if food_update.calories is not None:
        cached_food.calories = food_update.calories
    if food_update.protein is not None:
        cached_food.protein = food_update.protein
    if food_update.carbs is not None:
        cached_food.carbs = food_update.carbs
    if food_update.fat is not None:
        cached_food.fat = food_update.fat
    if food_update.fiber is not None:
        cached_food.fiber = food_update.fiber
    if food_update.sugar is not None:
        cached_food.sugar = food_update.sugar
    if food_update.sodium is not None:
        cached_food.sodium = food_update.sodium
    
    await db.commit()
    await db.refresh(cached_food)
    return cached_food


@router.post("/save-by-barcode/{barcode}", response_model=FoodCacheResponse)
async def save_food_by_barcode(
    barcode: str,
    db: AsyncSession = Depends(get_db),
):
    """Mark a cached food as saved by its barcode. Used when a user adds food to diary."""
    result = await db.execute(
        select(FoodCache).where(FoodCache.barcode == barcode)
    )
    cached_food = result.scalar_one_or_none()
    
    if not cached_food:
        raise HTTPException(status_code=404, detail="Cached food not found")
    
    cached_food.is_saved = True
    cached_food.usage_count += 1
    await db.commit()
    await db.refresh(cached_food)
    return cached_food


@router.post("/cached/{cache_id}/increment-usage", response_model=FoodCacheResponse)
async def increment_usage_count(
    cache_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Increment the usage count of a cached food."""
    result = await db.execute(
        select(FoodCache).where(FoodCache.id == cache_id)
    )
    cached_food = result.scalar_one_or_none()
    
    if not cached_food:
        raise HTTPException(status_code=404, detail="Cached food not found")
    
    cached_food.usage_count += 1
    await db.commit()
    await db.refresh(cached_food)
    return cached_food


@router.delete("/cached/{cache_id}")
async def delete_cached_food(
    cache_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a cached food entry."""
    result = await db.execute(
        select(FoodCache).where(FoodCache.id == cache_id)
    )
    cached_food = result.scalar_one_or_none()
    
    if not cached_food:
        raise HTTPException(status_code=404, detail="Cached food not found")
    
    await db.delete(cached_food)
    await db.commit()
    return {"message": "Cached food deleted successfully"}


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
