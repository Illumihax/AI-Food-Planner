import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { weekPlansApi } from '@/lib/api'

export interface WeekPlanMeal {
  id: number
  week_plan_id: number
  day_index: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_id: number | null
  food_cache_id: number | null
  recipe_id: number | null
  food_name: string
  description: string | null
  amount: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  created_at: string
}

export interface WeekPlan {
  id: number
  name: string
  start_date: string
  status: 'draft' | 'active' | 'archived'
  notes: string | null
  meals: WeekPlanMeal[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  created_at: string
  updated_at: string
}

export interface WeekPlanSummary {
  id: number
  name: string
  start_date: string
  status: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  meal_count: number
  created_at: string
  updated_at: string
}

export function useWeekPlans(status?: string) {
  return useQuery({
    queryKey: ['week-plans', status],
    queryFn: () => weekPlansApi.getAll(status),
  })
}

export function useDraftWeekPlan() {
  return useQuery({
    queryKey: ['week-plans', 'draft'],
    queryFn: weekPlansApi.getDraft,
  })
}

export function useWeekPlan(id: number | null) {
  return useQuery({
    queryKey: ['week-plans', id],
    queryFn: () => weekPlansApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateWeekPlan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: weekPlansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['week-plans'] })
    },
  })
}

export function useUpdateWeekPlan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => weekPlansApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['week-plans'] })
      queryClient.invalidateQueries({ queryKey: ['week-plans', id] })
    },
  })
}

export function useDeleteWeekPlan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: weekPlansApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['week-plans'] })
    },
  })
}

export function useAddMealToWeekPlan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ planId, data }: { planId: number; data: any }) => 
      weekPlansApi.addMeal(planId, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['week-plans'] })
      queryClient.invalidateQueries({ queryKey: ['week-plans', planId] })
    },
  })
}

export function useRemoveMealFromWeekPlan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ planId, mealId }: { planId: number; mealId: number }) => 
      weekPlansApi.removeMeal(planId, mealId),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['week-plans'] })
      queryClient.invalidateQueries({ queryKey: ['week-plans', planId] })
    },
  })
}

export function useClearDayFromWeekPlan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ planId, dayIndex }: { planId: number; dayIndex: number }) => 
      weekPlansApi.clearDay(planId, dayIndex),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['week-plans'] })
      queryClient.invalidateQueries({ queryKey: ['week-plans', planId] })
    },
  })
}

export function useRegenerateDayInWeekPlan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ planId, data }: { planId: number; data: { day_index: number; meal_type?: string; language?: string } }) => 
      weekPlansApi.regenerateDay(planId, data),
    onSuccess: (data, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['week-plans'] })
      queryClient.invalidateQueries({ queryKey: ['week-plans', planId] })
      return data
    },
  })
}

export function useApplyWeekPlanToDiary() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ planId, targetStartDate }: { planId: number; targetStartDate: string }) => 
      weekPlansApi.applyToDiary(planId, targetStartDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['week-plans'] })
      queryClient.invalidateQueries({ queryKey: ['meals'] })
    },
  })
}

export function useCreateWeekPlanFromAi() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: weekPlansApi.createFromAiPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['week-plans'] })
    },
  })
}
