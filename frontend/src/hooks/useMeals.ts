import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mealsApi } from '@/lib/api'

export function useDailyMeals(date: string) {
  return useQuery({
    queryKey: ['meals', 'daily', date],
    queryFn: () => mealsApi.getDaily(date),
  })
}

export function useCreateMeal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mealsApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meals', 'daily', variables.date] })
    },
  })
}

export function useAddMealEntry() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ mealId, data }: { mealId: number; data: any }) =>
      mealsApi.addEntry(mealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
    },
  })
}

export function useRemoveMealEntry() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ mealId, entryId }: { mealId: number; entryId: number }) =>
      mealsApi.removeEntry(mealId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
    },
  })
}
