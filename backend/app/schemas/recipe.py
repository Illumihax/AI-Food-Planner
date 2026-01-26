"""Recipe-related Pydantic schemas."""

from datetime import datetime
from pydantic import BaseModel, Field, computed_field


class RecipeIngredientBase(BaseModel):
    """Base recipe ingredient schema."""
    food_id: int | None = None
    food_name: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0)
    unit: str = "g"
    
    # Pre-calculated values for this amount
    calories: float = Field(0, ge=0)
    protein: float = Field(0, ge=0)
    carbs: float = Field(0, ge=0)
    fat: float = Field(0, ge=0)


class RecipeIngredientCreate(RecipeIngredientBase):
    """Schema for creating a recipe ingredient."""
    pass


class RecipeIngredientResponse(RecipeIngredientBase):
    """Schema for recipe ingredient response."""
    id: int
    recipe_id: int
    
    class Config:
        from_attributes = True


class RecipeBase(BaseModel):
    """Base recipe schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    servings: int = Field(1, ge=1)
    instructions: str | None = None


class RecipeCreate(RecipeBase):
    """Schema for creating a recipe."""
    ingredients: list[RecipeIngredientCreate] = []


class RecipeUpdate(BaseModel):
    """Schema for updating a recipe."""
    name: str | None = None
    description: str | None = None
    servings: int | None = Field(None, ge=1)
    instructions: str | None = None
    ingredients: list[RecipeIngredientCreate] | None = None


class RecipeResponse(RecipeBase):
    """Schema for recipe response."""
    id: int
    ingredients: list[RecipeIngredientResponse] = []
    created_at: datetime
    updated_at: datetime
    
    @computed_field
    @property
    def total_calories(self) -> float:
        return sum(ing.calories for ing in self.ingredients)
    
    @computed_field
    @property
    def total_protein(self) -> float:
        return sum(ing.protein for ing in self.ingredients)
    
    @computed_field
    @property
    def total_carbs(self) -> float:
        return sum(ing.carbs for ing in self.ingredients)
    
    @computed_field
    @property
    def total_fat(self) -> float:
        return sum(ing.fat for ing in self.ingredients)
    
    @computed_field
    @property
    def calories_per_serving(self) -> float:
        return self.total_calories / self.servings if self.servings > 0 else 0
    
    @computed_field
    @property
    def protein_per_serving(self) -> float:
        return self.total_protein / self.servings if self.servings > 0 else 0
    
    @computed_field
    @property
    def carbs_per_serving(self) -> float:
        return self.total_carbs / self.servings if self.servings > 0 else 0
    
    @computed_field
    @property
    def fat_per_serving(self) -> float:
        return self.total_fat / self.servings if self.servings > 0 else 0
    
    class Config:
        from_attributes = True
