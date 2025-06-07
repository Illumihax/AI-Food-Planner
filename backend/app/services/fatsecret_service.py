import os
import requests
import re
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db import models, schemas
import logging
from requests_oauthlib import OAuth2Session
import base64
import json

logger = logging.getLogger(__name__)

class FatSecretService:
    """Service to fetch ingredient nutrition data from FatSecret API with OAuth 2.0"""
    
    BASE_URL = "https://platform.fatsecret.com"
    TOKEN_URL = "https://oauth.fatsecret.com/connect/token"
    SEARCH_URL = "https://platform.fatsecret.com/rest/foods/search/v1"
    
    @staticmethod
    def search_ingredients(db: Session, query: str) -> List[schemas.Ingredient]:
        """
        Search for ingredients, first in database, then via FatSecret if not found
        """
        # First, search in database
        db_ingredients = db.query(models.Ingredient).filter(
            models.Ingredient.name.ilike(f"%{query}%")
        ).limit(10).all()
        
        if db_ingredients:
            logger.info(f"Found {len(db_ingredients)} ingredients in database for query: {query}")
            return [schemas.Ingredient.from_orm(ingredient) for ingredient in db_ingredients]
        
        # If not found in database, search via FatSecret API
        logger.info(f"No ingredients found in database for query: {query}, searching FatSecret API...")
        api_ingredients = FatSecretService._fetch_from_api(query)
        
        if api_ingredients:
            # Save to database
            saved_ingredients = []
            for ingredient_data in api_ingredients:
                saved_ingredient = FatSecretService._save_ingredient_to_db(db, ingredient_data)
                if saved_ingredient:
                    saved_ingredients.append(schemas.Ingredient.from_orm(saved_ingredient))
            
            logger.info(f"Saved {len(saved_ingredients)} new ingredients to database")
            return saved_ingredients
        
        return []
    
    @staticmethod
    def _get_access_token() -> Optional[str]:
        """Get OAuth 2.0 access token for FatSecret API"""
        client_id = os.getenv("FATSECRET_CLIENT_ID")
        client_secret = os.getenv("FATSECRET_CLIENT_SECRET")
        
        logger.info(f"FatSecret credentials check - Client ID: {'✓' if client_id else '✗'}, Client Secret: {'✓' if client_secret else '✗'}")
        
        if not client_id or not client_secret:
            logger.error("FATSECRET_CLIENT_ID or FATSECRET_CLIENT_SECRET not found in environment variables")
            logger.error(f"Available env vars: {list(os.environ.keys())}")
            return None
        
        try:
            # Create client credentials
            credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
            
            headers = {
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            data = {
                "grant_type": "client_credentials",
                "scope": "basic"
            }
            
            logger.info(f"Requesting token from: {FatSecretService.TOKEN_URL}")
            logger.info(f"Request headers: {headers}")
            logger.info(f"Request data: {data}")
            
            response = requests.post(FatSecretService.TOKEN_URL, headers=headers, data=data, timeout=10)
            logger.info(f"Token response status: {response.status_code}")
            logger.info(f"Token response: {response.text}")
            
            response.raise_for_status()
            
            token_data = response.json()
            access_token = token_data.get("access_token")
            
            if access_token:
                logger.info("Successfully obtained FatSecret access token")
                return access_token
            else:
                logger.error("No access token in FatSecret response")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting FatSecret access token: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting FatSecret access token: {str(e)}")
            return None
    
    @staticmethod
    def _fetch_from_api(query: str) -> List[Dict[str, Any]]:
        """Fetch nutrition data from FatSecret API"""
        access_token = FatSecretService._get_access_token()
        if not access_token:
            print("No access token: ", access_token)
            return []
        
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            print("headers: ", headers)
            
            params = {
                "search_expression": query,
                "format": "json",
                "max_results": 10
            }
            print("params: ", params)
            print("FatSecretService.SEARCH_URL: ", FatSecretService.SEARCH_URL)
            logger.info(f"Searching FatSecret with URL: {FatSecretService.SEARCH_URL}")
            logger.info(f"Search headers: {headers}")
            logger.info(f"Search params: {params}")
            
            response = requests.get(FatSecretService.SEARCH_URL, headers=headers, params=params, timeout=10)
            print("response.status_code: ", response.status_code)
            print("response.text: ", response.text)
            logger.info(f"Search response status: {response.status_code}")
            logger.info(f"Search response: {response.text}")
            
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"FatSecret API returned data: {data}")
            
            # Parse FatSecret response format
            foods_data = data.get("foods", {})
            if not foods_data:
                logger.info("No foods data in FatSecret response")
                return []
            
            food_items = foods_data.get("food", [])
            if not isinstance(food_items, list):
                food_items = [food_items] if food_items else []
            
            logger.info(f"FatSecret returned {len(food_items)} food items for query: {query}")
            
            # Convert FatSecret format to our internal format
            converted_items = []
            for food_item in food_items:
                converted_item = FatSecretService._convert_fatsecret_to_internal(food_item)
                if converted_item:
                    converted_items.append(converted_item)
            
            return converted_items
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching from FatSecret API: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in FatSecret API request: {str(e)}")
            return []
    
    @staticmethod
    def _convert_fatsecret_to_internal(food_item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Convert FatSecret food item to our internal format"""
        try:
            # Extract basic info
            name = food_item.get("food_name", "").strip()
            brand_name = food_item.get("brand_name", "").strip()
            food_type = food_item.get("food_type", "Generic")
            description = food_item.get("food_description", "")
            
            # Create full name
            full_name = f"{brand_name} {name}".strip() if brand_name else name
            
            # Parse nutrition from description
            # Format: "Per 100g - Calories: 22kcal | Fat: 0.34g | Carbs: 3.28g | Protein: 3.09g"
            nutrition = FatSecretService._parse_nutrition_description(description)
            
            if not nutrition:
                logger.warning(f"Could not parse nutrition for: {full_name}")
                return None
            
            return {
                "name": full_name,
                "calories": nutrition.get("calories", 0),
                "protein_g": nutrition.get("protein", 0),
                "carbohydrates_total_g": nutrition.get("carbs", 0),
                "fat_total_g": nutrition.get("fat", 0),
                "fiber_g": nutrition.get("fiber", 0),
                "sugar_g": nutrition.get("sugar", 0),
                "sodium_mg": nutrition.get("sodium", 0),
                "serving_size": nutrition.get("serving_size", 100),
                "serving_unit": nutrition.get("serving_unit", "g"),
                "serving_description": nutrition.get("serving_description", "Per 100g"),
                "food_type": food_type,
                "brand_name": brand_name
            }
            
        except Exception as e:
            logger.error(f"Error converting FatSecret item: {str(e)}")
            return None
    
    @staticmethod
    def _parse_nutrition_description(description: str) -> Optional[Dict[str, Any]]:
        """Parse nutrition values from FatSecret description string"""
        try:
            # Examples: 
            # "Per 100g - Calories: 147kcal | Fat: 9.94g | Carbs: 0.77g | Protein: 12.58g"
            # "Per 1 egg - Calories: 70kcal | Fat: 5.00g | Carbs: 0.00g | Protein: 6.00g"
            # "Per 53g - Calories: 102kcal | Fat: 7.75g | Carbs: 0.49g | Protein: 7.15g"
            
            # Extract serving information
            serving_match = re.search(r"Per (.+?) -", description)
            serving_description = serving_match.group(0) if serving_match else "Per 100g"
            
            # Parse serving size and unit
            serving_size = 100.0
            serving_unit = "g"
            
            if serving_match:
                serving_text = serving_match.group(1).strip()
                # Try to parse different formats
                if "egg" in serving_text.lower():
                    serving_size = 1.0
                    serving_unit = "egg"
                elif re.search(r"(\d+(?:\.\d+)?)g", serving_text):
                    size_match = re.search(r"(\d+(?:\.\d+)?)g", serving_text)
                    serving_size = float(size_match.group(1))
                    serving_unit = "g"
                elif re.search(r"(\d+(?:\.\d+)?)ml", serving_text):
                    size_match = re.search(r"(\d+(?:\.\d+)?)ml", serving_text)
                    serving_size = float(size_match.group(1))
                    serving_unit = "ml"
                elif re.search(r"(\d+(?:\.\d+)?)", serving_text):
                    # Generic number (like "1 cup", "2 pieces")
                    size_match = re.search(r"(\d+(?:\.\d+)?)", serving_text)
                    serving_size = float(size_match.group(1))
                    serving_unit = "piece"
            
            # Extract nutrition values
            calories_match = re.search(r"Calories:\s*(\d+(?:\.\d+)?)k?cal", description, re.IGNORECASE)
            fat_match = re.search(r"Fat:\s*(\d+(?:\.\d+)?)g", description, re.IGNORECASE)
            carbs_match = re.search(r"Carbs?:\s*(\d+(?:\.\d+)?)g", description, re.IGNORECASE)
            protein_match = re.search(r"Protein:\s*(\d+(?:\.\d+)?)g", description, re.IGNORECASE)
            
            nutrition = {
                "serving_size": serving_size,
                "serving_unit": serving_unit,
                "serving_description": serving_description,
                "calories": float(calories_match.group(1)) if calories_match else 0.0,
                "fat": float(fat_match.group(1)) if fat_match else 0.0,
                "carbs": float(carbs_match.group(1)) if carbs_match else 0.0,
                "protein": float(protein_match.group(1)) if protein_match else 0.0,
                "fiber": 0.0,  # Not usually in basic description
                "sugar": 0.0,  # Not usually in basic description
                "sodium": 0.0  # Not usually in basic description
            }
            
            logger.info(f"Parsed nutrition: {nutrition} from description: {description}")
            return nutrition
            
        except Exception as e:
            logger.error(f"Error parsing nutrition description '{description}': {str(e)}")
            return None
    
    @staticmethod
    def _save_ingredient_to_db(db: Session, api_data: Dict[str, Any]) -> Optional[models.Ingredient]:
        """Save ingredient data from FatSecret API to database"""
        try:
            logger.info(f"Saving FatSecret ingredient data: {api_data}")
            
            # Check if ingredient already exists
            existing = db.query(models.Ingredient).filter(
                models.Ingredient.name.ilike(api_data.get("name", "").strip())
            ).first()
            
            if existing:
                logger.info(f"Ingredient {existing.name} already exists, returning existing")
                return existing
            
            # Get serving information
            serving_size = api_data.get("serving_size", 100)
            serving_unit = api_data.get("serving_unit", "g")
            serving_description = api_data.get("serving_description", "Per 100g")
            
            # Original serving nutrition (as returned by API)
            calories_per_serving = float(api_data.get("calories", 0))
            protein_per_serving = float(api_data.get("protein_g", 0))
            carbs_per_serving = float(api_data.get("carbohydrates_total_g", 0))
            fat_per_serving = float(api_data.get("fat_total_g", 0))
            fiber_per_serving = float(api_data.get("fiber_g", 0))
            sugar_per_serving = float(api_data.get("sugar_g", 0))
            sodium_per_serving = float(api_data.get("sodium_mg", 0)) / 1000  # Convert mg to g
            
            # Create new ingredient preserving original serving information
            ingredient = models.Ingredient(
                name=api_data.get("name", "").strip().title(),
                
                # Original serving nutrition
                calories_per_serving=calories_per_serving,
                protein_per_serving=protein_per_serving,
                carbs_per_serving=carbs_per_serving,
                fat_per_serving=fat_per_serving,
                fiber_per_serving=fiber_per_serving,
                sugar_per_serving=sugar_per_serving,
                sodium_per_serving=sodium_per_serving,
                
                # Serving information
                serving_size=serving_size,
                serving_unit=serving_unit,
                serving_description=serving_description,
                
                # Legacy per-100g values (for backward compatibility)
                calories_per_100g=FatSecretService._convert_to_per_100g(calories_per_serving, serving_size),
                protein_per_100g=FatSecretService._convert_to_per_100g(protein_per_serving, serving_size),
                carbs_per_100g=FatSecretService._convert_to_per_100g(carbs_per_serving, serving_size),
                fat_per_100g=FatSecretService._convert_to_per_100g(fat_per_serving, serving_size),
                fiber_per_100g=FatSecretService._convert_to_per_100g(fiber_per_serving, serving_size),
                sugar_per_100g=FatSecretService._convert_to_per_100g(sugar_per_serving, serving_size),
                sodium_per_100g=FatSecretService._convert_to_per_100g(sodium_per_serving, serving_size),
                
                category=f"FatSecret {api_data.get('food_type', 'Import')}"  # Mark as imported from FatSecret
            )
            
            db.add(ingredient)
            db.commit()
            db.refresh(ingredient)
            
            logger.info(f"Saved FatSecret ingredient to database: {ingredient.name}")
            return ingredient
            
        except Exception as e:
            logger.error(f"Error saving FatSecret ingredient to database: {str(e)}")
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