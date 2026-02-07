import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format, addDays, subDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDailyMeals, useRemoveMealEntry } from '@/hooks/useMeals'
import { useGoalStore } from '@/stores/goalStore'
import { formatNumber, calculateProgress, formatDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import AddFoodDialog from '@/components/diary/AddFoodDialog'
import { useTranslation as useI18n } from 'react-i18next'

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export default function Diary() {
  const { t, i18n } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [addFoodOpen, setAddFoodOpen] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<string>('breakfast')
  
  const { data: dailyMeals, isLoading } = useDailyMeals(selectedDate)
  const removeMealEntry = useRemoveMealEntry()
  const { currentGoal } = useGoalStore()

  const goToPreviousDay = () => {
    const prev = subDays(new Date(selectedDate), 1)
    setSelectedDate(prev.toISOString().split('T')[0])
  }

  const goToNextDay = () => {
    const next = addDays(new Date(selectedDate), 1)
    setSelectedDate(next.toISOString().split('T')[0])
  }

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const openAddFood = (mealType: string) => {
    setSelectedMealType(mealType)
    setAddFoodOpen(true)
  }

  const totals = dailyMeals || {
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    meals: [],
  }

  const getMealByType = (type: string) => {
    return totals.meals?.find((m: any) => m.meal_type === type)
  }

  return (
    <div className="space-y-6">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('diary.title')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            {t('common.today')}
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Current date display */}
      <p className="text-lg text-muted-foreground">
        {formatDate(selectedDate, i18n.language)}
      </p>

      {/* Daily Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('diary.dailySummary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { name: t('macros.calories'), current: totals.total_calories, target: currentGoal?.daily_calories || 2000, unit: t('macros.kcal'), color: 'bg-orange-500' },
              { name: t('macros.protein'), current: totals.total_protein, target: currentGoal?.daily_protein || 150, unit: t('macros.grams'), color: 'bg-blue-500' },
              { name: t('macros.carbs'), current: totals.total_carbs, target: currentGoal?.daily_carbs || 250, unit: t('macros.grams'), color: 'bg-green-500' },
              { name: t('macros.fat'), current: totals.total_fat, target: currentGoal?.daily_fat || 65, unit: t('macros.grams'), color: 'bg-purple-500' },
            ].map((macro) => (
              <div key={macro.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{macro.name}</span>
                  <span className="text-muted-foreground">
                    {formatNumber(macro.current, 0)} / {formatNumber(macro.target, 0)} {macro.unit}
                  </span>
                </div>
                <Progress
                  value={calculateProgress(macro.current, macro.target)}
                  className="h-2"
                  indicatorClassName={macro.color}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meals Tabs */}
      <Tabs defaultValue="breakfast" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {mealTypes.map((type) => (
            <TabsTrigger key={type} value={type}>
              {t(`meals.${type}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {mealTypes.map((type) => {
          const meal = getMealByType(type)
          return (
            <TabsContent key={type} value={type}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t(`meals.${type}`)}</CardTitle>
                  <Button onClick={() => openAddFood(type)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('meals.addFood')}
                  </Button>
                </CardHeader>
                <CardContent>
                  {meal?.entries?.length > 0 ? (
                    <div className="space-y-3">
                      {meal.entries.map((entry: any) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <p className="font-medium">{entry.food_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.amount} {entry.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right text-sm">
                              <p>{formatNumber(entry.calories, 0)} {t('macros.kcal')}</p>
                              <p className="text-muted-foreground">
                                P: {formatNumber(entry.protein, 0)}g | 
                                C: {formatNumber(entry.carbs, 0)}g | 
                                F: {formatNumber(entry.fat, 0)}g
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              disabled={removeMealEntry.isPending}
                              onClick={() => {
                                if (meal?.id && entry.id) {
                                  removeMealEntry.mutate({ mealId: meal.id, entryId: entry.id })
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Meal totals */}
                      <div className="pt-3 border-t flex justify-between text-sm font-medium">
                        <span>{t('recipes.total')}</span>
                        <span>
                          {formatNumber(meal.total_calories, 0)} {t('macros.kcal')} | 
                          P: {formatNumber(meal.total_protein, 0)}g | 
                          C: {formatNumber(meal.total_carbs, 0)}g | 
                          F: {formatNumber(meal.total_fat, 0)}g
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>{t('diary.noMeals')}</p>
                      <Button
                        variant="link"
                        onClick={() => openAddFood(type)}
                        className="mt-2"
                      >
                        {t('meals.addFood')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Add Food Dialog */}
      <AddFoodDialog
        open={addFoodOpen}
        onOpenChange={setAddFoodOpen}
        date={selectedDate}
        mealType={selectedMealType}
      />
    </div>
  )
}
