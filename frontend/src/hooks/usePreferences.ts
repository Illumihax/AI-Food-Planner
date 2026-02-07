import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { preferencesApi } from '@/lib/api'

export interface DietaryRestrictions {
  vegan: boolean
  vegetarian: boolean
  pescatarian: boolean
  gluten_free: boolean
  dairy_free: boolean
  nut_free: boolean
  halal: boolean
  kosher: boolean
  low_carb: boolean
  keto: boolean
}

export interface UserPreferences {
  id: number
  liked_foods: string[]
  disliked_foods: string[]
  allergies: string[]
  dietary_restrictions: DietaryRestrictions
  budget_preference: 'low' | 'medium' | 'high' | null
  max_cooking_time_minutes: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PreferencesUpdate {
  liked_foods?: string[]
  disliked_foods?: string[]
  allergies?: string[]
  dietary_restrictions?: DietaryRestrictions
  budget_preference?: 'low' | 'medium' | 'high' | null
  max_cooking_time_minutes?: number | null
  notes?: string | null
}

export function usePreferences() {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: preferencesApi.get,
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: preferencesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
    },
  })
}
