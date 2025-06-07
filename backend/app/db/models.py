from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

# Association table for recipe ingredients (many-to-many)
recipe_ingredients = Table(
    'recipe_ingredients',
    Base.metadata,
    Column('recipe_id', Integer, ForeignKey('recipes.id'), primary_key=True),
    Column('ingredient_id', Integer, ForeignKey('ingredients.id'), primary_key=True),
    Column('quantity', Float, nullable=False),
    Column('unit', String(50), nullable=False)
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    recipes = relationship("Recipe", back_populates="owner")
    meal_plans = relationship("MealPlan", back_populates="user")

class Ingredient(Base):
    __tablename__ = "ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    
    # Original serving nutrition (as returned by API)
    calories_per_serving = Column(Float, nullable=False, default=0)
    protein_per_serving = Column(Float, nullable=False, default=0)
    carbs_per_serving = Column(Float, nullable=False, default=0)
    fat_per_serving = Column(Float, nullable=False, default=0)
    fiber_per_serving = Column(Float, nullable=True, default=0)
    sugar_per_serving = Column(Float, nullable=True, default=0)
    sodium_per_serving = Column(Float, nullable=True, default=0)
    
    # Serving information
    serving_size = Column(Float, nullable=False, default=100)  # e.g., 1, 53, 100
    serving_unit = Column(String(50), nullable=False, default="g")  # e.g., "egg", "g", "ml"
    serving_description = Column(String(200), nullable=True)  # e.g., "Per 1 egg", "Per 100g"
    
    # Legacy per-100g values (calculated for backward compatibility)
    calories_per_100g = Column(Float, nullable=False, default=0)
    protein_per_100g = Column(Float, nullable=False, default=0)
    carbs_per_100g = Column(Float, nullable=False, default=0)
    fat_per_100g = Column(Float, nullable=False, default=0)
    fiber_per_100g = Column(Float, nullable=True, default=0)
    sugar_per_100g = Column(Float, nullable=True, default=0)
    sodium_per_100g = Column(Float, nullable=True, default=0)
    
    category = Column(String(100), nullable=True)  # e.g., "vegetables", "protein", "grains"
    
    # Relationships
    recipes = relationship("Recipe", secondary=recipe_ingredients, back_populates="ingredients")

class Recipe(Base):
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=False)
    prep_time = Column(Integer, nullable=True)  # minutes
    cook_time = Column(Integer, nullable=True)  # minutes
    servings = Column(Integer, nullable=False, default=1)
    difficulty = Column(String(20), nullable=True)  # "easy", "medium", "hard"
    cuisine_type = Column(String(100), nullable=True)
    dietary_tags = Column(String(500), nullable=True)  # JSON string: ["vegan", "gluten-free"]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_ai_generated = Column(Boolean, default=False)
    
    # Foreign Keys
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="recipes")
    ingredients = relationship("Ingredient", secondary=recipe_ingredients, back_populates="recipes")
    meal_plan_entries = relationship("MealPlanEntry", back_populates="recipe")

class MealPlan(Base):
    __tablename__ = "meal_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)  # e.g., "Week of Jan 15, 2024"
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="meal_plans")
    entries = relationship("MealPlanEntry", back_populates="meal_plan", cascade="all, delete-orphan")

class MealPlanEntry(Base):
    __tablename__ = "meal_plan_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False)
    meal_type = Column(String(50), nullable=False)  # "breakfast", "lunch", "dinner", "snack"
    servings = Column(Float, nullable=False, default=1.0)  # Allow partial servings
    notes = Column(Text, nullable=True)
    
    # Foreign Keys
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    
    # Relationships
    meal_plan = relationship("MealPlan", back_populates="entries")
    recipe = relationship("Recipe", back_populates="meal_plan_entries")

class NutritionGoal(Base):
    __tablename__ = "nutrition_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    daily_calories = Column(Float, nullable=True)
    daily_protein = Column(Float, nullable=True)  # grams
    daily_carbs = Column(Float, nullable=True)    # grams
    daily_fat = Column(Float, nullable=True)      # grams
    daily_fiber = Column(Float, nullable=True)    # grams
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    user = relationship("User") 