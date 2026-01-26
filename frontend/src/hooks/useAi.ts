import { useMutation } from '@tanstack/react-query'
import { aiApi } from '@/lib/api'

export function useGenerateMealPlan() {
  return useMutation({
    mutationFn: aiApi.generateMealPlan,
  })
}

export function useSuggestRecipes() {
  return useMutation({
    mutationFn: aiApi.suggestRecipes,
  })
}

export function useAiChat() {
  return useMutation({
    mutationFn: aiApi.chat,
  })
}
