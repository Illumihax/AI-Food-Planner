"""Open Food Facts API integration service."""

import httpx
from typing import Any
import logging

from app.config import get_settings
from app.schemas.food import FoodSearchResult

logger = logging.getLogger(__name__)


class OpenFoodFactsService:
    """Service for interacting with Open Food Facts API."""
    
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.off_base_url
        self.headers = {
            "User-Agent": self.settings.off_user_agent,
        }
        # Longer timeout for Open Food Facts API (can be slow)
        self.timeout = httpx.Timeout(30.0, connect=10.0)
    
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
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
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
                )
                response.raise_for_status()
                data = response.json()
            
            results = []
            for product in data.get("products", []):
                results.append(self._parse_product(product))
            
            return results
        except httpx.TimeoutException:
            logger.warning(f"Timeout searching Open Food Facts for: {query}")
            return []
        except httpx.HTTPError as e:
            logger.error(f"HTTP error searching Open Food Facts: {e}")
            return []
    
    async def get_product_by_barcode(self, barcode: str) -> FoodSearchResult | None:
        """
        Get product information by barcode.
        
        Args:
            barcode: Product barcode (EAN/UPC)
        
        Returns:
            Food search result or None if not found
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/api/v2/product/{barcode}.json",
                    params={
                        "fields": "code,product_name,brands,image_front_small_url,"
                                  "nutriments,nutriscore_grade,nova_group",
                    },
                    headers=self.headers,
                )
                
                if response.status_code == 404:
                    return None
                
                response.raise_for_status()
                data = response.json()
            
            if data.get("status") != 1:
                return None
            
            return self._parse_product(data.get("product", {}))
        except httpx.TimeoutException:
            logger.warning(f"Timeout fetching barcode: {barcode}")
            return None
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching barcode {barcode}: {e}")
            return None
    
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
