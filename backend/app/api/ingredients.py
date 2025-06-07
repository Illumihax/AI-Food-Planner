from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db import models, schemas

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