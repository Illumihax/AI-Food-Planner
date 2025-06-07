'use client';

import { useState, useEffect } from 'react';
import { WeeklyNutrition } from '@/types';
import { fetchMealPlanNutrition } from '@/lib/api';

interface NutritionSummaryProps {
  mealPlanId: number;
}

export default function NutritionSummary({ mealPlanId }: NutritionSummaryProps) {
  const [nutrition, setNutrition] = useState<WeeklyNutrition | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'daily' | 'summary'>('summary');

  useEffect(() => {
    loadNutrition();
  }, [mealPlanId]);

  const loadNutrition = async () => {
    try {
      setLoading(true);
      const data = await fetchMealPlanNutrition(mealPlanId);
      setNutrition(data);
    } catch (error) {
      console.error('Failed to load nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    return Math.round(value * 10) / 10;
  };

  const NutritionBar = ({ label, value, color, unit = 'g' }: {
    label: string;
    value: number;
    color: string;
    unit?: string;
  }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{formatNumber(value)}{unit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(100, (value / 100) * 100)}%` }}
        ></div>
      </div>
    </div>
  );

  const NutritionCard = ({ data, title }: {
    data: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
    title: string;
  }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
      <div className="space-y-3">
        <NutritionBar 
          label="Calories" 
          value={data.calories} 
          color="bg-orange-500" 
          unit=" kcal" 
        />
        <NutritionBar 
          label="Protein" 
          value={data.protein} 
          color="bg-red-500" 
        />
        <NutritionBar 
          label="Carbs" 
          value={data.carbs} 
          color="bg-blue-500" 
        />
        <NutritionBar 
          label="Fat" 
          value={data.fat} 
          color="bg-yellow-500" 
        />
        <NutritionBar 
          label="Fiber" 
          value={data.fiber} 
          color="bg-green-500" 
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!nutrition) {
    return (
      <div className="text-center text-gray-500 py-4">
        No nutrition data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setView('summary')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            view === 'summary' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setView('daily')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            view === 'daily' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Daily
        </button>
      </div>

      {/* Content */}
      {view === 'summary' ? (
        <div className="space-y-4">
          <NutritionCard 
            data={nutrition.weekly_averages} 
            title="Daily Average" 
          />
          <NutritionCard 
            data={nutrition.weekly_totals} 
            title="Weekly Total" 
          />
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {nutrition.days.map((day, index) => (
            <div key={day.date} className="border rounded-lg p-3">
              <h5 className="font-medium text-gray-900 mb-2">
                {new Date(day.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-600">Calories:</span>
                  <span className="ml-1 font-medium">{formatNumber(day.calories)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Protein:</span>
                  <span className="ml-1 font-medium">{formatNumber(day.protein)}g</span>
                </div>
                <div>
                  <span className="text-gray-600">Carbs:</span>
                  <span className="ml-1 font-medium">{formatNumber(day.carbs)}g</span>
                </div>
                <div>
                  <span className="text-gray-600">Fat:</span>
                  <span className="ml-1 font-medium">{formatNumber(day.fat)}g</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 