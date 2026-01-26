import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Goal {
  id: number
  daily_calories: number
  daily_protein: number
  daily_carbs: number
  daily_fat: number
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface GoalStore {
  currentGoal: Goal | null
  setCurrentGoal: (goal: Goal | null) => void
}

export const useGoalStore = create<GoalStore>()(
  persist(
    (set) => ({
      currentGoal: null,
      setCurrentGoal: (goal) => set({ currentGoal: goal }),
    }),
    {
      name: 'nutriplan-goals',
    }
  )
)
