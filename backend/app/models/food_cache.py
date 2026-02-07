"""Food search cache database model."""

from datetime import datetime
from sqlalchemy import String, Float, DateTime, Text, Index, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FoodCache(Base):
    """Cached food data from Open Food Facts."""
    
    __tablename__ = "food_cache"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Unique identifier from Open Food Facts (barcode)
    barcode: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    
    # Search query that found this food (for cache lookup)
    search_query: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    
    # Food data
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Nutritional values per 100g
    calories: Mapped[float] = mapped_column(Float, default=0)
    protein: Mapped[float] = mapped_column(Float, default=0)
    carbs: Mapped[float] = mapped_column(Float, default=0)
    fat: Mapped[float] = mapped_column(Float, default=0)
    fiber: Mapped[float] = mapped_column(Float, default=0)
    sugar: Mapped[float] = mapped_column(Float, default=0)
    sodium: Mapped[float] = mapped_column(Float, default=0)
    
    # Additional info
    nutriscore_grade: Mapped[str | None] = mapped_column(String(10), nullable=True)
    nova_group: Mapped[int | None] = mapped_column(nullable=True)
    
    # User-specific flags
    is_saved: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Cache metadata
    cached_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Index for efficient cache lookups
    __table_args__ = (
        Index('ix_food_cache_search_query_lower', 'search_query'),
    )
    
    def __repr__(self) -> str:
        return f"<FoodCache(barcode='{self.barcode}', name='{self.name}', saved={self.is_saved})>"
