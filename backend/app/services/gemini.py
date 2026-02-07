"""Google Gemini AI integration service."""

import json
import asyncio
import google.generativeai as genai
from typing import Any
import logging

from app.config import get_settings
from app.schemas.ai import (
    MealPlanResponse, MealPlanDay,
    RecipeSuggestionResponse, RecipeSuggestion,
    ChatResponse, ChatMessage,
)

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Google Gemini AI."""
    
    def __init__(self):
        self.settings = get_settings()
        if self.settings.gemini_api_key:
            genai.configure(api_key=self.settings.gemini_api_key)
        # Use gemini-2.5-flash for fast, intelligent responses (stable model)
        self.model = genai.GenerativeModel("gemini-2.5-flash")
    
    async def generate_meal_plan(
        self,
        calories: float,
        protein: float,
        carbs: float,
        fat: float,
        days: int = 7,
        preferences: list[str] = None,
        restrictions: list[str] = None,
        language: str = "en",
    ) -> MealPlanResponse:
        """
        Generate a meal plan based on nutritional goals.
        
        Args:
            calories: Daily calorie target
            protein: Daily protein target (g)
            carbs: Daily carbs target (g)
            fat: Daily fat target (g)
            days: Number of days to plan
            preferences: Dietary preferences
            restrictions: Dietary restrictions
            language: Response language (en/de)
        
        Returns:
            Generated meal plan
        """
        preferences = preferences or []
        restrictions = restrictions or []
        
        lang_instruction = "Respond in German." if language == "de" else "Respond in English."
        
        prompt = f"""
        {lang_instruction}
        
        Create a {days}-day meal plan with these daily nutritional targets:
        - Calories: {calories} kcal
        - Protein: {protein}g
        - Carbohydrates: {carbs}g
        - Fat: {fat}g
        
        {"Preferences: " + ", ".join(preferences) if preferences else ""}
        {"Restrictions/Allergies: " + ", ".join(restrictions) if restrictions else ""}
        
        Return a JSON object with this exact structure:
        {{
            "days": [
                {{
                    "day": 1,
                    "breakfast": "Meal name",
                    "breakfast_description": "Brief description with main ingredients",
                    "lunch": "Meal name",
                    "lunch_description": "Brief description with main ingredients",
                    "dinner": "Meal name", 
                    "dinner_description": "Brief description with main ingredients",
                    "snacks": ["Snack 1", "Snack 2"],
                    "estimated_calories": 2000,
                    "estimated_protein": 150,
                    "estimated_carbs": 200,
                    "estimated_fat": 65
                }}
            ],
            "notes": "Any additional tips or notes"
        }}
        
        Make the meals varied, practical, and delicious. Include estimated macros for each day.
        Return ONLY the JSON, no additional text.
        """
        
        response = await self._generate_content(prompt)
        data = self._parse_json_response(response)
        
        days_list = [
            MealPlanDay(**day_data) for day_data in data.get("days", [])
        ]
        
        return MealPlanResponse(
            days=days_list,
            notes=data.get("notes"),
        )
    
    async def generate_single_day(
        self,
        calories: float,
        protein: float,
        carbs: float,
        fat: float,
        day_index: int,
        existing_week_context: list[dict] = None,
        meal_type_filter: str | None = None,
        preferences: list[str] = None,
        restrictions: list[str] = None,
        language: str = "en",
    ) -> MealPlanDay:
        """
        Generate a meal plan for a single day, optionally with context of the rest of the week.
        If meal_type_filter is provided, only regenerate that specific meal type.
        """
        preferences = preferences or []
        restrictions = restrictions or []
        
        lang_instruction = "Respond in German." if language == "de" else "Respond in English."
        
        week_context = ""
        if existing_week_context:
            week_context = "The rest of the week looks like this (keep variety, don't repeat meals):\n"
            for day_info in existing_week_context:
                week_context += f"  Day {day_info['day']}: {', '.join(day_info.get('meals', []))}\n"
        
        meal_type_instruction = ""
        if meal_type_filter:
            meal_type_instruction = f"""
            IMPORTANT: Only generate the {meal_type_filter} meal. For other meals, use empty placeholder values.
            Focus on making the {meal_type_filter} excellent and varied from the rest of the week.
            """
        
        prompt = f"""
        {lang_instruction}
        
        Create a meal plan for a SINGLE day (day {day_index + 1}) with these daily nutritional targets:
        - Calories: {calories} kcal
        - Protein: {protein}g
        - Carbohydrates: {carbs}g
        - Fat: {fat}g
        
        {"Preferences: " + ", ".join(preferences) if preferences else ""}
        {"Restrictions/Allergies: " + ", ".join(restrictions) if restrictions else ""}
        
        {week_context}
        {meal_type_instruction}
        
        Return a JSON object with this exact structure:
        {{
            "day": {day_index + 1},
            "breakfast": "Meal name",
            "breakfast_description": "Brief description with main ingredients",
            "lunch": "Meal name",
            "lunch_description": "Brief description with main ingredients",
            "dinner": "Meal name", 
            "dinner_description": "Brief description with main ingredients",
            "snacks": ["Snack 1", "Snack 2"],
            "estimated_calories": {int(calories)},
            "estimated_protein": {int(protein)},
            "estimated_carbs": {int(carbs)},
            "estimated_fat": {int(fat)}
        }}
        
        Make the meals varied, practical, and delicious.
        Return ONLY the JSON, no additional text.
        """
        
        response = await self._generate_content(prompt)
        data = self._parse_json_response(response)
        
        return MealPlanDay(**data)

    async def suggest_recipes(
        self,
        ingredients: list[str],
        meal_type: str | None = None,
        cuisine: str | None = None,
        max_recipes: int = 5,
        language: str = "en",
    ) -> RecipeSuggestionResponse:
        """
        Suggest recipes based on available ingredients.
        
        Args:
            ingredients: List of available ingredients
            meal_type: Type of meal (breakfast, lunch, dinner, snack)
            cuisine: Preferred cuisine style
            max_recipes: Maximum number of recipes to suggest
            language: Response language (en/de)
        
        Returns:
            Recipe suggestions
        """
        lang_instruction = "Respond in German." if language == "de" else "Respond in English."
        
        prompt = f"""
        {lang_instruction}
        
        Suggest {max_recipes} recipes using these ingredients: {", ".join(ingredients)}
        
        {"Meal type: " + meal_type if meal_type else ""}
        {"Cuisine preference: " + cuisine if cuisine else ""}
        
        Return a JSON object with this exact structure:
        {{
            "recipes": [
                {{
                    "name": "Recipe name",
                    "description": "Brief description",
                    "ingredients": ["Ingredient 1 with amount", "Ingredient 2 with amount"],
                    "instructions": ["Step 1", "Step 2", "Step 3"],
                    "estimated_calories": 500,
                    "estimated_protein": 30,
                    "estimated_carbs": 40,
                    "estimated_fat": 20,
                    "prep_time": "10 minutes",
                    "cook_time": "20 minutes"
                }}
            ]
        }}
        
        Use as many of the provided ingredients as possible.
        You may add common pantry staples (salt, pepper, oil, etc.) if needed.
        Return ONLY the JSON, no additional text.
        """
        
        response = await self._generate_content(prompt)
        data = self._parse_json_response(response)
        
        recipes = [
            RecipeSuggestion(**recipe_data) 
            for recipe_data in data.get("recipes", [])
        ]
        
        return RecipeSuggestionResponse(recipes=recipes)
    
    async def chat(
        self,
        message: str,
        conversation_history: list[ChatMessage] = None,
        goal_context: dict[str, float] | None = None,
        language: str = "en",
    ) -> ChatResponse:
        """
        Chat with AI about nutrition and food planning.
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
            goal_context: User's nutritional goals for context
            language: Response language (en/de)
        
        Returns:
            AI response with suggestions
        """
        conversation_history = conversation_history or []
        
        lang_instruction = "Respond in German." if language == "de" else "Respond in English."
        
        # Build context
        context = f"""
        {lang_instruction}
        
        You are a helpful nutrition assistant. Help users with:
        - Understanding nutrition and macronutrients
        - Meal planning and food choices
        - Reaching their health goals
        - Recipe ideas and cooking tips
        
        Be friendly, informative, and practical in your responses.
        """
        
        if goal_context:
            context += f"""
            
            User's current goals:
            - Daily calories: {goal_context.get('calories', 'Not set')} kcal
            - Daily protein: {goal_context.get('protein', 'Not set')}g
            - Daily carbs: {goal_context.get('carbs', 'Not set')}g
            - Daily fat: {goal_context.get('fat', 'Not set')}g
            """
        
        # Build conversation
        full_prompt = context + "\n\n"
        
        for msg in conversation_history:
            role = "User" if msg.role == "user" else "Assistant"
            full_prompt += f"{role}: {msg.content}\n\n"
        
        full_prompt += f"User: {message}\n\n"
        full_prompt += """
        Return a JSON object with this structure:
        {
            "response": "Your helpful response here",
            "suggestions": ["Follow-up question 1?", "Follow-up question 2?"]
        }
        
        Include 2-3 relevant follow-up question suggestions.
        Return ONLY the JSON, no additional text.
        """
        
        response = await self._generate_content(full_prompt)
        data = self._parse_json_response(response)
        
        return ChatResponse(
            response=data.get("response", "I apologize, but I couldn't generate a response."),
            suggestions=data.get("suggestions", []),
        )
    
    async def _generate_content(self, prompt: str) -> str:
        """Generate content using Gemini model."""
        try:
            # Run the synchronous API call in a thread pool
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(prompt)
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise
    
    def _parse_json_response(self, response: str) -> dict[str, Any]:
        """Parse JSON from Gemini response, handling markdown code blocks."""
        # Clean up response - remove markdown code blocks if present
        text = response.strip()
        
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        
        if text.endswith("```"):
            text = text[:-3]
        
        text = text.strip()
        
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON response: {e}")
            logger.debug(f"Raw response: {text}")
            # Try to extract a simple response if JSON parsing fails
            return {
                "response": text if len(text) < 2000 else "I apologize, but I couldn't format the response properly.",
                "suggestions": []
            }
