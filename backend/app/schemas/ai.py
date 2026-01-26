"""AI-related Pydantic schemas."""

from pydantic import BaseModel, Field
from typing import Literal


Language = Literal["en", "de"]


class MealPlanRequest(BaseModel):
    """Request schema for meal plan generation."""
    use_current_goal: bool = True
    daily_calories: float | None = None
    daily_protein: float | None = None
    daily_carbs: float | None = None
    daily_fat: float | None = None
    days: int = Field(7, ge=1, le=14)
    preferences: list[str] = []  # e.g., ["vegetarian", "high-protein"]
    restrictions: list[str] = []  # e.g., ["gluten-free", "dairy-free"]
    language: Language = "en"


class MealPlanDay(BaseModel):
    """A single day in the meal plan."""
    day: int
    breakfast: str
    breakfast_description: str
    lunch: str
    lunch_description: str
    dinner: str
    dinner_description: str
    snacks: list[str] = []
    estimated_calories: float
    estimated_protein: float
    estimated_carbs: float
    estimated_fat: float


class MealPlanResponse(BaseModel):
    """Response schema for meal plan generation."""
    days: list[MealPlanDay]
    notes: str | None = None


class RecipeSuggestionRequest(BaseModel):
    """Request schema for recipe suggestions."""
    ingredients: list[str] = Field(..., min_length=1)
    meal_type: str | None = None  # breakfast, lunch, dinner, snack
    cuisine: str | None = None  # e.g., "italian", "asian"
    max_recipes: int = Field(5, ge=1, le=10)
    language: Language = "en"


class RecipeSuggestion(BaseModel):
    """A single recipe suggestion."""
    name: str
    description: str
    ingredients: list[str]
    instructions: list[str]
    estimated_calories: float
    estimated_protein: float
    estimated_carbs: float
    estimated_fat: float
    prep_time: str
    cook_time: str


class RecipeSuggestionResponse(BaseModel):
    """Response schema for recipe suggestions."""
    recipes: list[RecipeSuggestion]


class ChatMessage(BaseModel):
    """A chat message in conversation history."""
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """Request schema for nutrition chat."""
    message: str = Field(..., min_length=1)
    conversation_history: list[ChatMessage] = []
    language: Language = "en"


class ChatResponse(BaseModel):
    """Response schema for nutrition chat."""
    response: str
    suggestions: list[str] = []  # Follow-up question suggestions
