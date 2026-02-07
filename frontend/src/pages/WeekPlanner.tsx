import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { format, addDays, startOfWeek } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGoalStore } from '@/stores/goalStore'
import { useGenerateMealPlan } from '@/hooks/useAi'
import { useManualSearchFoods } from '@/hooks/useFoods'
import { useRecipes } from '@/hooks/useRecipes'
import { 
  useDraftWeekPlan, 
  useCreateWeekPlan, 
  useUpdateWeekPlan,
  useDeleteWeekPlan,
  useAddMealToWeekPlan,
  useRemoveMealFromWeekPlan,
  useClearDayFromWeekPlan,
  useRegenerateDayInWeekPlan,
  useApplyWeekPlanToDiary,
  useCreateWeekPlanFromAi,
  WeekPlan,
  WeekPlanMeal
} from '@/hooks/useWeekPlans'
import { formatNumber } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { 
  Calendar, 
  Loader2, 
  Sparkles, 
  Trash2, 
  Check, 
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Save,
  Flame,
  Beef,
  Wheat,
  Droplets,
  RotateCcw,
  Search,
  BookOpen,
  Apple,
} from 'lucide-react'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeekPlanner() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const { currentGoal } = useGoalStore()
  const generateMealPlan = useGenerateMealPlan()
  
  const { data: draftPlan, isLoading: loadingDraft } = useDraftWeekPlan()
  const createWeekPlan = useCreateWeekPlan()
  const updateWeekPlan = useUpdateWeekPlan()
  const deleteWeekPlan = useDeleteWeekPlan()
  const addMeal = useAddMealToWeekPlan()
  const removeMeal = useRemoveMealFromWeekPlan()
  const clearDay = useClearDayFromWeekPlan()
  const regenerateDay = useRegenerateDayInWeekPlan()
  const applyToDiary = useApplyWeekPlanToDiary()
  const createFromAi = useCreateWeekPlanFromAi()

  const [currentPlan, setCurrentPlan] = useState<WeekPlan | null>(null)
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    return startOfWeek(today, { weekStartsOn: 1 })
  })
  const [planName, setPlanName] = useState('')
  const [preferences, setPreferences] = useState('')
  const [restrictions, setRestrictions] = useState('')
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [applyDate, setApplyDate] = useState(format(startDate, 'yyyy-MM-dd'))
  
  // Add food dialog state
  const [addFoodDialog, setAddFoodDialog] = useState<{
    open: boolean
    dayIndex: number
    mealType: string
  }>({ open: false, dayIndex: 0, mealType: 'breakfast' })
  
  // Regenerating state
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null)
  const [regeneratingMeal, setRegeneratingMeal] = useState<string | null>(null)

  // Load draft plan when available
  useEffect(() => {
    if (draftPlan) {
      setCurrentPlan(draftPlan)
      setPlanName(draftPlan.name)
      setStartDate(new Date(draftPlan.start_date))
    }
  }, [draftPlan])

  const handleGeneratePlan = async () => {
    try {
      const result = await generateMealPlan.mutateAsync({
        use_current_goal: true,
        days: 7,
        preferences: preferences ? preferences.split(',').map(p => p.trim()) : [],
        restrictions: restrictions ? restrictions.split(',').map(r => r.trim()) : [],
        language: i18n.language as 'en' | 'de',
      })
      
      // Convert AI plan to week plan format and save
      const aiDays = result.days.map((day: any, index: number) => ({
        breakfast: [{ name: day.breakfast, description: day.breakfast_description }],
        lunch: [{ name: day.lunch, description: day.lunch_description }],
        dinner: [{ name: day.dinner, description: day.dinner_description }],
        snacks: (day.snacks || []).map((s: string) => ({ name: s, description: '' })),
        estimated_calories: day.estimated_calories || 0,
        estimated_protein: day.estimated_protein || 0,
        estimated_carbs: day.estimated_carbs || 0,
        estimated_fat: day.estimated_fat || 0,
      }))
      
      const newPlan = await createFromAi.mutateAsync({
        name: planName || `Week Plan ${format(startDate, 'MMM d, yyyy')}`,
        start_date: format(startDate, 'yyyy-MM-dd'),
        days: aiDays,
      })
      
      setCurrentPlan(newPlan)
    } catch (error) {
      console.error('Failed to generate meal plan:', error)
    }
  }

  const handleCreateEmptyPlan = async () => {
    try {
      const newPlan = await createWeekPlan.mutateAsync({
        name: planName || `Week Plan ${format(startDate, 'MMM d, yyyy')}`,
        start_date: format(startDate, 'yyyy-MM-dd'),
        status: 'draft',
        meals: [],
      })
      setCurrentPlan(newPlan)
    } catch (error) {
      console.error('Failed to create plan:', error)
    }
  }

  const handleDiscardPlan = async () => {
    if (currentPlan) {
      try {
        await deleteWeekPlan.mutateAsync(currentPlan.id)
        setCurrentPlan(null)
        setPlanName('')
      } catch (error) {
        console.error('Failed to discard plan:', error)
      }
    }
  }

  const handleRemoveMeal = async (mealId: number) => {
    if (currentPlan) {
      try {
        await removeMeal.mutateAsync({ planId: currentPlan.id, mealId })
        setCurrentPlan({
          ...currentPlan,
          meals: currentPlan.meals.filter(m => m.id !== mealId),
        })
      } catch (error) {
        console.error('Failed to remove meal:', error)
      }
    }
  }

  const handleClearDay = async (dayIndex: number) => {
    if (!currentPlan) return
    try {
      await clearDay.mutateAsync({ planId: currentPlan.id, dayIndex })
      setCurrentPlan({
        ...currentPlan,
        meals: currentPlan.meals.filter(m => m.day_index !== dayIndex),
      })
      toast({ title: t('common.success'), description: t('weekPlanner.clearDay') })
    } catch (error) {
      console.error('Failed to clear day:', error)
    }
  }

  const handleRegenerateDay = async (dayIndex: number, mealType?: string) => {
    if (!currentPlan) return
    setRegeneratingDay(dayIndex)
    setRegeneratingMeal(mealType || null)
    try {
      const updatedPlan = await regenerateDay.mutateAsync({
        planId: currentPlan.id,
        data: {
          day_index: dayIndex,
          meal_type: mealType,
          language: i18n.language,
        },
      })
      setCurrentPlan(updatedPlan)
      toast({ title: t('common.success'), description: mealType ? t('weekPlanner.regenerateMeal') : t('weekPlanner.regenerateDay') })
    } catch (error) {
      console.error('Failed to regenerate:', error)
      toast({ title: t('common.error'), description: 'Failed to regenerate', variant: 'destructive' })
    } finally {
      setRegeneratingDay(null)
      setRegeneratingMeal(null)
    }
  }

  const handleApplyToDiary = async () => {
    if (currentPlan) {
      try {
        await applyToDiary.mutateAsync({
          planId: currentPlan.id,
          targetStartDate: applyDate,
        })
        setShowApplyDialog(false)
        setCurrentPlan({ ...currentPlan, status: 'active' })
      } catch (error) {
        console.error('Failed to apply to diary:', error)
      }
    }
  }

  const navigateWeek = (direction: number) => {
    setStartDate(addDays(startDate, direction * 7))
    setApplyDate(format(addDays(startDate, direction * 7), 'yyyy-MM-dd'))
  }

  const getMealsFor = (dayIndex: number, mealType: string): WeekPlanMeal[] => {
    if (!currentPlan) return []
    return currentPlan.meals.filter(
      m => m.day_index === dayIndex && m.meal_type === mealType
    )
  }

  const getDayTotals = (dayIndex: number) => {
    if (!currentPlan) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    const dayMeals = currentPlan.meals.filter(m => m.day_index === dayIndex)
    return {
      calories: dayMeals.reduce((sum, m) => sum + m.calories, 0),
      protein: dayMeals.reduce((sum, m) => sum + m.protein, 0),
      carbs: dayMeals.reduce((sum, m) => sum + m.carbs, 0),
      fat: dayMeals.reduce((sum, m) => sum + m.fat, 0),
    }
  }

  const openAddFoodDialog = (dayIndex: number, mealType: string) => {
    setAddFoodDialog({ open: true, dayIndex, mealType })
  }

  const handleAddFoodToWeekPlan = async (food: any, amount: number, unit: string) => {
    if (!currentPlan) return
    const factor = unit === 'g' ? amount / 100 : amount
    
    try {
      const newMeal = await addMeal.mutateAsync({
        planId: currentPlan.id,
        data: {
          day_index: addFoodDialog.dayIndex,
          meal_type: addFoodDialog.mealType,
          food_name: food.name,
          amount,
          unit,
          calories: food.calories * factor,
          protein: food.protein * factor,
          carbs: food.carbs * factor,
          fat: food.fat * factor,
        },
      })
      
      setCurrentPlan({
        ...currentPlan,
        meals: [...currentPlan.meals, newMeal],
        total_calories: currentPlan.total_calories + newMeal.calories,
        total_protein: currentPlan.total_protein + newMeal.protein,
        total_carbs: currentPlan.total_carbs + newMeal.carbs,
        total_fat: currentPlan.total_fat + newMeal.fat,
      })
      
      // Save the food to cache if from openfoodfacts
      if (food.barcode && food.source === 'openfoodfacts') {
        try {
          await fetch(`/api/foods/save-by-barcode/${food.barcode}`, { method: 'POST' })
        } catch { /* ignore */ }
      }
      
      setAddFoodDialog({ ...addFoodDialog, open: false })
      toast({ title: t('common.success'), description: `Added ${food.name}` })
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to add food', variant: 'destructive' })
    }
  }

  if (loadingDraft) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('weekPlanner.title')}</h1>
          <p className="text-muted-foreground">{t('weekPlanner.description')}</p>
        </div>
        {currentPlan && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDiscardPlan}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('weekPlanner.discard')}
            </Button>
            <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Check className="h-4 w-4 mr-2" />
                  {t('weekPlanner.applyToDiary')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('weekPlanner.applyToDiary')}</DialogTitle>
                  <DialogDescription>{t('weekPlanner.applyDescription')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="apply-date">{t('weekPlanner.startDate')}</Label>
                    <Input
                      id="apply-date"
                      type="date"
                      value={applyDate}
                      onChange={(e) => setApplyDate(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleApplyToDiary} 
                    disabled={applyToDiary.isPending}
                    className="w-full"
                  >
                    {applyToDiary.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {t('common.confirm')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Configuration / Create Plan */}
      {!currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('weekPlanner.createPlan')}
            </CardTitle>
            <CardDescription>
              {currentGoal 
                ? `${t('mealPlanner.useCurrentGoals')}: ${formatNumber(currentGoal.daily_calories, 0)} kcal`
                : t('goals.noGoals')
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-name">{t('weekPlanner.planName')}</Label>
                <Input
                  id="plan-name"
                  placeholder={t('weekPlanner.planNamePlaceholder')}
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date">{t('weekPlanner.startDate')}</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={format(startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preferences">{t('mealPlanner.preferences')}</Label>
                <Input
                  id="preferences"
                  placeholder="e.g., high-protein, Mediterranean"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restrictions">{t('mealPlanner.restrictions')}</Label>
                <Input
                  id="restrictions"
                  placeholder="e.g., gluten-free, vegetarian"
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleGeneratePlan} 
                disabled={generateMealPlan.isPending || createFromAi.isPending || !currentGoal}
              >
                {(generateMealPlan.isPending || createFromAi.isPending) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {t('weekPlanner.generateWithAi')}
              </Button>
              <Button variant="outline" onClick={handleCreateEmptyPlan}>
                <Plus className="h-4 w-4 mr-2" />
                {t('weekPlanner.createEmpty')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week Grid */}
      {currentPlan && (
        <>
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">
              {format(startDate, 'MMM d')} - {format(addDays(startDate, 6), 'MMM d, yyyy')}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => navigateWeek(1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Week Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{currentPlan.name}</div>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {formatNumber(currentPlan.total_calories, 0)} kcal
                  </span>
                  <span className="flex items-center gap-1">
                    <Beef className="h-4 w-4 text-blue-500" />
                    {formatNumber(currentPlan.total_protein, 0)}g
                  </span>
                  <span className="flex items-center gap-1">
                    <Wheat className="h-4 w-4 text-green-500" />
                    {formatNumber(currentPlan.total_carbs, 0)}g
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets className="h-4 w-4 text-purple-500" />
                    {formatNumber(currentPlan.total_fat, 0)}g
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Week Grid */}
          <div className="grid grid-cols-8 gap-2">
            {/* Header row */}
            <div className="font-medium text-muted-foreground"></div>
            {DAY_NAMES.map((day, index) => {
              const dayTotals = getDayTotals(index)
              const isRegenerating = regeneratingDay === index && !regeneratingMeal
              return (
                <div key={day} className="text-center">
                  <div className="font-medium">{day}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(addDays(startDate, index), 'M/d')}
                  </div>
                  <div className="text-xs text-orange-500 mt-1">
                    {formatNumber(dayTotals.calories, 0)} kcal
                  </div>
                  {/* Day action buttons */}
                  <div className="flex justify-center gap-0.5 mt-1">
                    <button
                      onClick={() => handleClearDay(index)}
                      className="p-0.5 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive"
                      title={t('weekPlanner.clearDay')}
                      disabled={clearDay.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleRegenerateDay(index)}
                      className="p-0.5 hover:bg-primary/20 rounded text-muted-foreground hover:text-primary"
                      title={t('weekPlanner.regenerateDay')}
                      disabled={isRegenerating}
                    >
                      {isRegenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Meal rows */}
            {MEAL_TYPES.map((mealType) => (
              <React.Fragment key={mealType}>
                <div className="font-medium text-muted-foreground capitalize py-2">
                  {t(`meals.${mealType}`)}
                </div>
                {DAY_NAMES.map((_, dayIndex) => {
                  const meals = getMealsFor(dayIndex, mealType)
                  const isMealRegenerating = regeneratingDay === dayIndex && regeneratingMeal === mealType
                  return (
                    <Card key={`${mealType}-${dayIndex}`} className="min-h-[100px]">
                      <CardContent className="p-2 space-y-1">
                        {isMealRegenerating ? (
                          <div className="h-full flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </div>
                        ) : (
                          <>
                            {meals.map((meal) => (
                              <div 
                                key={meal.id}
                                className="text-xs p-1.5 bg-muted rounded group relative"
                              >
                                <div className="font-medium line-clamp-2">{meal.food_name}</div>
                                <div className="text-muted-foreground">
                                  {formatNumber(meal.calories, 0)} kcal
                                </div>
                                <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 flex gap-0.5">
                                  <button
                                    onClick={() => handleRegenerateDay(dayIndex, mealType)}
                                    className="p-0.5 hover:bg-primary/20 rounded"
                                    title={t('weekPlanner.regenerateMeal')}
                                  >
                                    <RotateCcw className="h-3 w-3 text-primary" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveMeal(meal.id)}
                                    className="p-0.5 hover:bg-destructive/20 rounded"
                                  >
                                    <X className="h-3 w-3 text-destructive" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {/* Add food button */}
                            <button
                              onClick={() => openAddFoodDialog(dayIndex, mealType)}
                              className="w-full text-xs p-1 border border-dashed border-muted-foreground/30 rounded hover:bg-muted/50 text-muted-foreground flex items-center justify-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </>
      )}

      {/* Add Food to Week Plan Dialog */}
      <AddFoodToWeekPlanDialog
        open={addFoodDialog.open}
        onOpenChange={(open) => setAddFoodDialog({ ...addFoodDialog, open })}
        onAddFood={handleAddFoodToWeekPlan}
        dayName={DAY_NAMES[addFoodDialog.dayIndex]}
        mealType={addFoodDialog.mealType}
      />
    </div>
  )
}


// Inline dialog component for adding food to week plan
function AddFoodToWeekPlanDialog({
  open,
  onOpenChange,
  onAddFood,
  dayName,
  mealType,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddFood: (food: any, amount: number, unit: string) => Promise<void>
  dayName: string
  mealType: string
}) {
  const { t } = useTranslation()
  const searchFoods = useManualSearchFoods()
  const { data: recipes, isLoading: loadingRecipes } = useRecipes('')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedFood, setSelectedFood] = useState<any>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [amount, setAmount] = useState(100)
  const [servings, setServings] = useState(1)
  const [activeTab, setActiveTab] = useState('search')
  const [isAdding, setIsAdding] = useState(false)
  const [customFood, setCustomFood] = useState({
    name: '', calories: 0, protein: 0, carbs: 0, fat: 0,
  })

  const handleSearch = async () => {
    if (searchQuery.length < 2) return
    try {
      const results = await searchFoods.mutateAsync({ query: searchQuery })
      setSearchResults(results || [])
    } catch {
      setSearchResults([])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const calculateNutrition = (food: any, grams: number) => {
    const factor = grams / 100
    return {
      calories: food.calories * factor,
      protein: food.protein * factor,
      carbs: food.carbs * factor,
      fat: food.fat * factor,
    }
  }

  const handleAdd = async () => {
    setIsAdding(true)
    try {
      if (activeTab === 'search' && selectedFood) {
        await onAddFood(selectedFood, amount, 'g')
      } else if (activeTab === 'recipes' && selectedRecipe) {
        await onAddFood({
          name: selectedRecipe.name,
          calories: (selectedRecipe.calories_per_serving || 0),
          protein: (selectedRecipe.protein_per_serving || 0),
          carbs: (selectedRecipe.carbs_per_serving || 0),
          fat: (selectedRecipe.fat_per_serving || 0),
        }, servings, 'servings')
      } else if (activeTab === 'custom' && customFood.name) {
        await onAddFood(customFood, amount, 'g')
      }
      // Reset
      setSelectedFood(null)
      setSelectedRecipe(null)
      setSearchQuery('')
      setSearchResults([])
      setAmount(100)
      setServings(1)
      setCustomFood({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 })
    } finally {
      setIsAdding(false)
    }
  }

  const nutrition = selectedFood ? calculateNutrition(selectedFood, amount) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('weekPlanner.addFoodToSlot')}</DialogTitle>
          <DialogDescription>
            {dayName} - {t(`meals.${mealType}`)}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              {t('common.search')}
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {t('meals.fromRecipe')}
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-1">
              <Apple className="h-3 w-3" />
              {t('meals.customFood')}
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('meals.searchFoods')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  disabled={searchFoods.isPending}
                />
              </div>
              <Button onClick={handleSearch} disabled={searchFoods.isPending || searchQuery.length < 2}>
                {searchFoods.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.search')}
              </Button>
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {searchFoods.isPending ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((food: any, i: number) => (
                  <div
                    key={food.barcode || i}
                    onClick={() => setSelectedFood(food)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFood?.barcode === food.barcode && selectedFood?.name === food.name
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{food.name}</p>
                        {food.brand && <p className="text-xs text-muted-foreground">{food.brand}</p>}
                        {food.source && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            food.source === 'custom' ? 'bg-blue-100 text-blue-700' :
                            food.source === 'cached' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{food.source}</span>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{formatNumber(food.calories, 0)} kcal</p>
                        <p>per 100g</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : null}
            </div>

            {selectedFood && (
              <div className="space-y-3 pt-3 border-t">
                <p className="font-medium text-sm">{selectedFood.name}</p>
                <div className="space-y-2">
                  <Label>{t('meals.amount')} (g)</Label>
                  <Input type="number" min="1" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
                </div>
                {nutrition && (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30">
                      <p className="font-bold text-sm">{formatNumber(nutrition.calories, 0)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.kcal')}</p>
                    </div>
                    <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                      <p className="font-bold text-sm">{formatNumber(nutrition.protein, 1)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.protein')}</p>
                    </div>
                    <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                      <p className="font-bold text-sm">{formatNumber(nutrition.carbs, 1)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.carbs')}</p>
                    </div>
                    <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
                      <p className="font-bold text-sm">{formatNumber(nutrition.fat, 1)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.fat')}</p>
                    </div>
                  </div>
                )}
                <Button onClick={handleAdd} disabled={isAdding} className="w-full">
                  {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  {t('meals.addEntry')}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="space-y-4">
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {loadingRecipes ? (
                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : recipes && recipes.length > 0 ? (
                recipes.map((recipe: any) => (
                  <div
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRecipe?.id === recipe.id ? 'bg-primary/10 border border-primary' : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{recipe.name}</p>
                        <p className="text-xs text-muted-foreground">{recipe.servings} {t('meals.servings')}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{formatNumber(recipe.calories_per_serving || 0, 0)} kcal</p>
                        <p>{t('recipes.perServing')}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-muted-foreground">{t('recipes.noRecipes')}</p>
              )}
            </div>

            {selectedRecipe && (
              <div className="space-y-3 pt-3 border-t">
                <p className="font-medium text-sm">{selectedRecipe.name}</p>
                <div className="space-y-2">
                  <Label>{t('meals.servings')}</Label>
                  <Input type="number" min="0.5" step="0.5" value={servings} onChange={(e) => setServings(parseFloat(e.target.value) || 1)} />
                </div>
                <Button onClick={handleAdd} disabled={isAdding} className="w-full">
                  {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  {t('meals.addEntry')}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Custom Food Tab */}
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label>{t('foods.name')} *</Label>
              <Input
                value={customFood.name}
                onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                placeholder={t('foods.namePlaceholder')}
              />
            </div>
            <p className="text-sm font-medium">{t('food.nutritionPer100g')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('macros.calories')}</Label>
                <Input type="number" min="0" value={customFood.calories} onChange={(e) => setCustomFood({ ...customFood, calories: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('macros.protein')} (g)</Label>
                <Input type="number" min="0" step="0.1" value={customFood.protein} onChange={(e) => setCustomFood({ ...customFood, protein: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('macros.carbs')} (g)</Label>
                <Input type="number" min="0" step="0.1" value={customFood.carbs} onChange={(e) => setCustomFood({ ...customFood, carbs: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('macros.fat')} (g)</Label>
                <Input type="number" min="0" step="0.1" value={customFood.fat} onChange={(e) => setCustomFood({ ...customFood, fat: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('meals.amount')} (g)</Label>
              <Input type="number" min="1" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 100)} />
            </div>
            <Button onClick={handleAdd} disabled={!customFood.name || isAdding} className="w-full">
              {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {t('meals.addEntry')}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
