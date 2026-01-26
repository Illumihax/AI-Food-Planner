"""Google Gemini AI integration service."""

import json
import google.generativeai as genai
from typing import Any

from app.config import get_settings
from app.schemas.ai import (
    MealPlanResponse, MealPlanDay,
    RecipeSuggestionResponse, RecipeSuggestion,
    ChatResponse, ChatMessage,
)


class GeminiService:
    """Service for interacting with Google Gemini AI."""
    
    def __init__(self):
        self.settings = get_settings()
        if self.settings.gemini_api_key:
            genai.configure(api_key=self.settings.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-pro")
    
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
        response = self.model.generate_content(prompt)
        return response.text
    
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
        except json.JSONDecodeError:
            # If parsing fails, return empty dict
            return {}
