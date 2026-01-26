"""Recipe database models."""

from datetime import datetime
from sqlalchemy import String, Float, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Recipe(Base):
    """Recipe model with calculated nutritional totals."""
    
    __tablename__ = "recipes"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    servings: Mapped[int] = mapped_column(Integer, default=1)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relationships
    ingredients: Mapped[list["RecipeIngredient"]] = relationship(
        "RecipeIngredient",
        back_populates="recipe",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    @property
    def total_calories(self) -> float:
        """Calculate total calories for the recipe."""
        return sum(ing.calories for ing in self.ingredients)
    
    @property
    def total_protein(self) -> float:
        """Calculate total protein for the recipe."""
        return sum(ing.protein for ing in self.ingredients)
    
    @property
    def total_carbs(self) -> float:
        """Calculate total carbs for the recipe."""
        return sum(ing.carbs for ing in self.ingredients)
    
    @property
    def total_fat(self) -> float:
        """Calculate total fat for the recipe."""
        return sum(ing.fat for ing in self.ingredients)
    
    @property
    def calories_per_serving(self) -> float:
        """Calculate calories per serving."""
        return self.total_calories / self.servings if self.servings > 0 else 0
    
    @property
    def protein_per_serving(self) -> float:
        """Calculate protein per serving."""
        return self.total_protein / self.servings if self.servings > 0 else 0
    
    @property
    def carbs_per_serving(self) -> float:
        """Calculate carbs per serving."""
        return self.total_carbs / self.servings if self.servings > 0 else 0
    
    @property
    def fat_per_serving(self) -> float:
        """Calculate fat per serving."""
        return self.total_fat / self.servings if self.servings > 0 else 0
    
    def __repr__(self) -> str:
        return f"<Recipe(id={self.id}, name='{self.name}')>"


class RecipeIngredient(Base):
    """Ingredient entry within a recipe."""
    
    __tablename__ = "recipe_ingredients"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id"), nullable=False)
    
    # Can reference a saved food or be a custom entry
    food_id: Mapped[int | None] = mapped_column(ForeignKey("foods.id"), nullable=True)
    food_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Amount and nutritional values for this ingredient
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), default="g")
    
    # Pre-calculated values for this amount
    calories: Mapped[float] = mapped_column(Float, default=0)
    protein: Mapped[float] = mapped_column(Float, default=0)
    carbs: Mapped[float] = mapped_column(Float, default=0)
    fat: Mapped[float] = mapped_column(Float, default=0)
    
    # Relationships
    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="ingredients")
    
    def __repr__(self) -> str:
        return f"<RecipeIngredient(id={self.id}, food='{self.food_name}', amount={self.amount})>"
