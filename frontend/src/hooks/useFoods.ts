import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { foodsApi } from '@/lib/api'

export function useSearchFoods(query: string, enabled = true) {
  return useQuery({
    queryKey: ['foods', 'search', query],
    queryFn: () => foodsApi.search(query),
    enabled: enabled && query.length >= 2,
  })
}

export function useManualSearchFoods() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (query: string) => foodsApi.search(query),
    onSuccess: (data, query) => {
      // Cache the result in React Query as well
      queryClient.setQueryData(['foods', 'search', query], data)
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

export function useCreateFood() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: foodsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods', 'saved'] })
    },
  })
}

export function useDeleteFood() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: foodsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods', 'saved'] })
    },
  })
}
