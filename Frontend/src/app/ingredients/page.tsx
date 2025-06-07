'use client';

import { useState, useEffect } from 'react';
import { Ingredient } from '@/types';
import { fetchIngredients, deleteIngredient } from '@/lib/api';
import IngredientSelector from '@/components/IngredientSelector';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const data = await fetchIngredients();
      setIngredients(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIngredientAdded = (ingredient: Ingredient) => {
    if (editingIngredient) {
      // Update existing ingredient in the list
      setIngredients(prev => prev.map(ing => ing.id === ingredient.id ? ingredient : ing));
      setEditingIngredient(null);
    } else {
      // Add new ingredient to the list
      setIngredients(prev => [...prev, ingredient]);
    }
    setShowIngredientSelector(false);
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setShowIngredientSelector(true);
  };

  const handleCancelEdit = () => {
    setEditingIngredient(null);
    setShowIngredientSelector(false);
  };

  const handleDeleteIngredient = async (ingredientId: number) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return;
    
    try {
      await deleteIngredient(ingredientId);
      setIngredients(prev => prev.filter(ingredient => ingredient.id !== ingredientId));
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      alert('Failed to delete ingredient. Please try again.');
    }
  };

  // Filter ingredients based on search and category
  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ingredient.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || ingredient.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(ingredients.map(ingredient => ingredient.category).filter(Boolean)));

  const formatNutrition = (ingredient: Ingredient) => {
    // Use per-serving values if available, otherwise per-100g
    const calories = ingredient.calories_per_serving || ingredient.calories_per_100g;
    const protein = ingredient.protein_per_serving || ingredient.protein_per_100g;
    const carbs = ingredient.carbs_per_serving || ingredient.carbs_per_100g;
    const fat = ingredient.fat_per_serving || ingredient.fat_per_100g;
    
    const unit = ingredient.serving_unit === 'g' ? `${ingredient.serving_size}g` : 
                 ingredient.serving_unit === 'ml' ? `${ingredient.serving_size}ml` :
                 ingredient.serving_unit || '100g';
    
    return { calories, protein, carbs, fat, unit };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ingredients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ingredients</h1>
          <p className="text-gray-600">Manage your ingredients database</p>
        </div>
        <button
          onClick={() => setShowIngredientSelector(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add Ingredient</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Ingredients
            </label>
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">{ingredients.length}</div>
          <div className="text-sm text-gray-600">Total Ingredients</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">{categories.length}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600">
            {ingredients.filter(i => i.category?.includes('FatSecret') || i.category === 'API Import').length}
          </div>
          <div className="text-sm text-gray-600">From API</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-orange-600">{filteredIngredients.length}</div>
          <div className="text-sm text-gray-600">Filtered Results</div>
        </div>
      </div>

      {/* Ingredients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredIngredients.map(ingredient => {
          const nutrition = formatNutrition(ingredient);
          return (
            <div key={ingredient.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {ingredient.name}
                  </h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditIngredient(ingredient)}
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                      title="Edit ingredient"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteIngredient(ingredient.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete ingredient"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                {ingredient.category && (
                  <div className="mb-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {ingredient.category}
                    </span>
                  </div>
                )}
                
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Calories:</span>
                    <span className="font-medium">{Math.round(nutrition.calories)} / {nutrition.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protein:</span>
                    <span className="font-medium">{nutrition.protein.toFixed(1)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carbs:</span>
                    <span className="font-medium">{nutrition.carbs.toFixed(1)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fat:</span>
                    <span className="font-medium">{nutrition.fat.toFixed(1)}g</span>
                  </div>
                </div>
                
                {ingredient.serving_description && (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                    {ingredient.serving_description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredIngredients.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🥬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || selectedCategory ? 'No ingredients found' : 'No ingredients yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || selectedCategory 
              ? 'Try adjusting your search or filter criteria' 
              : 'Start building your ingredients database by adding your first ingredient'
            }
          </p>
          {!searchQuery && !selectedCategory && (
            <button
              onClick={() => setShowIngredientSelector(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Ingredient
            </button>
          )}
        </div>
      )}

      {/* Ingredient Selector Modal */}
      <IngredientSelector
        isOpen={showIngredientSelector}
        onClose={handleCancelEdit}
        onIngredientAdded={handleIngredientAdded}
        excludeIds={[]} // No exclusions needed for this page
        editingIngredient={editingIngredient}
      />
    </div>
  );
} 