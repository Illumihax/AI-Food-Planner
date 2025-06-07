export interface Ingredient {
  id: number;
  name: string;
  
  // Original serving nutrition
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  fiber_per_serving?: number;
  sugar_per_serving?: number;
  sodium_per_serving?: number;
  
  // Serving information
  serving_size: number;
  serving_unit: string;
  serving_description?: string;
  
  // Legacy per-100g values (for backward compatibility)
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  
  category?: string;
}

export interface RecipeIngredient {
  ingredient_id: number;
  quantity: number;
  unit: string;
  ingredient?: Ingredient;
}

export interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Recipe {
  id: number;
  title: string;
  description?: string;
  instructions: string;
  prep_time?: number;
  cook_time?: number;
  servings: number;
  difficulty?: string;
  cuisine_type?: string;
  dietary_tags?: string;
  created_at: string;
  updated_at: string;
  is_ai_generated: boolean;
  owner_id: number;
  ingredients: RecipeIngredient[];
  nutrition?: RecipeNutrition;
}

export interface MealPlanEntry {
  id: number;
  meal_plan_id: number;
  date: string;
  meal_type: string;
  recipe_id: number;
  servings: number;
  notes?: string;
  recipe?: Recipe;
}

export interface MealPlan {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  entries: MealPlanEntry[];
}

export interface DayNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface WeeklyNutrition {
  days: DayNutrition[];
  weekly_totals: DayNutrition;
  weekly_averages: DayNutrition;
}

export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
  is_active: boolean;
}

export interface NutritionGoal {
  id: number;
  daily_calories?: number;
  daily_protein?: number;
  daily_carbs?: number;
  daily_fat?: number;
  daily_fiber?: number;
  created_at: string;
  updated_at: string;
  user_id: number;
} 