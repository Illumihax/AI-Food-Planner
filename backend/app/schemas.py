from typing import Optional

from pydantic import BaseModel, Field


class IngredientBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    brand: Optional[str] = Field(default=None, max_length=255)
    source: Optional[str] = Field(default="manual", max_length=50)
    calories: Optional[float] = None
    carbs: Optional[float] = None
    protein: Optional[float] = None
    fats: Optional[float] = None


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    brand: Optional[str] = Field(default=None, max_length=255)
    source: Optional[str] = Field(default=None, max_length=50)
    calories: Optional[float] = None
    carbs: Optional[float] = None
    protein: Optional[float] = None
    fats: Optional[float] = None


class IngredientRead(IngredientBase):
    id: int

    class Config:
        from_attributes = True


