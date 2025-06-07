'use client';

import { useState, useEffect } from 'react';
import { Recipe, Ingredient, RecipeIngredient } from '@/types';
import { fetchIngredients, createRecipe, updateRecipe } from '@/lib/api';
import IngredientSelector from './IngredientSelector';

interface RecipeCreatorProps {
  onRecipeCreated: (recipe: Recipe) => void;
  onCancel: () => void;
  editingRecipe?: Recipe | null;
}

export default function RecipeCreator({ onRecipeCreated, onCancel, editingRecipe }: RecipeCreatorProps) {
  const [formData, setFormData] = useState({
    title: editingRecipe?.title || '',
    description: editingRecipe?.description || '',
    instructions: editingRecipe?.instructions || '',
    prep_time: editingRecipe?.prep_time?.toString() || '',
    cook_time: editingRecipe?.cook_time?.toString() || '',
    servings: editingRecipe?.servings?.toString() || '1',
    difficulty: editingRecipe?.difficulty || 'easy',
    cuisine_type: editingRecipe?.cuisine_type || '',
    dietary_tags: editingRecipe?.dietary_tags || ''
  });

  const [selectedIngredients, setSelectedIngredients] = useState<RecipeIngredient[]>(
    editingRecipe?.ingredients?.map(ing => ({
      ingredient_id: ing.ingredient_id,
      quantity: ing.quantity,
      unit: ing.unit,
      ingredient: ing.ingredient
    })) || []
  );
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addIngredient = (ingredient: Ingredient) => {
    // Set smart defaults based on the ingredient's serving information
    let defaultQuantity = 100;
    let defaultUnit = 'g';
    
    if (ingredient.serving_unit) {
      // If it's measured in pieces/items
      if (ingredient.serving_unit === 'egg' || 
          ingredient.serving_unit === 'piece' || 
          ingredient.serving_unit === 'item' ||
          ingredient.serving_unit === 'whole') {
        defaultQuantity = 1;
        defaultUnit = 'piece';
      }
      // If it's measured in ml
      else if (ingredient.serving_unit === 'ml' || ingredient.serving_unit === 'fluid ounce') {
        defaultQuantity = ingredient.serving_size || 100;
        defaultUnit = 'ml';
      }
      // If it has a specific serving size in grams
      else if (ingredient.serving_unit === 'g' && ingredient.serving_size && ingredient.serving_size !== 100) {
        defaultQuantity = ingredient.serving_size;
        defaultUnit = 'g';
      }
      // For cups, tbsp, etc.
      else if (['cup', 'tbsp', 'tsp', 'tablespoon', 'teaspoon'].includes(ingredient.serving_unit)) {
        defaultQuantity = 1;
        defaultUnit = ingredient.serving_unit === 'tablespoon' ? 'tbsp' : 
                     ingredient.serving_unit === 'teaspoon' ? 'tsp' : 
                     ingredient.serving_unit;
      }
    }
    
    setSelectedIngredients(prev => [...prev, {
      ingredient_id: ingredient.id,
      quantity: defaultQuantity,
      unit: defaultUnit,
      ingredient: ingredient
    }]);
    setShowIngredientSelector(false);
  };

  const updateIngredientQuantity = (index: number, quantity: number) => {
    setSelectedIngredients(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  const updateIngredientUnit = (index: number, unit: string) => {
    setSelectedIngredients(prev => prev.map((item, i) => 
      i === index ? { ...item, unit } : item
    ));
  };

  const removeIngredient = (index: number) => {
    setSelectedIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const calculateNutrition = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    selectedIngredients.forEach(item => {
      if (item.ingredient) {
        // Calculate based on serving or 100g
        let multiplier = 1;
        
        if (item.unit === 'piece' && item.ingredient.serving_unit === 'egg') {
          // Use original serving values for pieces/eggs
          multiplier = item.quantity;
          totalCalories += item.ingredient.calories_per_serving * multiplier;
          totalProtein += item.ingredient.protein_per_serving * multiplier;
          totalCarbs += item.ingredient.carbs_per_serving * multiplier;
          totalFat += item.ingredient.fat_per_serving * multiplier;
          totalFiber += (item.ingredient.fiber_per_serving || 0) * multiplier;
        } else {
          // Use per-100g values for grams/ml
          multiplier = item.quantity / 100;
          totalCalories += item.ingredient.calories_per_100g * multiplier;
          totalProtein += item.ingredient.protein_per_100g * multiplier;
          totalCarbs += item.ingredient.carbs_per_100g * multiplier;
          totalFat += item.ingredient.fat_per_100g * multiplier;
          totalFiber += (item.ingredient.fiber_per_100g || 0) * multiplier;
        }
      }
    });

    const servings = parseInt(formData.servings) || 1;
    return {
      calories: Math.round(totalCalories / servings),
      protein: Math.round(totalProtein / servings * 10) / 10,
      carbs: Math.round(totalCarbs / servings * 10) / 10,
      fat: Math.round(totalFat / servings * 10) / 10,
      fiber: Math.round(totalFiber / servings * 10) / 10
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Recipe title is required');
      return;
    }

    if (!formData.instructions.trim()) {
      setError('Instructions are required');
      return;
    }

    if (selectedIngredients.length === 0) {
      setError('At least one ingredient is required');
      return;
    }

    try {
      setLoading(true);
      const recipeData = {
        title: formData.title,
        description: formData.description || undefined,
        instructions: formData.instructions,
        prep_time: formData.prep_time ? parseInt(formData.prep_time) : undefined,
        cook_time: formData.cook_time ? parseInt(formData.cook_time) : undefined,
        servings: parseInt(formData.servings),
        difficulty: formData.difficulty || undefined,
        cuisine_type: formData.cuisine_type || undefined,
        dietary_tags: formData.dietary_tags || undefined,
        ingredients: selectedIngredients.map(item => ({
          ingredient_id: item.ingredient_id,
          quantity: item.quantity,
          unit: item.unit
        }))
      };

      console.log('Recipe data being sent:', recipeData);
      console.log('Form data state:', formData);

      let updatedRecipe: Recipe;
      if (editingRecipe) {
        // Update existing recipe
        console.log('Updating recipe with ID:', editingRecipe.id);
        updatedRecipe = await updateRecipe(editingRecipe.id, recipeData);
      } else {
        // Create new recipe
        updatedRecipe = await createRecipe(recipeData);
      }
      
      onRecipeCreated(updatedRecipe);
    } catch (error) {
      setError(`Failed to ${editingRecipe ? 'update' : 'create'} recipe. Please try again.`);
      console.error('Recipe operation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const nutrition = calculateNutrition();

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipe Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter recipe title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the recipe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prep Time (min)
                </label>
                <input
                  type="number"
                  value={formData.prep_time}
                  onChange={(e) => handleInputChange('prep_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cook Time (min)
                </label>
                <input
                  type="number"
                  value={formData.cook_time}
                  onChange={(e) => handleInputChange('cook_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servings *
                </label>
                <input
                  type="number"
                  value={formData.servings}
                  onChange={(e) => handleInputChange('servings', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuisine Type
              </label>
              <input
                type="text"
                value={formData.cuisine_type}
                onChange={(e) => handleInputChange('cuisine_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Italian, Mexican, Asian"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dietary Tags
              </label>
              <input
                type="text"
                value={formData.dietary_tags}
                onChange={(e) => handleInputChange('dietary_tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., vegan, gluten-free, keto"
              />
            </div>
          </div>

          {/* Nutrition Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Nutrition Per Serving</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Calories:</span>
                <span className="font-medium">{nutrition.calories} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Protein:</span>
                <span className="font-medium">{nutrition.protein}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Carbs:</span>
                <span className="font-medium">{nutrition.carbs}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fat:</span>
                <span className="font-medium">{nutrition.fat}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fiber:</span>
                <span className="font-medium">{nutrition.fiber}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instructions *
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => handleInputChange('instructions', e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter step-by-step cooking instructions..."
            required
          />
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Ingredients</h3>
            <button
              type="button"
              onClick={() => setShowIngredientSelector(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Ingredient
            </button>
          </div>

          {/* Selected Ingredients */}
          <div className="space-y-3">
            {selectedIngredients.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium">{item.ingredient?.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({item.ingredient?.category})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateIngredientQuantity(index, parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                    min="0"
                    step="0.1"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => updateIngredientUnit(index, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                    <option value="piece">piece</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (editingRecipe ? 'Updating...' : 'Creating...') : (editingRecipe ? 'Update Recipe' : 'Create Recipe')}
          </button>
        </div>
      </form>

      {/* Ingredient Selector Modal */}
      <IngredientSelector
        isOpen={showIngredientSelector}
        onClose={() => setShowIngredientSelector(false)}
        onIngredientAdded={addIngredient}
        excludeIds={selectedIngredients.map(item => item.ingredient_id)}
      />
    </div>
  );
}