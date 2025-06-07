from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Base schemas
class IngredientBase(BaseModel):
    name: str
    
    # Original serving nutrition
    calories_per_serving: float = 0
    protein_per_serving: float = 0
    carbs_per_serving: float = 0
    fat_per_serving: float = 0
    fiber_per_serving: Optional[float] = 0
    sugar_per_serving: Optional[float] = 0
    sodium_per_serving: Optional[float] = 0
    
    # Serving information
    serving_size: float = 100
    serving_unit: str = "g"
    serving_description: Optional[str] = None
    
    # Legacy per-100g values (for backward compatibility)
    calories_per_100g: float = 0
    protein_per_100g: float = 0
    carbs_per_100g: float = 0
    fat_per_100g: float = 0
    fiber_per_100g: Optional[float] = 0
    sugar_per_100g: Optional[float] = 0
    sodium_per_100g: Optional[float] = 0
    
    category: Optional[str] = None

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    calories_per_100g: Optional[float] = None
    protein_per_100g: Optional[float] = None
    carbs_per_100g: Optional[float] = None
    fat_per_100g: Optional[float] = None
    fiber_per_100g: Optional[float] = None
    sugar_per_100g: Optional[float] = None
    sodium_per_100g: Optional[float] = None
    category: Optional[str] = None

class Ingredient(IngredientBase):
    id: int
    
    class Config:
        from_attributes = True

# Recipe schemas
class RecipeIngredient(BaseModel):
    ingredient_id: int
    quantity: float
    unit: str
    ingredient: Optional[Ingredient] = None

class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    instructions: str
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: int = 1
    difficulty: Optional[str] = None
    cuisine_type: Optional[str] = None
    dietary_tags: Optional[str] = None

class RecipeCreate(RecipeBase):
    ingredients: List[RecipeIngredient]

class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: Optional[int] = None
    difficulty: Optional[str] = None
    cuisine_type: Optional[str] = None
    dietary_tags: Optional[str] = None
    ingredients: Optional[List[RecipeIngredient]] = None

class RecipeNutrition(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float

class Recipe(RecipeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_ai_generated: bool
    owner_id: int
    ingredients: List[RecipeIngredient] = []
    nutrition: Optional[RecipeNutrition] = None
    
    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

# Meal Plan schemas
class MealPlanEntryBase(BaseModel):
    date: datetime
    meal_type: str  # "breakfast", "lunch", "dinner", "snack"
    recipe_id: int
    servings: float = 1.0
    notes: Optional[str] = None

class MealPlanEntryCreate(MealPlanEntryBase):
    pass

class MealPlanEntryUpdate(BaseModel):
    date: Optional[datetime] = None
    meal_type: Optional[str] = None
    recipe_id: Optional[int] = None
    servings: Optional[float] = None
    notes: Optional[str] = None

class MealPlanEntry(MealPlanEntryBase):
    id: int
    meal_plan_id: int
    recipe: Optional[Recipe] = None
    
    class Config:
        from_attributes = True

class MealPlanBase(BaseModel):
    name: str
    start_date: datetime
    end_date: datetime

class MealPlanCreate(MealPlanBase):
    entries: Optional[List[MealPlanEntryCreate]] = []

class MealPlanUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class MealPlan(MealPlanBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int
    entries: List[MealPlanEntry] = []
    
    class Config:
        from_attributes = True

# Nutrition Goal schemas
class NutritionGoalBase(BaseModel):
    daily_calories: Optional[float] = None
    daily_protein: Optional[float] = None
    daily_carbs: Optional[float] = None
    daily_fat: Optional[float] = None
    daily_fiber: Optional[float] = None

class NutritionGoalCreate(NutritionGoalBase):
    pass

class NutritionGoalUpdate(NutritionGoalBase):
    pass

class NutritionGoal(NutritionGoalBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int
    
    class Config:
        from_attributes = True

# Weekly nutrition summary
class DayNutrition(BaseModel):
    date: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float

class WeeklyNutrition(BaseModel):
    days: List[DayNutrition]
    weekly_totals: DayNutrition
    weekly_averages: DayNutrition 