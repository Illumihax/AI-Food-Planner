'use client';

import { useState } from 'react';
import { Recipe } from '@/types';

interface RecipeSelectorProps {
  recipes: Recipe[];
  onRecipeSelect: (recipe: Recipe) => void;
  onCancel: () => void;
}

export default function RecipeSelector({
  recipes,
  onRecipeSelect,
  onCancel
}: RecipeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter recipes based on search term and category
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      recipe.cuisine_type === selectedCategory ||
      recipe.difficulty === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories from recipes
  const categories = ['all', ...new Set([
    ...recipes.map(r => r.cuisine_type).filter(Boolean),
    ...recipes.map(r => r.difficulty).filter(Boolean)
  ])];

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTotalTime = (recipe: Recipe) => {
    const prep = recipe.prep_time || 0;
    const cook = recipe.cook_time || 0;
    return prep + cook;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Recipe List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredRecipes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recipes found</p>
        ) : (
          filteredRecipes.map(recipe => (
            <div
              key={recipe.id}
              onClick={() => onRecipeSelect(recipe)}
              className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{recipe.title}</h4>
                {recipe.difficulty && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty}
                  </span>
                )}
              </div>
              
              {recipe.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {recipe.description}
                </p>
              )}
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex space-x-4">
                  {getTotalTime(recipe) > 0 && (
                    <span>⏱️ {getTotalTime(recipe)} min</span>
                  )}
                  <span>🍽️ {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                  {recipe.cuisine_type && (
                    <span>🌍 {recipe.cuisine_type}</span>
                  )}
                </div>
                {recipe.is_ai_generated && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    AI Generated
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-3 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 