'use client';

import { useState } from 'react';
import { Recipe, MealPlan } from '@/types';

interface MealSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  selectedSlot: {
    date: string;
    mealType: string;
  };
  onMealAssigned: (recipeId: number, servings: number) => Promise<void>;
}

export default function MealSelector({
  isOpen,
  onClose,
  recipes,
  selectedSlot,
  onMealAssigned
}: MealSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Filter recipes based on search query
  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.cuisine_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.dietary_tags?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignMeal = async (recipe: Recipe) => {
    setLoading(true);
    try {
      await onMealAssigned(recipe.id, servings);
      onClose();
    } catch (error) {
      console.error('Error assigning meal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAssign = (recipe: Recipe) => {
    assignMeal(recipe);
  };

  const handleDetailedAssign = () => {
    if (selectedRecipe) {
      assignMeal(selectedRecipe);
    }
  };

  const formatMealTypeDisplay = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  const formatDateDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Assign Meal
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {formatMealTypeDisplay(selectedSlot.mealType)} • {formatDateDisplay(selectedSlot.date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search recipes by name, description, cuisine, or dietary tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="absolute right-3 top-3 text-gray-400">
              🔍
            </div>
          </div>
        </div>

        {/* Recipe List */}
        <div className="flex-1 overflow-y-auto max-h-96 p-6">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🍽️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No recipes found' : 'No recipes available'}
              </h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Try adjusting your search terms or create a new recipe'
                  : 'Create your first recipe to get started'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`border border-gray-200 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedRecipe?.id === recipe.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {recipe.title}
                      </h3>
                      {recipe.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {recipe.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        {recipe.cuisine_type && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {recipe.cuisine_type}
                          </span>
                        )}
                        {recipe.dietary_tags && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                            {recipe.dietary_tags}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {recipe.servings} servings
                        </span>
                        {recipe.nutrition && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                            {Math.round(recipe.nutrition.calories)} cal
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAssign(recipe);
                      }}
                      disabled={loading}
                      className="ml-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      Quick Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with detailed assignment options */}
        {selectedRecipe && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-900">
                  Selected: {selectedRecipe.title}
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Servings:</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={servings}
                    onChange={(e) => setServings(parseFloat(e.target.value) || 1)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                {selectedRecipe.nutrition && (
                  <div className="text-xs text-gray-500">
                    {Math.round(selectedRecipe.nutrition.calories * servings)} calories total
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDetailedAssign}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Meal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 