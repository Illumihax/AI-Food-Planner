'use client';

import { useState, useEffect } from 'react';
import { MealPlan, Recipe, MealPlanEntry } from '@/types';
import { fetchMealPlanForWeek, fetchRecipes, createMealPlanForWeek, assignMealToSlot as apiAssignMealToSlot } from '@/lib/api';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import WeeklyPlanGrid from '@/components/WeeklyPlanGrid';
import MealSelector from '@/components/MealSelector';
import MealDetailModal from '@/components/MealDetailModal';
import RecipeCreator from '@/components/RecipeCreator';

export default function WeeklyPlanPage() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Monday start
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    mealType: string;
  } | null>(null);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [showRecipeCreator, setShowRecipeCreator] = useState(false);
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [selectedMealEntry, setSelectedMealEntry] = useState<MealPlanEntry | null>(null);

  useEffect(() => {
    loadWeekData();
  }, [currentWeek]);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const recipesData = await fetchRecipes();
      setRecipes(recipesData);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  };

  const loadWeekData = async () => {
    try {
      setLoading(true);
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      let weekMealPlan = await fetchMealPlanForWeek(weekStart);
      
      // If no meal plan exists for this week, create a temporary one for display
      if (!weekMealPlan) {
        try {
          weekMealPlan = await createMealPlanForWeek(weekStart);
        } catch (error) {
          // If creation fails, create a temporary meal plan structure for display
          console.log('Could not create meal plan, using temporary structure');
          weekMealPlan = {
            id: 0, // Temporary ID
            name: `Week of ${format(currentWeek, 'MMM d, yyyy')}`,
            start_date: weekStart,
            end_date: format(addWeeks(currentWeek, 1), 'yyyy-MM-dd'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: 1,
            entries: []
          };
        }
      }
      
      setMealPlan(weekMealPlan);
    } catch (error) {
      console.error('Failed to load week data:', error);
      // Even on error, show empty week structure
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      setMealPlan({
        id: 0, // Temporary ID
        name: `Week of ${format(currentWeek, 'MMM d, yyyy')}`,
        start_date: weekStart,
        end_date: format(addWeeks(currentWeek, 1), 'yyyy-MM-dd'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 1,
        entries: []
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentWeek(prev => subWeeks(prev, 1));
    } else {
      setCurrentWeek(prev => addWeeks(prev, 1));
    }
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleSlotClick = (date: string, mealType: string, action: 'assign' | 'create') => {
    setSelectedSlot({ date, mealType });
    if (action === 'assign') {
      setShowMealSelector(true);
    } else {
      setShowRecipeCreator(true);
    }
  };

  const handleMealAssigned = async () => {
    // Reload the meal plan after a meal is assigned
    await loadWeekData();
    setSelectedSlot(null);
    setShowMealSelector(false);
    setShowRecipeCreator(false);
  };

  const handleRecipeCreated = async (newRecipe: Recipe) => {
    // Add to recipes list and assign if there's a selected slot
    setRecipes(prev => [...prev, newRecipe]);
    
    if (selectedSlot && mealPlan) {
      await assignMealToSlot(newRecipe.id, 1.0);
    }
    
    setShowRecipeCreator(false);
  };

  const assignMealToSlot = async (recipeId: number, servings: number) => {
    if (!selectedSlot) return;

    try {
      // Use the new simplified API that handles meal plan creation automatically
      await apiAssignMealToSlot(selectedSlot.date, selectedSlot.mealType, recipeId, servings);
      await handleMealAssigned();
    } catch (error) {
      console.error('Failed to assign meal:', error);
      throw error; // Re-throw so the MealSelector can handle it
    }
  };

  const handleRemoveMeal = async (entryId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/meal-plans/entries/${entryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadWeekData();
      }
    } catch (error) {
      console.error('Failed to remove meal:', error);
    }
  };

  const handleMealClick = (entry: MealPlanEntry) => {
    setSelectedMealEntry(entry);
    setShowMealDetail(true);
  };

  const isCurrentWeek = () => {
    const thisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(currentWeek, 'yyyy-MM-dd') === format(thisWeek, 'yyyy-MM-dd');
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
      {/* Header with navigation */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title="Previous week"
          >
            ←
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Week of {format(currentWeek, 'MMM d, yyyy')}
            </h1>
            {!isCurrentWeek() && (
              <button
                onClick={goToCurrentWeek}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Go to current week
              </button>
            )}
          </div>
          
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title="Next week"
          >
            →
          </button>
        </div>
      </div>

      {/* Weekly Plan Grid */}
      <WeeklyPlanGrid
        mealPlan={mealPlan}
        onSlotClick={handleSlotClick}
        onRemoveMeal={handleRemoveMeal}
        onMealClick={handleMealClick}
      />

      {/* Meal Selector Modal */}
      {showMealSelector && selectedSlot && mealPlan && (
        <MealSelector
          isOpen={showMealSelector}
          onClose={() => {
            setShowMealSelector(false);
            setSelectedSlot(null);
          }}
          recipes={recipes}
          selectedSlot={selectedSlot}
          onMealAssigned={assignMealToSlot}
        />
      )}

      {/* Recipe Creator Modal */}
      {showRecipeCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <RecipeCreator
              onRecipeCreated={handleRecipeCreated}
              onCancel={() => {
                setShowRecipeCreator(false);
                setSelectedSlot(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Meal Detail Modal */}
      <MealDetailModal
        isOpen={showMealDetail}
        onClose={() => {
          setShowMealDetail(false);
          setSelectedMealEntry(null);
        }}
        entry={selectedMealEntry}
      />
    </div>
  );
} 