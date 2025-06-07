'use client';

import { MealPlan, MealPlanEntry } from '@/types';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

interface WeeklyPlannerViewProps {
  mealPlan: MealPlan;
  onSlotClick: (date: string, mealType: string) => void;
  onRemoveMeal: (entryId: number) => void;
  selectedSlot: { date: string; mealType: string } | null;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_TYPE_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack'
};

export default function WeeklyPlannerView({
  mealPlan,
  onSlotClick,
  onRemoveMeal,
  selectedSlot
}: WeeklyPlannerViewProps) {
  // Generate week dates
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

  const isSlotSelected = (date: Date, mealType: string): boolean => {
    if (!selectedSlot) return false;
    const dateKey = format(date, 'yyyy-MM-dd');
    return selectedSlot.date === dateKey && selectedSlot.mealType === mealType;
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with days of the week */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="font-medium text-gray-500 text-sm"></div>
          {weekDates.map((date) => (
            <div key={date.toISOString()} className="text-center">
              <div className="font-medium text-gray-900">
                {format(date, 'EEE')}
              </div>
              <div className="text-sm text-gray-500">
                {format(date, 'MMM d')}
              </div>
            </div>
          ))}
        </div>

        {/* Meal rows */}
        {MEAL_TYPES.map((mealType) => (
          <div key={mealType} className="grid grid-cols-8 gap-2 mb-3">
            {/* Meal type label */}
            <div className="flex items-center justify-end pr-4">
              <span className="font-medium text-gray-700 text-sm">
                {MEAL_TYPE_LABELS[mealType as keyof typeof MEAL_TYPE_LABELS]}
              </span>
            </div>

            {/* Meal slots for each day */}
            {weekDates.map((date) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const entries = getMealEntries(date, mealType);
              const isSelected = isSlotSelected(date, mealType);

              return (
                <div
                  key={`${dateKey}-${mealType}`}
                  className={`
                    min-h-[80px] border-2 border-dashed rounded-lg p-2 cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => onSlotClick(dateKey, mealType)}
                >
                  {entries.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                      Click to add
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-white rounded border p-2 shadow-sm group hover:shadow-md transition-shadow"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-900 truncate">
                                {entry.recipe?.title || 'Unknown Recipe'}
                              </div>
                              {entry.servings !== 1 && (
                                <div className="text-xs text-gray-500">
                                  {entry.servings} serving{entry.servings !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveMeal(entry.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs p-1 transition-opacity"
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
  );
} 