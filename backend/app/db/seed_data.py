from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.db import models
from datetime import datetime

def create_sample_data():
    """Create sample data for testing"""
    db = SessionLocal()
    
    try:
        # Create sample user
        user = models.User(
            email="test@example.com",
            username="testuser",
            hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create sample ingredients
        ingredients = [
            models.Ingredient(
                name="Chicken Breast",
                calories_per_100g=165,
                protein_per_100g=31,
                carbs_per_100g=0,
                fat_per_100g=3.6,
                fiber_per_100g=0,
                category="protein"
            ),
            models.Ingredient(
                name="Brown Rice",
                calories_per_100g=111,
                protein_per_100g=2.6,
                carbs_per_100g=22,
                fat_per_100g=0.9,
                fiber_per_100g=1.8,
                category="grains"
            ),
            models.Ingredient(
                name="Broccoli",
                calories_per_100g=34,
                protein_per_100g=2.8,
                carbs_per_100g=7,
                fat_per_100g=0.4,
                fiber_per_100g=2.6,
                category="vegetables"
            ),
            models.Ingredient(
                name="Olive Oil",
                calories_per_100g=884,
                protein_per_100g=0,
                carbs_per_100g=0,
                fat_per_100g=100,
                fiber_per_100g=0,
                category="fats"
            ),
            models.Ingredient(
                name="Salmon Fillet",
                calories_per_100g=208,
                protein_per_100g=25,
                carbs_per_100g=0,
                fat_per_100g=12,
                fiber_per_100g=0,
                category="protein"
            ),
            models.Ingredient(
                name="Sweet Potato",
                calories_per_100g=86,
                protein_per_100g=1.6,
                carbs_per_100g=20,
                fat_per_100g=0.1,
                fiber_per_100g=3,
                category="vegetables"
            ),
            models.Ingredient(
                name="Spinach",
                calories_per_100g=23,
                protein_per_100g=2.9,
                carbs_per_100g=3.6,
                fat_per_100g=0.4,
                fiber_per_100g=2.2,
                category="vegetables"
            ),
            models.Ingredient(
                name="Greek Yogurt",
                calories_per_100g=59,
                protein_per_100g=10,
                carbs_per_100g=3.6,
                fat_per_100g=0.4,
                fiber_per_100g=0,
                category="dairy"
            ),
            models.Ingredient(
                name="Banana",
                calories_per_100g=89,
                protein_per_100g=1.1,
                carbs_per_100g=23,
                fat_per_100g=0.3,
                fiber_per_100g=2.6,
                category="fruits"
            ),
            models.Ingredient(
                name="Oats",
                calories_per_100g=389,
                protein_per_100g=16.9,
                carbs_per_100g=66,
                fat_per_100g=6.9,
                fiber_per_100g=10.6,
                category="grains"
            )
        ]
        
        for ingredient in ingredients:
            db.add(ingredient)
        db.commit()
        
        # Create sample recipes
        recipes = [
            {
                "title": "Grilled Chicken with Rice and Broccoli",
                "description": "A healthy, balanced meal with lean protein, complex carbs, and vegetables",
                "instructions": "1. Season chicken breast with salt and pepper\n2. Grill chicken for 6-8 minutes per side\n3. Cook rice according to package instructions\n4. Steam broccoli for 5-7 minutes\n5. Drizzle with olive oil and serve",
                "prep_time": 15,
                "cook_time": 25,
                "servings": 2,
                "difficulty": "easy",
                "cuisine_type": "American",
                "ingredients": [
                    {"ingredient_name": "Chicken Breast", "quantity": 300, "unit": "g"},
                    {"ingredient_name": "Brown Rice", "quantity": 150, "unit": "g"},
                    {"ingredient_name": "Broccoli", "quantity": 200, "unit": "g"},
                    {"ingredient_name": "Olive Oil", "quantity": 15, "unit": "g"}
                ]
            },
            {
                "title": "Baked Salmon with Sweet Potato",
                "description": "Omega-3 rich salmon with nutritious sweet potato",
                "instructions": "1. Preheat oven to 400°F\n2. Season salmon with herbs and lemon\n3. Bake salmon for 12-15 minutes\n4. Roast sweet potato for 25-30 minutes\n5. Serve with sautéed spinach",
                "prep_time": 10,
                "cook_time": 30,
                "servings": 2,
                "difficulty": "easy",
                "cuisine_type": "Mediterranean",
                "ingredients": [
                    {"ingredient_name": "Salmon Fillet", "quantity": 300, "unit": "g"},
                    {"ingredient_name": "Sweet Potato", "quantity": 250, "unit": "g"},
                    {"ingredient_name": "Spinach", "quantity": 100, "unit": "g"},
                    {"ingredient_name": "Olive Oil", "quantity": 10, "unit": "g"}
                ]
            },
            {
                "title": "Protein Oatmeal Bowl",
                "description": "High-protein breakfast with oats, yogurt, and banana",
                "instructions": "1. Cook oats with water or milk\n2. Top with Greek yogurt\n3. Add sliced banana\n4. Drizzle with honey if desired\n5. Serve immediately",
                "prep_time": 5,
                "cook_time": 10,
                "servings": 1,
                "difficulty": "easy",
                "cuisine_type": "American",
                "ingredients": [
                    {"ingredient_name": "Oats", "quantity": 50, "unit": "g"},
                    {"ingredient_name": "Greek Yogurt", "quantity": 150, "unit": "g"},
                    {"ingredient_name": "Banana", "quantity": 100, "unit": "g"}
                ]
            }
        ]
        
        for recipe_data in recipes:
            # Create recipe
            recipe = models.Recipe(
                title=recipe_data["title"],
                description=recipe_data["description"],
                instructions=recipe_data["instructions"],
                prep_time=recipe_data["prep_time"],
                cook_time=recipe_data["cook_time"],
                servings=recipe_data["servings"],
                difficulty=recipe_data["difficulty"],
                cuisine_type=recipe_data["cuisine_type"],
                owner_id=user.id
            )
            db.add(recipe)
            db.commit()
            db.refresh(recipe)
            
            # Add ingredients to recipe
            for ingredient_data in recipe_data["ingredients"]:
                ingredient = db.query(models.Ingredient).filter(
                    models.Ingredient.name == ingredient_data["ingredient_name"]
                ).first()
                
                if ingredient:
                    db.execute(
                        models.recipe_ingredients.insert().values(
                            recipe_id=recipe.id,
                            ingredient_id=ingredient.id,
                            quantity=ingredient_data["quantity"],
                            unit=ingredient_data["unit"]
                        )
                    )
            db.commit()
        
        print("Sample data created successfully!")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data() 