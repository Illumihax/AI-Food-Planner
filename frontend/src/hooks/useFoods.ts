import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { foodsApi } from '@/lib/api'

export interface FoodSearchResult {
  barcode: string | null
  name: string
  brand: string | null
  image_url: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  nutriscore_grade: string | null
  nova_group: number | null
  source: 'openfoodfacts' | 'cached' | 'custom'
}

export interface CachedFood {
  id: number
  barcode: string
  name: string
  brand: string | null
  image_url: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  nutriscore_grade: string | null
  nova_group: number | null
  is_saved: boolean
  usage_count: number
  cached_at: string
  expires_at: string
}

export function useSearchFoods(query: string, enabled = true, localOnly = false) {
  return useQuery({
    queryKey: ['foods', 'search', query, localOnly],
    queryFn: () => foodsApi.search(query, 1, 20, localOnly),
    enabled: enabled && query.length >= 2,
  })
}

export function useManualSearchFoods() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ query, localOnly = false }: { query: string; localOnly?: boolean }) => 
      foodsApi.search(query, 1, 20, localOnly),
    onSuccess: (data, { query, localOnly }) => {
      queryClient.setQueryData(['foods', 'search', query, localOnly], data)
    },
  })
}

export function useFoodByBarcode(barcode: string) {
  return useQuery({
    queryKey: ['foods', 'barcode', barcode],
    queryFn: () => foodsApi.getByBarcode(barcode),
    enabled: !!barcode,
  })
}

export function useSavedFoods() {
  return useQuery({
    queryKey: ['foods', 'saved'],
    queryFn: () => foodsApi.getSaved(),
  })
}

export function useCachedFoods(savedOnly = false) {
  return useQuery({
    queryKey: ['foods', 'cached', savedOnly],
    queryFn: () => foodsApi.getCached(savedOnly),
  })
}

export function useCreateFood() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: foodsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods', 'saved'] })
      queryClient.invalidateQueries({ queryKey: ['foods', 'search'] })
    },
  })
}

export function useDeleteFood() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: foodsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods', 'saved'] })
      queryClient.invalidateQueries({ queryKey: ['foods', 'search'] })
    },
  })
}

export function useToggleSaveCachedFood() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: foodsApi.toggleSaveCached,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods', 'cached'] })
      queryClient.invalidateQueries({ queryKey: ['foods', 'search'] })
    },
  })
}

export function useUpdateCachedFood() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => foodsApi.updateCached(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods', 'cached'] })
      queryClient.invalidateQueries({ queryKey: ['foods', 'search'] })
    },
  })
}

export function useDeleteCachedFood() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: foodsApi.deleteCached,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods', 'cached'] })
      queryClient.invalidateQueries({ queryKey: ['foods', 'search'] })
    },
  })
}
