import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRecipes } from '@/hooks/useRecipes'
import { formatNumber } from '@/lib/utils'
import { Plus, Search, ChefHat, Trash2, Edit } from 'lucide-react'
import CreateRecipeDialog from '@/components/recipes/CreateRecipeDialog'

export default function Recipes() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  
  const { data: recipes, isLoading } = useRecipes(search)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('recipes.title')}</h1>
          <p className="text-muted-foreground">{t('app.tagline')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('recipes.create')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Recipe Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      ) : recipes && recipes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe: any) => (
            <Card key={recipe.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{recipe.name}</CardTitle>
                    <CardDescription>
                      {recipe.servings} {t('meals.servings')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recipe.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {recipe.description}
                  </p>
                )}
                
                {/* Per Serving Macros */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('recipes.perServing')}</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30">
                      <p className="text-lg font-bold">{formatNumber(recipe.calories_per_serving, 0)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.kcal')}</p>
                    </div>
                    <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                      <p className="text-lg font-bold">{formatNumber(recipe.protein_per_serving, 0)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.protein')}</p>
                    </div>
                    <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                      <p className="text-lg font-bold">{formatNumber(recipe.carbs_per_serving, 0)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.carbs')}</p>
                    </div>
                    <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
                      <p className="text-lg font-bold">{formatNumber(recipe.fat_per_serving, 0)}</p>
                      <p className="text-xs text-muted-foreground">{t('macros.fat')}</p>
                    </div>
                  </div>
                </div>

                {/* Ingredients count */}
                <p className="text-sm text-muted-foreground mt-4">
                  {recipe.ingredients?.length || 0} {t('recipes.ingredients').toLowerCase()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('recipes.noRecipes')}</h3>
            <p className="text-muted-foreground mb-4">{t('recipes.createFirst')}</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('recipes.create')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Recipe Dialog */}
      <CreateRecipeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
