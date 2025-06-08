'use client';

import { MealPlan, MealPlanEntry } from '@/types';
import { format, addDays } from 'date-fns';

interface WeeklyPlanGridProps {
  mealPlan: MealPlan;
  onSlotClick: (date: string, mealType: string, action: 'assign' | 'create') => void;
  onRemoveMeal: (entryId: number) => void;
  onMealClick: (entry: MealPlanEntry) => void;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_TYPE_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack'
};

export default function WeeklyPlanGrid({
  mealPlan,
  onSlotClick,
  onRemoveMeal,
  onMealClick
}: WeeklyPlanGridProps) {
  // Generate week dates (Monday to Sunday)
  const startDate = new Date(mealPlan.start_date);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  // Group entries by date and meal type
  const entriesByDateAndMeal = mealPlan.entries.reduce((acc, entry) => {
    const entryDate = new Date(entry.date);
    const dateKey = format(entryDate, 'yyyy-MM-dd');
    const mealKey = `${dateKey}-${entry.meal_type}`;
    
    if (!acc[mealKey]) {
      acc[mealKey] = [];
    }
    acc[mealKey].push(entry);
    return acc;
  }, {} as Record<string, MealPlanEntry[]>);

  const getMealEntries = (date: Date, mealType: string): MealPlanEntry[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const mealKey = `${dateKey}-${mealType}`;
    return entriesByDateAndMeal[mealKey] || [];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header with days of the week */}
          <div className="grid grid-cols-8 bg-gray-50 border-b">
            <div className="p-4 font-medium text-gray-500 text-sm"></div>
            {weekDates.map((date) => (
              <div key={date.toISOString()} className="p-4 text-center border-l border-gray-200">
                <div className="font-semibold text-gray-900">
                  {format(date, 'EEE')}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {format(date, 'MMM d')}
                </div>
              </div>
            ))}
          </div>

          {/* Meal rows */}
          {MEAL_TYPES.map((mealType, mealIndex) => (
            <div key={mealType} className={`grid grid-cols-8 ${mealIndex < MEAL_TYPES.length - 1 ? 'border-b border-gray-200' : ''}`}>
              {/* Meal type label */}
              <div className="p-4 bg-gray-50 flex items-center justify-end border-r border-gray-200">
                <span className="font-semibold text-gray-700 text-sm">
                  {MEAL_TYPE_LABELS[mealType as keyof typeof MEAL_TYPE_LABELS]}
                </span>
              </div>

              {/* Meal slots for each day */}
              {weekDates.map((date, dayIndex) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const entries = getMealEntries(date, mealType);

                return (
                  <div
                    key={`${dateKey}-${mealType}`}
                    className={`p-3 min-h-[120px] transition-colors ${dayIndex < weekDates.length - 1 ? 'border-r border-gray-200' : ''} hover:bg-gray-50`}
                  >
                    {entries.length === 0 ? (
                      // Empty slot with action buttons
                      <div className="flex flex-col space-y-2 h-full justify-center">
                        <button
                          onClick={() => onSlotClick(dateKey, mealType, 'assign')}
                          className="w-full py-2 px-3 text-xs bg-blue-50 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          Assign Meal
                        </button>
                        <button
                          onClick={() => onSlotClick(dateKey, mealType, 'create')}
                          className="w-full py-2 px-3 text-xs bg-green-50 text-green-700 rounded-md border border-green-200 hover:bg-green-100 transition-colors"
                        >
                          Create & Assign
                        </button>
                      </div>
                                        ) : (
                      // Existing meals
                      <div className="space-y-2">
                        {entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm group hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => onMealClick(entry)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 mb-2">
                                  {entry.recipe?.title || 'Unknown Recipe'}
                                </div>
                                <div className="flex flex-wrap gap-1 text-xs">
                                  {entry.servings !== 1 && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                      {entry.servings} serving{entry.servings !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {entry.recipe?.nutrition && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                                      {Math.round(entry.recipe.nutrition.calories * entry.servings)} cal
                                    </span>
                                  )}
                                  {entry.recipe?.cuisine_type && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                      {entry.recipe.cuisine_type}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveMeal(entry.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm p-1 transition-opacity ml-2"
                                title="Remove meal"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 