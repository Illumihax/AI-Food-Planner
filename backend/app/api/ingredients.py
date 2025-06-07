from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db import models, schemas
from app.services.fatsecret_service import FatSecretService

router = APIRouter()

@router.get("/", response_model=List[schemas.Ingredient])
def get_ingredients(skip: int = 0, limit: int = 100, search: str = None, db: Session = Depends(get_db)):
    """Get all ingredients with optional search"""
    query = db.query(models.Ingredient)
    
    if search:
        query = query.filter(models.Ingredient.name.ilike(f"%{search}%"))
    
    ingredients = query.offset(skip).limit(limit).all()
    return ingredients

@router.get("/{ingredient_id}", response_model=schemas.Ingredient)
def get_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """Get a specific ingredient by ID"""
    ingredient = db.query(models.Ingredient).filter(models.Ingredient.id == ingredient_id).first()
    if ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient

@router.post("/", response_model=schemas.Ingredient, status_code=status.HTTP_201_CREATED)
def create_ingredient(ingredient: schemas.IngredientCreate, db: Session = Depends(get_db)):
    """Create a new ingredient"""
    db_ingredient = models.Ingredient(**ingredient.dict())
    db.add(db_ingredient)
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient

@router.put("/{ingredient_id}", response_model=schemas.Ingredient)
def update_ingredient(ingredient_id: int, ingredient_update: schemas.IngredientUpdate, db: Session = Depends(get_db)):
    """Update an existing ingredient"""
    ingredient = db.query(models.Ingredient).filter(models.Ingredient.id == ingredient_id).first()
    if ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    update_data = ingredient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ingredient, field, value)
    
    db.commit()
    db.refresh(ingredient)
    return ingredient

@router.delete("/{ingredient_id}")
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """Delete an ingredient"""
    ingredient = db.query(models.Ingredient).filter(models.Ingredient.id == ingredient_id).first()
    if ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    db.delete(ingredient)
    db.commit()
    return {"message": "Ingredient deleted successfully"}

@router.get("/categories/", response_model=List[str])
def get_ingredient_categories(db: Session = Depends(get_db)):
    """Get all unique ingredient categories"""
    categories = db.query(models.Ingredient.category).distinct().filter(models.Ingredient.category.isnot(None)).all()
    return [category[0] for category in categories if category[0]]

@router.get("/search/{query}", response_model=List[schemas.Ingredient])
def search_ingredients_db_only(query: str, db: Session = Depends(get_db)):
    """Search ingredients in database only"""
    db_ingredients = db.query(models.Ingredient).filter(
        models.Ingredient.name.ilike(f"%{query}%")
    ).limit(10).all()
    return db_ingredients

# NEW: Get FatSecret options without saving
@router.get("/api-options/{query}")
def get_fatsecret_options(query: str):
    """Get ingredient options from FatSecret API without saving them to database"""
    api_ingredients = FatSecretService._fetch_from_api(query)
    
    if not api_ingredients:
        raise HTTPException(status_code=404, detail="No ingredients found in FatSecret API")
    
    return {"options": api_ingredients, "query": query}

# NEW: Save a single selected ingredient
@router.post("/save-selected", response_model=schemas.Ingredient, status_code=status.HTTP_201_CREATED)
def save_selected_ingredient(ingredient_data: dict, db: Session = Depends(get_db)):
    """Save a single selected ingredient to the database"""
    try:
        # Convert the ingredient data to our model format
        db_ingredient = models.Ingredient(
            name=ingredient_data.get("name", ""),
            calories_per_serving=float(ingredient_data.get("calories", 0)),
            protein_per_serving=float(ingredient_data.get("protein_g", 0)),
            carbs_per_serving=float(ingredient_data.get("carbohydrates_total_g", 0)),
            fat_per_serving=float(ingredient_data.get("fat_total_g", 0)),
            fiber_per_serving=float(ingredient_data.get("fiber_g", 0)),
            sugar_per_serving=float(ingredient_data.get("sugar_g", 0)),
            sodium_per_serving=float(ingredient_data.get("sodium_mg", 0)),
            serving_size=float(ingredient_data.get("serving_size_g", 100)),
            serving_unit=ingredient_data.get("serving_unit", "g"),
            serving_description=ingredient_data.get("serving_description", ""),
            calories_per_100g=float(ingredient_data.get("calories_per_100g", 0)),
            protein_per_100g=float(ingredient_data.get("protein_per_100g", 0)),
            carbs_per_100g=float(ingredient_data.get("carbs_per_100g", 0)),
            fat_per_100g=float(ingredient_data.get("fat_per_100g", 0)),
            fiber_per_100g=float(ingredient_data.get("fiber_per_100g", 0)),
            sugar_per_100g=float(ingredient_data.get("sugar_per_100g", 0)),
            sodium_per_100g=float(ingredient_data.get("sodium_per_100g", 0)),
            category=ingredient_data.get("category", "")
        )
        
        db.add(db_ingredient)
        db.commit()
        db.refresh(db_ingredient)
        return db_ingredient
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error saving ingredient: {str(e)}")

@router.post("/fetch-from-api/{query}", response_model=List[schemas.Ingredient])
def fetch_ingredients_from_api(query: str, db: Session = Depends(get_db)):
    """Fetch ingredients from FatSecret API and save to database (legacy endpoint)"""
    api_ingredients = FatSecretService._fetch_from_api(query)
    
    if not api_ingredients:
        raise HTTPException(status_code=404, detail="No ingredients found in FatSecret API")
    
    # Save to database
    saved_ingredients = []
    for ingredient_data in api_ingredients:
        saved_ingredient = FatSecretService._save_ingredient_to_db(db, ingredient_data)
        if saved_ingredient:
            saved_ingredients.append(saved_ingredient)
    
    return saved_ingredients

@router.get("/test-fatsecret/{query}")
def test_fatsecret_api(query: str):
    """Test FatSecret API connection (for debugging)"""
    try:
        # Test token
        token = FatSecretService._get_access_token()
        if not token:
            return {"error": "Failed to get access token", "token": None}
        
        # Test API call
        api_data = FatSecretService._fetch_from_api(query)
        
        return {
            "token_obtained": bool(token),
            "token_preview": token[:20] + "..." if token else None,
            "api_data_count": len(api_data) if api_data else 0,
            "api_data": api_data
        }
    except Exception as e:
        return {"error": str(e)} 