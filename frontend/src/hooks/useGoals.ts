import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goalsApi } from '@/lib/api'
import { useGoalStore } from '@/stores/goalStore'
import { useEffect } from 'react'

export function useCurrentGoal() {
  const { setCurrentGoal } = useGoalStore()
  
  const query = useQuery({
    queryKey: ['goals', 'current'],
    queryFn: goalsApi.getCurrent,
  })

  useEffect(() => {
    if (query.data) {
      setCurrentGoal(query.data)
    }
  }, [query.data, setCurrentGoal])

  return query
}

export function useGoalHistory() {
  return useQuery({
    queryKey: ['goals', 'history'],
    queryFn: goalsApi.getHistory,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  const { setCurrentGoal } = useGoalStore()
  
  return useMutation({
    mutationFn: goalsApi.create,
    onSuccess: (data) => {
      setCurrentGoal(data)
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  const { setCurrentGoal } = useGoalStore()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      goalsApi.update(id, data),
    onSuccess: (data) => {
      if (data.is_active) {
        setCurrentGoal(data)
      }
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}
