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
import { useManualSearchFoods, useFoodByBarcode } from '@/hooks/useFoods'
import { useRecipes } from '@/hooks/useRecipes'
import { useCreateMeal, useAddMealEntry } from '@/hooks/useMeals'
import { formatNumber } from '@/lib/utils'
import { Search, Loader2, Plus, Camera, BookOpen, Apple } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import BarcodeScanner from '@/components/BarcodeScanner'

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
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [amount, setAmount] = useState(100)
  const [servings, setServings] = useState(1)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [recipeSearch, setRecipeSearch] = useState('')
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('search')
  
  // Custom food state
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  })
  
  const searchFoods = useManualSearchFoods()
  const { data: recipes, isLoading: loadingRecipes } = useRecipes(recipeSearch)
  const { data: barcodeFood, isLoading: loadingBarcode } = useFoodByBarcode(scannedBarcode || '')
  const createMeal = useCreateMeal()
  const addEntry = useAddMealEntry()

  const handleSearch = async () => {
    if (searchQuery.length < 2) return
    
    try {
      const results = await searchFoods.mutateAsync({ query: searchQuery })
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

  const handleBarcodeScan = (barcode: string) => {
    setScannedBarcode(barcode)
  }

  // When barcode food is loaded, select it
  if (barcodeFood && scannedBarcode && !selectedFood) {
    setSelectedFood(barcodeFood)
    setScannedBarcode(null)
    setActiveTab('search') // Switch to search tab to show the selected food
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

  const calculateRecipeNutrition = (recipe: any, numServings: number) => {
    return {
      calories: (recipe.calories_per_serving || 0) * numServings,
      protein: (recipe.protein_per_serving || 0) * numServings,
      carbs: (recipe.carbs_per_serving || 0) * numServings,
      fat: (recipe.fat_per_serving || 0) * numServings,
    }
  }

  const handleAddFood = async () => {
    if (!selectedFood) return

    try {
      // Create or get existing meal (backend does upsert)
      const meal = await createMeal.mutateAsync({
        date,
        meal_type: mealType,
      })

      const nutrition = calculateNutrition(selectedFood, amount)
      
      await addEntry.mutateAsync({
        mealId: meal.id,
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

      // Save the food to cache if it came from OpenFoodFacts
      if (selectedFood.barcode && selectedFood.source === 'openfoodfacts') {
        try {
          await fetch(`/api/foods/save-by-barcode/${selectedFood.barcode}`, { method: 'POST' })
        } catch { /* silently ignore save errors */ }
      }

      toast({
        title: t('common.success'),
        description: `Added ${selectedFood.name} to ${t(`meals.${mealType}`)}`,
      })

      resetAndClose()
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to add food',
        variant: 'destructive',
      })
    }
  }

  const handleAddRecipe = async () => {
    if (!selectedRecipe) return

    try {
      const meal = await createMeal.mutateAsync({
        date,
        meal_type: mealType,
      })

      const nutrition = calculateRecipeNutrition(selectedRecipe, servings)
      
      await addEntry.mutateAsync({
        mealId: meal.id,
        data: {
          food_name: selectedRecipe.name,
          recipe_id: selectedRecipe.id,
          amount: servings,
          unit: 'servings',
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
        },
      })

      toast({
        title: t('common.success'),
        description: `Added ${selectedRecipe.name} to ${t(`meals.${mealType}`)}`,
      })

      resetAndClose()
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to add recipe',
        variant: 'destructive',
      })
    }
  }

  const handleAddCustomFood = async () => {
    if (!customFood.name) return

    try {
      const meal = await createMeal.mutateAsync({
        date,
        meal_type: mealType,
      })
      
      await addEntry.mutateAsync({
        mealId: meal.id,
        data: {
          food_name: customFood.name,
          amount: amount,
          unit: 'g',
          calories: customFood.calories * (amount / 100),
          protein: customFood.protein * (amount / 100),
          carbs: customFood.carbs * (amount / 100),
          fat: customFood.fat * (amount / 100),
        },
      })

      toast({
        title: t('common.success'),
        description: `Added ${customFood.name} to ${t(`meals.${mealType}`)}`,
      })

      resetAndClose()
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to add food',
        variant: 'destructive',
      })
    }
  }

  const resetAndClose = () => {
    setSelectedFood(null)
    setSelectedRecipe(null)
    setSearchQuery('')
    setSearchResults([])
    setAmount(100)
    setServings(1)
    setScannedBarcode(null)
    setCustomFood({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 })
    onOpenChange(false)
  }

  const nutrition = selectedFood ? calculateNutrition(selectedFood, amount) : null
  const recipeNutrition = selectedRecipe ? calculateRecipeNutrition(selectedRecipe, servings) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('meals.addFood')}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              {t('common.search')}
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {t('meals.fromRecipe')}
            </TabsTrigger>
            <TabsTrigger value="barcode" className="flex items-center gap-1">
              <Camera className="h-3 w-3" />
              {t('food.barcode')}
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
              <Button 
                onClick={handleSearch}
                disabled={searchFoods.isPending || searchQuery.length < 2}
              >
                {searchFoods.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('common.search')
                )}
              </Button>
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {searchFoods.isPending ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
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
                        <p className="font-medium">{food.name}</p>
                        {food.brand && (
                          <p className="text-sm text-muted-foreground">{food.brand}</p>
                        )}
                        {food.source && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            food.source === 'custom' ? 'bg-blue-100 text-blue-700' :
                            food.source === 'cached' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {food.source}
                          </span>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{formatNumber(food.calories, 0)} {t('macros.kcal')}</p>
                        <p>per 100g</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : searchFoods.isSuccess && searchResults.length === 0 ? (
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

                <div className="space-y-2">
                  <Label>{t('meals.amount')} (g)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  />
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

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('recipes.title')}
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {loadingRecipes ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : recipes && recipes.length > 0 ? (
                recipes.map((recipe: any) => (
                  <div
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRecipe?.id === recipe.id
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{recipe.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {recipe.servings} {t('meals.servings')}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{formatNumber(recipe.calories_per_serving || 0, 0)} {t('macros.kcal')}</p>
                        <p>{t('recipes.perServing')}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  {t('recipes.noRecipes')}
                </p>
              )}
            </div>

            {/* Selected Recipe Details */}
            {selectedRecipe && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <p className="font-medium">{selectedRecipe.name}</p>
                  {selectedRecipe.description && (
                    <p className="text-sm text-muted-foreground">{selectedRecipe.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t('meals.servings')}</Label>
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={servings}
                    onChange={(e) => setServings(parseFloat(e.target.value) || 1)}
                  />
                </div>

                {recipeNutrition && (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30">
                      <p className="font-bold">{formatNumber(recipeNutrition.calories, 0)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.kcal')}</p>
                    </div>
                    <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                      <p className="font-bold">{formatNumber(recipeNutrition.protein, 1)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.protein')}</p>
                    </div>
                    <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                      <p className="font-bold">{formatNumber(recipeNutrition.carbs, 1)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.carbs')}</p>
                    </div>
                    <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
                      <p className="font-bold">{formatNumber(recipeNutrition.fat, 1)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.fat')}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAddRecipe}
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

          {/* Barcode Tab */}
          <TabsContent value="barcode" className="space-y-4">
            <BarcodeScanner 
              onScan={handleBarcodeScan}
              onError={(error) => {
                toast({
                  title: t('common.error'),
                  description: error,
                  variant: 'destructive',
                })
              }}
            />
            {loadingBarcode && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>{t('common.loading')}</span>
              </div>
            )}
          </TabsContent>

          {/* Custom Food Tab */}
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('foods.name')} *</Label>
                <Input
                  value={customFood.name}
                  onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                  placeholder={t('foods.namePlaceholder')}
                />
              </div>
              
              <p className="text-sm font-medium">{t('food.nutritionPer100g')}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('macros.calories')}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={customFood.calories}
                    onChange={(e) => setCustomFood({ ...customFood, calories: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('macros.protein')} (g)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={customFood.protein}
                    onChange={(e) => setCustomFood({ ...customFood, protein: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('macros.carbs')} (g)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={customFood.carbs}
                    onChange={(e) => setCustomFood({ ...customFood, carbs: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('macros.fat')} (g)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={customFood.fat}
                    onChange={(e) => setCustomFood({ ...customFood, fat: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('meals.amount')} (g)</Label>
                <Input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 100)}
                />
              </div>

              <Button
                onClick={handleAddCustomFood}
                disabled={!customFood.name || addEntry.isPending || createMeal.isPending}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
