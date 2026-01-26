import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateRecipe } from '@/hooks/useRecipes'
import { useManualSearchFoods } from '@/hooks/useFoods'
import { formatNumber } from '@/lib/utils'
import { Plus, Trash2, Loader2, Search } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Ingredient {
  food_name: string
  amount: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface CreateRecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateRecipeDialog({
  open,
  onOpenChange,
}: CreateRecipeDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const createRecipe = useCreateRecipe()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState(1)
  const [instructions, setInstructions] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  
  // Ingredient search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<any>(null)
  const [ingredientAmount, setIngredientAmount] = useState(100)
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
  
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
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

  const addIngredient = () => {
    if (!selectedFood) return

    const nutrition = calculateNutrition(selectedFood, ingredientAmount)
    
    setIngredients([
      ...ingredients,
      {
        food_name: selectedFood.name,
        amount: ingredientAmount,
        unit: 'g',
        ...nutrition,
      },
    ])

    setSelectedFood(null)
    setSearchQuery('')
    setIngredientAmount(100)
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const totals = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fat: acc.fat + ing.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const handleCreate = async () => {
    if (!name || ingredients.length === 0) {
      toast({
        title: t('common.error'),
        description: 'Please enter a name and add at least one ingredient',
        variant: 'destructive',
      })
      return
    }

    try {
      await createRecipe.mutateAsync({
        name,
        description,
        servings,
        instructions,
        ingredients,
      })

      toast({
        title: t('common.success'),
        description: `Recipe "${name}" created successfully`,
      })

      // Reset form
      setName('')
      setDescription('')
      setServings(1)
      setInstructions('')
      setIngredients([])
      onOpenChange(false)
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to create recipe',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('recipes.create')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t('recipes.name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Recipe name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servings">{t('meals.servings')}</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('recipes.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the recipe"
              rows={2}
            />
          </div>

          {/* Add Ingredients */}
          <div className="space-y-4">
            <Label>{t('recipes.ingredients')}</Label>
            
            {/* Search with Button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('meals.searchFoods')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="pl-10"
                  disabled={searchFoods.isPending}
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={searchFoods.isPending || searchQuery.length < 2}
                size="sm"
              >
                {searchFoods.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchFoods.isPending ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="max-h-[150px] overflow-y-auto space-y-1 border rounded-md p-2">
                {searchResults.map((food: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => setSelectedFood(food)}
                    className={`p-2 rounded cursor-pointer text-sm ${
                      selectedFood?.barcode === food.barcode
                        ? 'bg-primary/10'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {food.name} {food.brand && `(${food.brand})`}
                  </div>
                ))}
              </div>
            ) : null}

            {/* Selected food - add amount */}
            {selectedFood && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{selectedFood.name}</p>
                </div>
                <div className="w-24">
                  <Label className="text-xs">Amount (g)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={ingredientAmount}
                    onChange={(e) => setIngredientAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button onClick={addIngredient} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Ingredient List */}
            {ingredients.length > 0 && (
              <div className="space-y-2">
                {ingredients.map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <div>
                      <p className="text-sm font-medium">{ing.food_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ing.amount}g - {formatNumber(ing.calories, 0)} kcal
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIngredient(i)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Totals */}
                <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t">
                  <div>
                    <p className="text-sm font-bold">{formatNumber(totals.calories, 0)}</p>
                    <p className="text-xs text-muted-foreground">{t('macros.kcal')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{formatNumber(totals.protein, 1)}g</p>
                    <p className="text-xs text-muted-foreground">{t('macros.protein')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{formatNumber(totals.carbs, 1)}g</p>
                    <p className="text-xs text-muted-foreground">{t('macros.carbs')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{formatNumber(totals.fat, 1)}g</p>
                    <p className="text-xs text-muted-foreground">{t('macros.fat')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">{t('recipes.instructions')}</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Step-by-step cooking instructions"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={createRecipe.isPending}>
            {createRecipe.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
