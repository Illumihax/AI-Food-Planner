"""Open Food Facts API integration service."""

import httpx
from typing import Any

from app.config import get_settings
from app.schemas.food import FoodSearchResult


class OpenFoodFactsService:
    """Service for interacting with Open Food Facts API."""
    
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.off_base_url
        self.headers = {
            "User-Agent": self.settings.off_user_agent,
        }
    
    async def search_products(
        self,
        query: str,
        page: int = 1,
        page_size: int = 20,
    ) -> list[FoodSearchResult]:
        """
        Search for products by name/brand.
        
        Args:
            query: Search term
            page: Page number (1-indexed)
            page_size: Results per page
        
        Returns:
            List of food search results
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/cgi/search.pl",
                params={
                    "search_terms": query,
                    "search_simple": 1,
                    "action": "process",
                    "json": 1,
                    "page": page,
                    "page_size": page_size,
                    "fields": "code,product_name,brands,image_front_small_url,"
                              "nutriments,nutriscore_grade,nova_group",
                },
                headers=self.headers,
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
        
        results = []
        for product in data.get("products", []):
            results.append(self._parse_product(product))
        
        return results
    
    async def get_product_by_barcode(self, barcode: str) -> FoodSearchResult | None:
        """
        Get product information by barcode.
        
        Args:
            barcode: Product barcode (EAN/UPC)
        
        Returns:
            Food search result or None if not found
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v2/product/{barcode}.json",
                params={
                    "fields": "code,product_name,brands,image_front_small_url,"
                              "nutriments,nutriscore_grade,nova_group",
                },
                headers=self.headers,
                timeout=10.0,
            )
            
            if response.status_code == 404:
                return None
            
            response.raise_for_status()
            data = response.json()
        
        if data.get("status") != 1:
            return None
        
        return self._parse_product(data.get("product", {}))
    
    def _parse_product(self, product: dict[str, Any]) -> FoodSearchResult:
        """Parse Open Food Facts product data into our schema."""
        nutriments = product.get("nutriments", {})
        
        return FoodSearchResult(
            barcode=product.get("code"),
            name=product.get("product_name", "Unknown"),
            brand=product.get("brands"),
            image_url=product.get("image_front_small_url"),
            
            # Nutritional values per 100g
            calories=self._safe_float(nutriments.get("energy-kcal_100g")),
            protein=self._safe_float(nutriments.get("proteins_100g")),
            carbs=self._safe_float(nutriments.get("carbohydrates_100g")),
            fat=self._safe_float(nutriments.get("fat_100g")),
            fiber=self._safe_float(nutriments.get("fiber_100g")),
            sugar=self._safe_float(nutriments.get("sugars_100g")),
            sodium=self._safe_float(nutriments.get("sodium_100g")),
            
            # Additional info
            nutriscore_grade=product.get("nutriscore_grade"),
            nova_group=product.get("nova_group"),
        )
    
    @staticmethod
    def _safe_float(value: Any) -> float:
        """Safely convert value to float, defaulting to 0."""
        if value is None:
            return 0.0
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0
