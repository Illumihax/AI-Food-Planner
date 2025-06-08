'use client';

import { useState, useEffect } from 'react';
import { MealPlanEntry, Recipe } from '@/types';
import { fetchRecipe } from '@/lib/api';

interface MealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: MealPlanEntry | null;
}

export default function MealDetailModal({
  isOpen,
  onClose,
  entry
}: MealDetailModalProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && entry?.recipe_id) {
      loadRecipeDetails();
    }
  }, [isOpen, entry?.recipe_id]);

  const loadRecipeDetails = async () => {
    if (!entry?.recipe_id) return;
    
    try {
      setLoading(true);
      const recipeData = await fetchRecipe(entry.recipe_id);
      setRecipe(recipeData);
    } catch (error) {
      console.error('Failed to load recipe details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !entry) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMealType = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {entry.recipe?.title || 'Meal Details'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {formatMealType(entry.meal_type)} • {formatDate(entry.date)}
              {entry.servings !== 1 && ` • ${entry.servings} serving${entry.servings !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl p-2"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="ml-4 text-gray-600">Loading recipe details...</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Recipe Info */}
              {recipe && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    {recipe.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-700">{recipe.description}</p>
                      </div>
                    )}

                    {/* Instructions / Zubereitung */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Zubereitung</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-gray-700 font-sans leading-relaxed">
                          {recipe.instructions}
                        </pre>
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Ingredients
                        {entry.servings !== 1 && (
                          <span className="text-sm font-normal text-gray-600 ml-2">
                            (scaled for {entry.servings} serving{entry.servings !== 1 ? 's' : ''})
                          </span>
                        )}
                      </h3>
                      {recipe.ingredients && recipe.ingredients.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <ul className="space-y-2">
                            {recipe.ingredients.map((recipeIngredient, index) => (
                              <li key={index} className="flex items-center space-x-3">
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                <span className="text-gray-700">
                                  {(recipeIngredient.quantity * entry.servings).toFixed(1)} {recipeIngredient.unit}{' '}
                                  {recipeIngredient.ingredient?.name || 'Unknown ingredient'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No ingredients information available</p>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Recipe Meta */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Recipe Info</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Servings:</span>
                          <span className="font-medium">{recipe.servings}</span>
                        </div>
                        {recipe.prep_time && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Prep Time:</span>
                            <span className="font-medium">{recipe.prep_time} min</span>
                          </div>
                        )}
                        {recipe.cook_time && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cook Time:</span>
                            <span className="font-medium">{recipe.cook_time} min</span>
                          </div>
                        )}
                        {recipe.difficulty && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Difficulty:</span>
                            <span className="font-medium capitalize">{recipe.difficulty}</span>
                          </div>
                        )}
                        {recipe.cuisine_type && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cuisine:</span>
                            <span className="font-medium">{recipe.cuisine_type}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nutrition Info */}
                    {recipe.nutrition && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">
                          Nutrition 
                          {entry.servings !== 1 && (
                            <span className="text-sm font-normal text-gray-600 block">
                              (for {entry.servings} serving{entry.servings !== 1 ? 's' : ''})
                            </span>
                          )}
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Calories:</span>
                            <span className="font-medium">
                              {Math.round(recipe.nutrition.calories * entry.servings)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Protein:</span>
                            <span className="font-medium">
                              {(recipe.nutrition.protein * entry.servings).toFixed(1)}g
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Carbs:</span>
                            <span className="font-medium">
                              {(recipe.nutrition.carbs * entry.servings).toFixed(1)}g
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fat:</span>
                            <span className="font-medium">
                              {(recipe.nutrition.fat * entry.servings).toFixed(1)}g
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fiber:</span>
                            <span className="font-medium">
                              {(recipe.nutrition.fiber * entry.servings).toFixed(1)}g
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dietary Tags */}
                    {recipe.dietary_tags && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Dietary Info</h3>
                        <div className="flex flex-wrap gap-2">
                          {recipe.dietary_tags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 