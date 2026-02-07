import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  useSavedFoods, 
  useCachedFoods, 
  useCreateFood, 
  useDeleteFood,
  useToggleSaveCachedFood,
  useDeleteCachedFood,
  CachedFood
} from '@/hooks/useFoods'
import { formatNumber } from '@/lib/utils'
import { 
  Apple, 
  Search, 
  Plus, 
  Trash2, 
  Star, 
  StarOff,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Package
} from 'lucide-react'

interface CustomFood {
  id: number
  name: string
  brand: string | null
  barcode: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  serving_size: number
  serving_unit: string
}

export default function Foods() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('my-foods')
  
  const { data: savedFoods, isLoading: loadingSaved } = useSavedFoods()
  const { data: cachedFoods, isLoading: loadingCached } = useCachedFoods(false)
  const createFood = useCreateFood()
  const deleteFood = useDeleteFood()
  const toggleSave = useToggleSaveCachedFood()
  const deleteCached = useDeleteCachedFood()

  const [newFood, setNewFood] = useState({
    name: '',
    brand: '',
    barcode: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    serving_size: 100,
    serving_unit: 'g',
  })

  const handleCreateFood = async () => {
    try {
      await createFood.mutateAsync(newFood)
      setShowCreateDialog(false)
      setNewFood({
        name: '',
        brand: '',
        barcode: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        serving_size: 100,
        serving_unit: 'g',
      })
    } catch (error) {
      console.error('Failed to create food:', error)
    }
  }

  // Filter foods based on search
  const filteredSavedFoods = savedFoods?.filter((food: CustomFood) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    food.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const filteredCachedFoods = cachedFoods?.filter((food: CachedFood) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    food.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    food.barcode.includes(searchQuery)
  ) || []

  // Separate saved and recent cached foods
  const savedCachedFoods = filteredCachedFoods.filter((f: CachedFood) => f.is_saved)
  const recentCachedFoods = filteredCachedFoods.filter((f: CachedFood) => !f.is_saved)

  const renderMacros = (food: CustomFood | CachedFood) => (
    <div className="flex gap-4 text-sm text-muted-foreground">
      <span className="flex items-center gap-1">
        <Flame className="h-3 w-3 text-orange-500" />
        {formatNumber(food.calories, 0)}
      </span>
      <span className="flex items-center gap-1">
        <Beef className="h-3 w-3 text-blue-500" />
        {formatNumber(food.protein, 1)}g
      </span>
      <span className="flex items-center gap-1">
        <Wheat className="h-3 w-3 text-green-500" />
        {formatNumber(food.carbs, 1)}g
      </span>
      <span className="flex items-center gap-1">
        <Droplets className="h-3 w-3 text-purple-500" />
        {formatNumber(food.fat, 1)}g
      </span>
    </div>
  )

  const FoodCard = ({ food, type }: { food: CustomFood | CachedFood; type: 'custom' | 'cached' }) => {
    const isCached = type === 'cached'
    const cachedFood = food as CachedFood
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {isCached && cachedFood.image_url ? (
                  <img 
                    src={cachedFood.image_url} 
                    alt={food.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                    <Apple className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium line-clamp-1">{food.name}</h3>
                  {food.brand && (
                    <p className="text-sm text-muted-foreground">{food.brand}</p>
                  )}
                </div>
              </div>
              <div className="mt-3">
                {renderMacros(food)}
              </div>
              {isCached && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="h-3 w-3" />
                  <span>{cachedFood.barcode}</span>
                  {cachedFood.usage_count > 0 && (
                    <span className="ml-2">• {t('foods.usedTimes', { count: cachedFood.usage_count })}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              {isCached && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleSave.mutate(cachedFood.id)}
                  title={cachedFood.is_saved ? t('foods.unsave') : t('foods.save')}
                >
                  {cachedFood.is_saved ? (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isCached) {
                    deleteCached.mutate(cachedFood.id)
                  } else {
                    deleteFood.mutate((food as CustomFood).id)
                  }
                }}
                title={t('common.delete')}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('foods.title')}</h1>
          <p className="text-muted-foreground">{t('foods.description')}</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('foods.addCustom')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('foods.addCustom')}</DialogTitle>
              <DialogDescription>{t('foods.addCustomDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('foods.name')} *</Label>
                <Input
                  id="name"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  placeholder={t('foods.namePlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">{t('food.brand')}</Label>
                  <Input
                    id="brand"
                    value={newFood.brand}
                    onChange={(e) => setNewFood({ ...newFood, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">{t('food.barcode')}</Label>
                  <Input
                    id="barcode"
                    value={newFood.barcode}
                    onChange={(e) => setNewFood({ ...newFood, barcode: e.target.value })}
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">{t('food.nutritionPer100g')}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">{t('macros.calories')}</Label>
                    <Input
                      id="calories"
                      type="number"
                      min="0"
                      value={newFood.calories}
                      onChange={(e) => setNewFood({ ...newFood, calories: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein">{t('macros.protein')} (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newFood.protein}
                      onChange={(e) => setNewFood({ ...newFood, protein: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbs">{t('macros.carbs')} (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newFood.carbs}
                      onChange={(e) => setNewFood({ ...newFood, carbs: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat">{t('macros.fat')} (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newFood.fat}
                      onChange={(e) => setNewFood({ ...newFood, fat: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleCreateFood} 
                disabled={!newFood.name || createFood.isPending}
                className="w-full"
              >
                {createFood.isPending ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('foods.searchPlaceholder')}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-foods">{t('foods.myFoods')}</TabsTrigger>
          <TabsTrigger value="recent">{t('foods.recent')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-foods" className="mt-6">
          {loadingSaved || loadingCached ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Custom Foods */}
              {filteredSavedFoods.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4">{t('foods.customFoods')}</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSavedFoods.map((food: CustomFood) => (
                      <FoodCard key={`custom-${food.id}`} food={food} type="custom" />
                    ))}
                  </div>
                </section>
              )}
              
              {/* Saved Cached Foods */}
              {savedCachedFoods.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4">{t('foods.savedFoods')}</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {savedCachedFoods.map((food: CachedFood) => (
                      <FoodCard key={`cached-${food.id}`} food={food} type="cached" />
                    ))}
                  </div>
                </section>
              )}
              
              {filteredSavedFoods.length === 0 && savedCachedFoods.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Apple className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">{t('foods.noFoods')}</h3>
                    <p className="text-muted-foreground text-center mt-1">
                      {t('foods.noFoodsDescription')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="mt-6">
          {loadingCached ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : recentCachedFoods.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentCachedFoods.map((food: CachedFood) => (
                <FoodCard key={`cached-${food.id}`} food={food} type="cached" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t('foods.noRecent')}</h3>
                <p className="text-muted-foreground text-center mt-1">
                  {t('foods.noRecentDescription')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
