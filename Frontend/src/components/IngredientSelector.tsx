'use client';

import { useState, useEffect } from 'react';
import { Ingredient } from '@/types';
import { searchIngredients, getFatSecretOptions, saveSelectedIngredient, updateIngredient } from '@/lib/api';

interface IngredientSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onIngredientAdded: (ingredient: Ingredient) => void;
  excludeIds: number[];
  editingIngredient?: Ingredient | null;
}

interface FatSecretOption {
  name: string;
  calories: number;
  protein_g: number;
  carbohydrates_total_g: number;
  fat_total_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  serving_size_g: number;
  serving_unit: string;
  serving_description: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  sugar_per_100g: number;
  sodium_per_100g: number;
  category: string;
}

export default function IngredientSelector({ 
  isOpen, 
  onClose, 
  onIngredientAdded, 
  excludeIds, 
  editingIngredient 
}: IngredientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dbIngredients, setDbIngredients] = useState<Ingredient[]>([]);
  const [fatSecretOptions, setFatSecretOptions] = useState<FatSecretOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<FatSecretOption | null>(null);
  const [editedIngredient, setEditedIngredient] = useState<FatSecretOption | null>(
    editingIngredient ? {
      name: editingIngredient.name,
      calories: editingIngredient.calories_per_serving,
      protein_g: editingIngredient.protein_per_serving,
      carbohydrates_total_g: editingIngredient.carbs_per_serving,
      fat_total_g: editingIngredient.fat_per_serving,
      fiber_g: editingIngredient.fiber_per_serving || 0,
      sugar_g: editingIngredient.sugar_per_serving || 0,
      sodium_mg: editingIngredient.sodium_per_serving || 0,
      serving_size_g: editingIngredient.serving_size,
      serving_unit: editingIngredient.serving_unit,
      serving_description: editingIngredient.serving_description || '',
      calories_per_100g: editingIngredient.calories_per_100g,
      protein_per_100g: editingIngredient.protein_per_100g,
      carbs_per_100g: editingIngredient.carbs_per_100g,
      fat_per_100g: editingIngredient.fat_per_100g,
      fiber_per_100g: editingIngredient.fiber_per_100g || 0,
      sugar_per_100g: editingIngredient.sugar_per_100g || 0,
      sodium_per_100g: editingIngredient.sodium_per_100g || 0,
      category: editingIngredient.category || ''
    } : null
  );
  
  const [searchLoading, setSearchLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showApiOptions, setShowApiOptions] = useState(false);
  const [showEditForm, setShowEditForm] = useState(!!editingIngredient);

  // Search database ingredients
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchDatabaseIngredients();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setDbIngredients([]);
    }
  }, [searchQuery]);

  const searchDatabaseIngredients = async () => {
    try {
      setSearchLoading(true);
      const ingredients = await searchIngredients(searchQuery.trim());
      setDbIngredients(ingredients.filter(ing => !excludeIds.includes(ing.id)));
    } catch (error) {
      console.error('Failed to search ingredients:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const searchFatSecretAPI = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setApiLoading(true);
      const result = await getFatSecretOptions(searchQuery.trim());
      setFatSecretOptions(result.options);
      setShowApiOptions(true);
    } catch (error) {
      console.error('Failed to fetch FatSecret options:', error);
    } finally {
      setApiLoading(false);
    }
  };

  const selectOption = (option: FatSecretOption) => {
    setSelectedOption(option);
    setEditedIngredient({ ...option });
    setShowEditForm(true);
  };

  const handleInputChange = (field: keyof FatSecretOption, value: string | number) => {
    if (!editedIngredient) return;
    
    setEditedIngredient(prev => ({
      ...prev!,
      [field]: typeof value === 'string' ? value : parseFloat(value.toString()) || 0
    }));
  };

  const saveIngredient = async () => {
    if (!editedIngredient) return;
    
    try {
      setSaveLoading(true);
      let savedIngredient: Ingredient;
      
      if (editingIngredient) {
        // Update existing ingredient
        const updateData = {
          name: editedIngredient.name,
          calories_per_serving: editedIngredient.calories,
          protein_per_serving: editedIngredient.protein_g,
          carbs_per_serving: editedIngredient.carbohydrates_total_g,
          fat_per_serving: editedIngredient.fat_total_g,
          fiber_per_serving: editedIngredient.fiber_g,
          sugar_per_serving: editedIngredient.sugar_g,
          sodium_per_serving: editedIngredient.sodium_mg,
          serving_size: editedIngredient.serving_size_g,
          serving_unit: editedIngredient.serving_unit,
          serving_description: editedIngredient.serving_description,
          calories_per_100g: editedIngredient.calories_per_100g,
          protein_per_100g: editedIngredient.protein_per_100g,
          carbs_per_100g: editedIngredient.carbs_per_100g,
          fat_per_100g: editedIngredient.fat_per_100g,
          fiber_per_100g: editedIngredient.fiber_per_100g,
          sugar_per_100g: editedIngredient.sugar_per_100g,
          sodium_per_100g: editedIngredient.sodium_per_100g,
          category: editedIngredient.category
        };
        savedIngredient = await updateIngredient(editingIngredient.id, updateData);
      } else {
        // Create new ingredient
        savedIngredient = await saveSelectedIngredient(editedIngredient);
      }
      
      onIngredientAdded(savedIngredient);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to save ingredient:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setDbIngredients([]);
    setFatSecretOptions([]);
    setSelectedOption(null);
    setEditedIngredient(null);
    setShowApiOptions(false);
    setShowEditForm(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium">
            {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
          </h4>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {!showEditForm && (
          <>
            {/* Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ingredients (try 'chicken', 'apple', etc.)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                autoFocus
              />
              {(searchLoading || apiLoading) && (
                <div className="absolute right-3 top-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Database Results */}
            {dbIngredients.length > 0 && (
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-3">Existing Ingredients</h5>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dbIngredients.map(ingredient => (
                    <button
                      key={ingredient.id}
                      onClick={() => onIngredientAdded(ingredient)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="font-medium">{ingredient.name}</div>
                      <div className="text-sm text-gray-500">
                        {ingredient.category} • {ingredient.calories_per_serving} cal/{ingredient.serving_unit === 'g' ? `${ingredient.serving_size}g` : ingredient.serving_unit}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FatSecret Search Button */}
            {searchQuery.trim().length >= 2 && !showApiOptions && (
              <div className="mb-4">
                <button
                  onClick={searchFatSecretAPI}
                  disabled={apiLoading}
                  className="w-full p-3 border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-lg disabled:opacity-50"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {apiLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <span className="text-blue-600">🔍</span>
                    )}
                    <span className="font-medium text-blue-700">
                      {apiLoading ? 'Searching FatSecret database...' : `Search "${searchQuery}" in FatSecret database`}
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* FatSecret Options */}
            {showApiOptions && fatSecretOptions.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium text-gray-900">FatSecret Results</h5>
                  <button
                    onClick={() => setShowApiOptions(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Hide Results
                  </button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {fatSecretOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => selectOption(option)}
                      className="w-full text-left p-4 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300"
                    >
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {option.calories} cal • {option.protein_g}g protein • {option.carbohydrates_total_g}g carbs • {option.fat_total_g}g fat
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {option.serving_description || `Per ${option.serving_size_g}${option.serving_unit}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showApiOptions && fatSecretOptions.length === 0 && !apiLoading && (
              <div className="text-center py-4 text-gray-500">
                No results found in FatSecret database
              </div>
            )}
          </>
        )}

        {/* Edit Form */}
        {showEditForm && editedIngredient && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h5 className="font-medium text-gray-900">Edit Ingredient Details</h5>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Search
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editedIngredient.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editedIngredient.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., protein, vegetables, grains"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serving Size
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={editedIngredient.serving_size_g}
                    onChange={(e) => handleInputChange('serving_size_g', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    step="0.1"
                  />
                  <input
                    type="text"
                    value={editedIngredient.serving_unit}
                    onChange={(e) => handleInputChange('serving_unit', e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="g, ml, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serving Description
                </label>
                <input
                  type="text"
                  value={editedIngredient.serving_description}
                  onChange={(e) => handleInputChange('serving_description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Per 1 egg, Per 100g"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calories (per serving)
                </label>
                <input
                  type="number"
                  value={editedIngredient.calories}
                  onChange={(e) => handleInputChange('calories', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protein (g per serving)
                </label>
                <input
                  type="number"
                  value={editedIngredient.protein_g}
                  onChange={(e) => handleInputChange('protein_g', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carbs (g per serving)
                </label>
                <input
                  type="number"
                  value={editedIngredient.carbohydrates_total_g}
                  onChange={(e) => handleInputChange('carbohydrates_total_g', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fat (g per serving)
                </label>
                <input
                  type="number"
                  value={editedIngredient.fat_total_g}
                  onChange={(e) => handleInputChange('fat_total_g', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiber (g per serving)
                </label>
                <input
                  type="number"
                  value={editedIngredient.fiber_g}
                  onChange={(e) => handleInputChange('fiber_g', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sugar (g per serving)
                </label>
                <input
                  type="number"
                  value={editedIngredient.sugar_g}
                  onChange={(e) => handleInputChange('sugar_g', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sodium (mg per serving)
                </label>
                <input
                  type="number"
                  value={editedIngredient.sodium_mg}
                  onChange={(e) => handleInputChange('sodium_mg', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            {/* Nutrition Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h6 className="font-medium text-gray-900 mb-2">Nutrition Preview</h6>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Calories:</span>
                  <div className="font-medium">{editedIngredient.calories}</div>
                </div>
                <div>
                  <span className="text-gray-600">Protein:</span>
                  <div className="font-medium">{editedIngredient.protein_g}g</div>
                </div>
                <div>
                  <span className="text-gray-600">Carbs:</span>
                  <div className="font-medium">{editedIngredient.carbohydrates_total_g}g</div>
                </div>
                <div>
                  <span className="text-gray-600">Fat:</span>
                  <div className="font-medium">{editedIngredient.fat_total_g}g</div>
                </div>
                <div>
                  <span className="text-gray-600">Fiber:</span>
                  <div className="font-medium">{editedIngredient.fiber_g}g</div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={saveLoading}
              >
                Cancel
              </button>
              <button
                onClick={saveIngredient}
                disabled={saveLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saveLoading 
                  ? (editingIngredient ? 'Updating...' : 'Saving...') 
                  : (editingIngredient ? 'Update Ingredient' : 'Save Ingredient')
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 