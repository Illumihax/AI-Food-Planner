import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGoalStore } from '@/stores/goalStore'
import { useGenerateMealPlan } from '@/hooks/useAi'
import { formatNumber } from '@/lib/utils'
import { Calendar, Loader2, Sparkles } from 'lucide-react'

export default function MealPlanner() {
  const { t, i18n } = useTranslation()
  const { currentGoal } = useGoalStore()
  const generateMealPlan = useGenerateMealPlan()

  const [days, setDays] = useState(7)
  const [preferences, setPreferences] = useState('')
  const [restrictions, setRestrictions] = useState('')
  const [mealPlan, setMealPlan] = useState<any>(null)

  const handleGenerate = async () => {
    try {
      const result = await generateMealPlan.mutateAsync({
        use_current_goal: true,
        days,
        preferences: preferences ? preferences.split(',').map(p => p.trim()) : [],
        restrictions: restrictions ? restrictions.split(',').map(r => r.trim()) : [],
        language: i18n.language as 'en' | 'de',
      })
      setMealPlan(result)
    } catch (error) {
      console.error('Failed to generate meal plan:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('mealPlanner.title')}</h1>
        <p className="text-muted-foreground">{t('app.tagline')}</p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('mealPlanner.generate')}
          </CardTitle>
          <CardDescription>
            {currentGoal 
              ? `${t('mealPlanner.useCurrentGoals')}: ${formatNumber(currentGoal.daily_calories, 0)} kcal, ${formatNumber(currentGoal.daily_protein, 0)}g protein`
              : t('goals.noGoals')
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="days">{t('mealPlanner.days')}</Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="14"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 7)}
              />
            </div>
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

          <Button 
            onClick={handleGenerate} 
            disabled={generateMealPlan.isPending || !currentGoal}
            className="w-full md:w-auto"
          >
            {generateMealPlan.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('mealPlanner.generating')}
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                {t('mealPlanner.generate')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Meal Plan */}
      {mealPlan && mealPlan.days && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Your Meal Plan</h2>
          
          <Tabs defaultValue="1" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1">
              {mealPlan.days.map((day: any) => (
                <TabsTrigger key={day.day} value={String(day.day)}>
                  {t('mealPlanner.day')} {day.day}
                </TabsTrigger>
              ))}
            </TabsList>

            {mealPlan.days.map((day: any) => (
              <TabsContent key={day.day} value={String(day.day)}>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Meals */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('meals.breakfast')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{day.breakfast}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {day.breakfast_description}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('meals.lunch')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{day.lunch}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {day.lunch_description}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('meals.dinner')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{day.dinner}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {day.dinner_description}
                      </p>
                    </CardContent>
                  </Card>

                  {day.snacks && day.snacks.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('meals.snack')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1">
                          {day.snacks.map((snack: string, i: number) => (
                            <li key={i}>{snack}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Daily Macros Summary */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>{t('mealPlanner.estimatedMacros')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-3 rounded-md bg-orange-100 dark:bg-orange-900/30">
                        <p className="text-2xl font-bold">{formatNumber(day.estimated_calories, 0)}</p>
                        <p className="text-sm text-muted-foreground">{t('macros.kcal')}</p>
                      </div>
                      <div className="p-3 rounded-md bg-blue-100 dark:bg-blue-900/30">
                        <p className="text-2xl font-bold">{formatNumber(day.estimated_protein, 0)}</p>
                        <p className="text-sm text-muted-foreground">{t('macros.protein')}</p>
                      </div>
                      <div className="p-3 rounded-md bg-green-100 dark:bg-green-900/30">
                        <p className="text-2xl font-bold">{formatNumber(day.estimated_carbs, 0)}</p>
                        <p className="text-sm text-muted-foreground">{t('macros.carbs')}</p>
                      </div>
                      <div className="p-3 rounded-md bg-purple-100 dark:bg-purple-900/30">
                        <p className="text-2xl font-bold">{formatNumber(day.estimated_fat, 0)}</p>
                        <p className="text-sm text-muted-foreground">{t('macros.fat')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Notes */}
          {mealPlan.notes && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>{t('goals.notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{mealPlan.notes}</p>
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </div>
  )
}
