import os
import requests
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db import models, schemas
import logging

logger = logging.getLogger(__name__)

class NutritionAPIService:
    """Service to fetch ingredient nutrition data from API Ninjas with database caching"""
    
    @staticmethod
    def search_ingredients(db: Session, query: str) -> List[schemas.Ingredient]:
        """
        Search for ingredients, first in database, then via API Ninjas if not found
        """
        # First, search in database
        db_ingredients = db.query(models.Ingredient).filter(
            models.Ingredient.name.ilike(f"%{query}%")
        ).limit(10).all()
        
        if db_ingredients:
            logger.info(f"Found {len(db_ingredients)} ingredients in database for query: {query}")
            return [schemas.Ingredient.from_orm(ingredient) for ingredient in db_ingredients]
        
        # If not found in database, search via API
        logger.info(f"No ingredients found in database for query: {query}, searching API...")
        api_ingredients = NutritionAPIService._fetch_from_api(query)
        
        if api_ingredients:
            # Save to database
            saved_ingredients = []
            for ingredient_data in api_ingredients:
                saved_ingredient = NutritionAPIService._save_ingredient_to_db(db, ingredient_data)
                if saved_ingredient:
                    saved_ingredients.append(schemas.Ingredient.from_orm(saved_ingredient))
            
            logger.info(f"Saved {len(saved_ingredients)} new ingredients to database")
            return saved_ingredients
        
        return []
    
    @staticmethod
    def _fetch_from_api(query: str) -> List[Dict[str, Any]]:
        """Fetch nutrition data from API Ninjas"""
        api_key = os.getenv("API_NINJA_KEY")
        if not api_key:
            logger.error("API_NINJA_KEY not found in environment variables")
            logger.error(f"Available env vars: {list(os.environ.keys())}")
            return []
        
        logger.info(f"Using API key: {api_key[:10]}..." if len(api_key) > 10 else "Short API key found")
        
        try:
            url = "https://api.api-ninjas.com/v1/nutrition"
            headers = {
                "X-Api-Key": api_key
            }
            params = {
                "query": query
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"API Ninjas returned {len(data)} results for query: {query}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching from API Ninjas: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in API Ninjas request: {str(e)}")
            return []
    
    @staticmethod
    def _save_ingredient_to_db(db: Session, api_data: Dict[str, Any]) -> Optional[models.Ingredient]:
        """Save ingredient data from API to database"""
        try:
            logger.info(f"Saving ingredient data: {api_data}")
            
            # Check if ingredient already exists
            existing = db.query(models.Ingredient).filter(
                models.Ingredient.name.ilike(api_data.get("name", "").strip())
            ).first()
            
            if existing:
                logger.info(f"Ingredient {existing.name} already exists, returning existing")
                return existing
            
            # Get serving size once
            serving_size = api_data.get("serving_size_g", 100)
            
            # Create new ingredient with safe type conversion
            ingredient = models.Ingredient(
                name=api_data.get("name", "").strip().title(),
                calories_per_100g=NutritionAPIService._convert_to_per_100g(
                    api_data.get("calories", 0), 
                    serving_size
                ),
                protein_per_100g=NutritionAPIService._convert_to_per_100g(
                    api_data.get("protein_g", 0), 
                    serving_size
                ),
                carbs_per_100g=NutritionAPIService._convert_to_per_100g(
                    api_data.get("carbohydrates_total_g", 0), 
                    serving_size
                ),
                fat_per_100g=NutritionAPIService._convert_to_per_100g(
                    api_data.get("fat_total_g", 0), 
                    serving_size
                ),
                fiber_per_100g=NutritionAPIService._convert_to_per_100g(
                    api_data.get("fiber_g", 0), 
                    serving_size
                ),
                sugar_per_100g=NutritionAPIService._convert_to_per_100g(
                    api_data.get("sugar_g", 0), 
                    serving_size
                ),
                sodium_per_100g=NutritionAPIService._convert_to_per_100g(
                    float(api_data.get("sodium_mg", 0)) / 1000,  # Convert mg to g
                    serving_size
                ),
                category="API Import"  # Mark as imported from API
            )
            
            db.add(ingredient)
            db.commit()
            db.refresh(ingredient)
            
            logger.info(f"Saved ingredient to database: {ingredient.name}")
            return ingredient
            
        except Exception as e:
            logger.error(f"Error saving ingredient to database: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    def _convert_to_per_100g(value: float, serving_size_g: float) -> float:
        """Convert nutrition value to per 100g basis"""
        try:
            # Ensure values are numeric
            value = float(value) if value is not None else 0.0
            serving_size_g = float(serving_size_g) if serving_size_g is not None else 100.0
            
            if serving_size_g <= 0:
                return 0.0
            return round((value * 100) / serving_size_g, 2)
        except (ValueError, TypeError):
            logger.error(f"Error converting nutrition values: value={value}, serving_size_g={serving_size_g}")
            return 0.0 