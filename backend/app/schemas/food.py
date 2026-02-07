"""Food-related Pydantic schemas."""

from datetime import datetime
from pydantic import BaseModel, Field


class FoodBase(BaseModel):
    """Base food schema."""
    name: str = Field(..., min_length=1, max_length=255)
    brand: str | None = None
    barcode: str | None = None
    
    # Nutritional values per 100g
    calories: float = Field(0, ge=0)
    protein: float = Field(0, ge=0)
    carbs: float = Field(0, ge=0)
    fat: float = Field(0, ge=0)
    fiber: float = Field(0, ge=0)
    sugar: float = Field(0, ge=0)
    sodium: float = Field(0, ge=0)
    
    # Serving info
    serving_size: float = Field(100, gt=0)
    serving_unit: str = "g"


class FoodCreate(FoodBase):
    """Schema for creating a custom food."""
    pass


class FoodResponse(FoodBase):
    """Schema for food response."""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FoodSearchResult(BaseModel):
    """Schema for food search results from Open Food Facts."""
    barcode: str | None = None
    name: str
    brand: str | None = None
    image_url: str | None = None
    
    # Nutritional values per 100g
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: float = 0
    sugar: float = 0
    sodium: float = 0
    
    # Additional info
    nutriscore_grade: str | None = None
    nova_group: int | None = None
    
    # Source tracking
    source: str = "openfoodfacts"  # "openfoodfacts", "cached", "custom"
    
    class Config:
        from_attributes = True


class FoodCacheResponse(BaseModel):
    """Schema for cached food response."""
    id: int
    barcode: str
    name: str
    brand: str | None = None
    image_url: str | None = None
    
    # Nutritional values per 100g
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: float = 0
    sugar: float = 0
    sodium: float = 0
    
    # Additional info
    nutriscore_grade: str | None = None
    nova_group: int | None = None
    
    # User-specific
    is_saved: bool = False
    usage_count: int = 0
    
    # Timestamps
    cached_at: datetime
    expires_at: datetime
    
    class Config:
        from_attributes = True


class FoodCacheUpdate(BaseModel):
    """Schema for updating cached food."""
    name: str | None = None
    brand: str | None = None
    calories: float | None = Field(None, ge=0)
    protein: float | None = Field(None, ge=0)
    carbs: float | None = Field(None, ge=0)
    fat: float | None = Field(None, ge=0)
    fiber: float | None = Field(None, ge=0)
    sugar: float | None = Field(None, ge=0)
    sodium: float | None = Field(None, ge=0)
