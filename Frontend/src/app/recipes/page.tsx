'use client';

import { useState, useEffect } from 'react';
import { Recipe, Ingredient } from '@/types';
import { fetchRecipes, deleteRecipe, fetchIngredients } from '@/lib/api';
import RecipeCreator from '@/components/RecipeCreator';
import MultiSelect from '@/components/MultiSelect';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecipeCreator, setShowRecipeCreator] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recipesData, ingredientsData] = await Promise.all([
        fetchRecipes(),
        fetchIngredients()
      ]);
      setRecipes(recipesData);
      setIngredients(ingredientsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeCreated = (recipe: Recipe) => {
    if (editingRecipe) {
      // Update existing recipe in the list
      setRecipes(prev => prev.map(r => r.id === recipe.id ? recipe : r));
      setEditingRecipe(null);
    } else {
      // Add new recipe to the list
      setRecipes(prev => [...prev, recipe]);
    }
    setShowRecipeCreator(false);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowRecipeCreator(true);
  };

  const handleCancelEdit = () => {
    setEditingRecipe(null);
    setShowRecipeCreator(false);
  };

  const handleDeleteRecipe = async (recipeId: number) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;
    
    try {
      await deleteRecipe(recipeId);
      setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      alert('Failed to delete recipe. Please try again.');
    }
  };

  // Filter recipes based on search, category, dietary tags, and ingredients
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.cuisine_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || recipe.cuisine_type === selectedCategory;
    
    const matchesDietaryTags = selectedDietaryTags.length === 0 || 
      selectedDietaryTags.every(tag => 
        recipe.dietary_tags?.toLowerCase().includes(tag.toLowerCase())
      );
    
    const matchesIngredients = selectedIngredients.length === 0 ||
      selectedIngredients.every(ingredientName =>
        recipe.ingredients?.some(ri => 
          ri.ingredient?.name?.toLowerCase().includes(ingredientName.toLowerCase())
        )
      );
    
    return matchesSearch && matchesCategory && matchesDietaryTags && matchesIngredients;
  });

  // Get unique categories
  const categories = Array.from(new Set(recipes.map(recipe => recipe.cuisine_type).filter(Boolean)));
  
  // Get unique dietary tags
  const allDietaryTags = Array.from(new Set(
    recipes.flatMap(recipe => 
      recipe.dietary_tags?.split(',').map(tag => tag.trim()).filter(Boolean) || []
    )
  ));
  
  // Get unique ingredient names
  const allIngredientNames = Array.from(new Set(
    recipes.flatMap(recipe => 
      recipe.ingredients?.map(ri => ri.ingredient?.name).filter((name): name is string => Boolean(name)) || []
    )
  ));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recipes</h1>
          <p className="text-gray-600">Manage your recipe collection</p>
        </div>
        <button
          onClick={() => setShowRecipeCreator(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Create Recipe</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Recipes
            </label>
            <input
              type="text"
              placeholder="Search by title, description, or cuisine..."
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Tags
            </label>
            <MultiSelect
              options={allDietaryTags}
              selectedValues={selectedDietaryTags}
              onChange={setSelectedDietaryTags}
              placeholder="All dietary tags"
              searchPlaceholder="Search dietary tags..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingredients
            </label>
            <MultiSelect
              options={allIngredientNames}
              selectedValues={selectedIngredients}
              onChange={setSelectedIngredients}
              placeholder="All ingredients"
              searchPlaceholder="Search ingredients..."
            />
          </div>
        </div>
        
        {/* Active Filters Summary */}
        {(selectedDietaryTags.length > 0 || selectedIngredients.length > 0 || selectedCategory || searchQuery) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredRecipes.length} of {recipes.length} recipes
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedDietaryTags([]);
                  setSelectedIngredients([]);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => (
          <div key={recipe.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {recipe.title}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditRecipe(recipe)}
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                    title="Edit recipe"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete recipe"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {recipe.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {recipe.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.difficulty && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty}
                  </span>
                )}
                {recipe.cuisine_type && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {recipe.cuisine_type}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  {recipe.prep_time && (
                    <span>⏱️ {recipe.prep_time}min prep</span>
                  )}
                  {recipe.cook_time && (
                    <span>🔥 {recipe.cook_time}min cook</span>
                  )}
                </div>
                <span>🍽️ {recipe.servings} servings</span>
              </div>
              
              <div className="text-xs text-gray-400">
                Created {new Date(recipe.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👨‍🍳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || selectedCategory ? 'No recipes found' : 'No recipes yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || selectedCategory 
              ? 'Try adjusting your search or filter criteria' 
              : 'Start building your recipe collection by creating your first recipe'
            }
          </p>
          {!searchQuery && !selectedCategory && (
            <button
              onClick={() => setShowRecipeCreator(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Recipe
            </button>
          )}
        </div>
      )}

      {/* Recipe Creator Modal */}
      {showRecipeCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <RecipeCreator
              onRecipeCreated={handleRecipeCreated}
              onCancel={handleCancelEdit}
              editingRecipe={editingRecipe}
            />
          </div>
        </div>
      )}
    </div>
  );
} 