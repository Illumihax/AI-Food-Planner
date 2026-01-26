import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useManualSearchFoods } from '@/hooks/useFoods'
import { useCreateMeal, useAddMealEntry } from '@/hooks/useMeals'
import { formatNumber } from '@/lib/utils'
import { Search, Loader2, Plus } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface AddFoodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string
  mealType: string
}

export default function AddFoodDialog({
  open,
  onOpenChange,
  date,
  mealType,
}: AddFoodDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<any>(null)
  const [amount, setAmount] = useState(100)
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  const searchFoods = useManualSearchFoods()
  
  const handleSearch = async () => {
    if (searchQuery.length < 2) return
    
    try {
      const results = await searchFoods.mutateAsync(searchQuery)
      setSearchResults(results || [])
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }
  const createMeal = useCreateMeal()
  const addEntry = useAddMealEntry()

  const calculateNutrition = (food: any, grams: number) => {
    const factor = grams / 100
    return {
      calories: food.calories * factor,
      protein: food.protein * factor,
      carbs: food.carbs * factor,
      fat: food.fat * factor,
    }
  }

  const handleAddFood = async () => {
    if (!selectedFood) return

    try {
      // First, try to get or create the meal for this date/type
      let mealId: number

      try {
        const meal = await createMeal.mutateAsync({
          date,
          meal_type: mealType,
        })
        mealId = meal.id
      } catch {
        // Meal might already exist, we need to find it
        // For now, show an error - in a real app we'd fetch the existing meal
        toast({
          title: t('common.error'),
          description: 'Meal already exists for this slot',
          variant: 'destructive',
        })
        return
      }

      const nutrition = calculateNutrition(selectedFood, amount)
      
      await addEntry.mutateAsync({
        mealId,
        data: {
          food_name: selectedFood.name,
          amount,
          unit: 'g',
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
        },
      })

      toast({
        title: t('common.success'),
        description: `Added ${selectedFood.name} to ${t(`meals.${mealType}`)}`,
      })

      // Reset and close
      setSelectedFood(null)
      setSearchQuery('')
      setAmount(100)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to add food',
        variant: 'destructive',
      })
    }
  }

  const nutrition = selectedFood ? calculateNutrition(selectedFood, amount) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('meals.addFood')}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">{t('common.search')}</TabsTrigger>
            <TabsTrigger value="custom">{t('meals.customFood')}</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            {/* Search Input with Button */}
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
              <Button 
                onClick={handleSearch}
                disabled={searchFoods.isPending || searchQuery.length < 2}
                className="min-w-[100px]"
              >
                {searchFoods.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    {t('common.search')}
                  </>
                )}
              </Button>
            </div>

            {/* Search Results */}
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {searchFoods.isPending ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((food: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => setSelectedFood(food)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFood?.barcode === food.barcode
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{food.name}</p>
                        {food.brand && (
                          <p className="text-sm text-muted-foreground">{food.brand}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{formatNumber(food.calories, 0)} {t('macros.kcal')}</p>
                        <p>per 100g</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : searchFoods.isSuccess ? (
                <p className="text-center py-4 text-muted-foreground">
                  {t('common.noResults')}
                </p>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  {t('meals.searchFoods')}
                </p>
              )}
            </div>

            {/* Selected Food Details */}
            {selectedFood && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedFood.name}</p>
                    {selectedFood.brand && (
                      <p className="text-sm text-muted-foreground">{selectedFood.brand}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('meals.amount')} (g)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {nutrition && (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30">
                      <p className="font-bold">{formatNumber(nutrition.calories, 0)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.kcal')}</p>
                    </div>
                    <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                      <p className="font-bold">{formatNumber(nutrition.protein, 1)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.protein')}</p>
                    </div>
                    <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                      <p className="font-bold">{formatNumber(nutrition.carbs, 1)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.carbs')}</p>
                    </div>
                    <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
                      <p className="font-bold">{formatNumber(nutrition.fat, 1)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.fat')}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAddFood}
                  disabled={addEntry.isPending || createMeal.isPending}
                  className="w-full"
                >
                  {addEntry.isPending || createMeal.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {t('meals.addEntry')}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create custom food entries (coming soon)
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
