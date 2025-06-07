'use client';

import { useState, useEffect } from 'react';
import WeeklyPlannerView from '@/components/WeeklyPlannerView';
import RecipeSelector from '@/components/RecipeSelector';
import NutritionSummary from '@/components/NutritionSummary';
import RecipeCreator from '@/components/RecipeCreator';
import { Recipe, MealPlan, MealPlanEntry } from '@/types';
import { fetchCurrentWeekMealPlan, fetchRecipes } from '@/lib/api';

export default function Home() {
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    mealType: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecipeCreator, setShowRecipeCreator] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [mealPlan, recipesData] = await Promise.all([
        fetchCurrentWeekMealPlan(),
        fetchRecipes()
      ]);
      
      setCurrentMealPlan(mealPlan);
      setRecipes(recipesData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (date: string, mealType: string) => {
    setSelectedSlot({ date, mealType });
  };

  const handleRecipeSelect = async (recipe: Recipe) => {
    if (!selectedSlot || !currentMealPlan) return;

    try {
      // Add meal plan entry
      const response = await fetch(`http://localhost:8000/api/meal-plans/${currentMealPlan.id}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date(selectedSlot.date).toISOString(),
          meal_type: selectedSlot.mealType,
          recipe_id: recipe.id,
          servings: 1.0
        }),
      });

      if (response.ok) {
        // Reload meal plan to show updated data
        const updatedMealPlan = await fetchCurrentWeekMealPlan();
        setCurrentMealPlan(updatedMealPlan);
        setSelectedSlot(null);
      }
    } catch (error) {
      console.error('Failed to add meal:', error);
    }
  };

  const handleRemoveMeal = async (entryId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/meal-plans/entries/${entryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload meal plan to show updated data
        const updatedMealPlan = await fetchCurrentWeekMealPlan();
        setCurrentMealPlan(updatedMealPlan);
      }
    } catch (error) {
      console.error('Failed to remove meal:', error);
    }
  };

  const handleRecipeCreated = async (newRecipe: Recipe) => {
    // Add the new recipe to the recipes list
    setRecipes(prev => [...prev, newRecipe]);
    setShowRecipeCreator(false);
    
    // If there's a selected slot, automatically select the new recipe
    if (selectedSlot) {
      await handleRecipeSelect(newRecipe);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Meal Plan</h1>
          <p className="text-gray-600">Plan your meals and track your nutrition</p>
        </div>
        <button
          onClick={() => setShowRecipeCreator(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Create Recipe</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Planner - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">This Week's Plan</h2>
            {currentMealPlan ? (
              <WeeklyPlannerView
                mealPlan={currentMealPlan}
                onSlotClick={handleSlotClick}
                onRemoveMeal={handleRemoveMeal}
                selectedSlot={selectedSlot}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No meal plan found</h3>
                <p className="text-gray-500">A new meal plan will be created automatically when you add your first meal.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Nutrition and Recipe Selection */}
        <div className="space-y-6">
          {/* Nutrition Summary */}
          {currentMealPlan && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Nutrition Summary</h3>
              <NutritionSummary mealPlanId={currentMealPlan.id} />
            </div>
          )}

          {/* Recipe Selection */}
          {selectedSlot && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Add Meal for {selectedSlot.mealType} on{' '}
                {new Date(selectedSlot.date).toLocaleDateString()}
              </h3>
              <RecipeSelector
                recipes={recipes}
                onRecipeSelect={handleRecipeSelect}
                onCancel={() => setSelectedSlot(null)}
                onCreateRecipe={() => setShowRecipeCreator(true)}
              />
            </div>
          )}

          {/* Instructions */}
          {!selectedSlot && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use</h3>
              <ol className="text-blue-700 space-y-2 text-sm">
                <li>1. Click on any meal slot in the calendar</li>
                <li>2. Choose a recipe from the list or create a new one</li>
                <li>3. View your nutrition summary in the sidebar</li>
                <li>4. Adjust portions as needed</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Creator Modal */}
      {showRecipeCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <RecipeCreator
              onRecipeCreated={handleRecipeCreated}
              onCancel={() => setShowRecipeCreator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
