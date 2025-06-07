from sqlalchemy.orm import Session
from app.db import models, schemas
from typing import Optional

class RecipeService:
    @staticmethod
    def create_recipe(db: Session, recipe: schemas.RecipeCreate, user_id: int) -> models.Recipe:
        """Create a new recipe with ingredients"""
        # Create the recipe
        db_recipe = models.Recipe(
            title=recipe.title,
            description=recipe.description,
            instructions=recipe.instructions,
            prep_time=recipe.prep_time,
            cook_time=recipe.cook_time,
            servings=recipe.servings,
            difficulty=recipe.difficulty,
            cuisine_type=recipe.cuisine_type,
            dietary_tags=recipe.dietary_tags,
            owner_id=user_id
        )
        db.add(db_recipe)
        db.commit()
        db.refresh(db_recipe)
        
        # Add recipe ingredients
        for recipe_ingredient in recipe.ingredients:
            # Check if ingredient exists
            ingredient = db.query(models.Ingredient).filter(
                models.Ingredient.id == recipe_ingredient.ingredient_id
            ).first()
            
            if ingredient:
                # Add the ingredient to the recipe via the association table
                db.execute(
                    models.recipe_ingredients.insert().values(
                        recipe_id=db_recipe.id,
                        ingredient_id=recipe_ingredient.ingredient_id,
                        quantity=recipe_ingredient.quantity,
                        unit=recipe_ingredient.unit
                    )
                )
        
        db.commit()
        db.refresh(db_recipe)
        return db_recipe
    
    @staticmethod
    def update_recipe(db: Session, recipe_id: int, recipe_update: schemas.RecipeUpdate) -> Optional[models.Recipe]:
        """Update an existing recipe"""
        recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
        if not recipe:
            return None
        
        update_data = recipe_update.dict(exclude_unset=True, exclude={'ingredients'})
        for field, value in update_data.items():
            setattr(recipe, field, value)
        
        # Update ingredients if provided
        if recipe_update.ingredients is not None:
            # Remove existing ingredients
            db.execute(
                models.recipe_ingredients.delete().where(
                    models.recipe_ingredients.c.recipe_id == recipe_id
                )
            )
            
            # Add updated ingredients
            for recipe_ingredient in recipe_update.ingredients:
                ingredient = db.query(models.Ingredient).filter(
                    models.Ingredient.id == recipe_ingredient.ingredient_id
                ).first()
                
                if ingredient:
                    db.execute(
                        models.recipe_ingredients.insert().values(
                            recipe_id=recipe_id,
                            ingredient_id=recipe_ingredient.ingredient_id,
                            quantity=recipe_ingredient.quantity,
                            unit=recipe_ingredient.unit
                        )
                    )
        
        db.commit()
        db.refresh(recipe)
        return recipe
    
    @staticmethod
    def delete_recipe(db: Session, recipe_id: int) -> bool:
        """Delete a recipe"""
        recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
        if not recipe:
            return False
        
        db.delete(recipe)
        db.commit()
        return True
    
    @staticmethod
    def calculate_nutrition(db: Session, recipe_id: int, servings: float = 1.0) -> Optional[schemas.RecipeNutrition]:
        """Calculate nutrition for a recipe based on ingredients"""
        recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
        if not recipe:
            return None
        
        # Get recipe ingredients with their quantities
        recipe_ingredients = db.execute(
            f"""
            SELECT i.*, ri.quantity, ri.unit
            FROM ingredients i
            JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
            WHERE ri.recipe_id = {recipe_id}
            """
        ).fetchall()
        
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        total_fiber = 0
        
        for ingredient_data in recipe_ingredients:
            # Convert quantity to grams (simplified - assumes all units are in grams)
            quantity_grams = ingredient_data.quantity
            
            # Calculate nutrition based on per-100g values
            multiplier = quantity_grams / 100.0
            
            total_calories += ingredient_data.calories_per_100g * multiplier
            total_protein += ingredient_data.protein_per_100g * multiplier
            total_carbs += ingredient_data.carbs_per_100g * multiplier
            total_fat += ingredient_data.fat_per_100g * multiplier
            total_fiber += (ingredient_data.fiber_per_100g or 0) * multiplier
        
        # Adjust for serving size
        serving_multiplier = servings / recipe.servings
        
        return schemas.RecipeNutrition(
            calories=round(total_calories * serving_multiplier, 2),
            protein=round(total_protein * serving_multiplier, 2),
            carbs=round(total_carbs * serving_multiplier, 2),
            fat=round(total_fat * serving_multiplier, 2),
            fiber=round(total_fiber * serving_multiplier, 2)
        ) 