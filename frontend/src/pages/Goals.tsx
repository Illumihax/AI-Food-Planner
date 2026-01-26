import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useGoalStore } from '@/stores/goalStore'
import { useCreateGoal } from '@/hooks/useGoals'
import { formatNumber } from '@/lib/utils'
import { Target, Flame, Beef, Wheat, Droplets } from 'lucide-react'

export default function Goals() {
  const { t } = useTranslation()
  const { currentGoal, setCurrentGoal } = useGoalStore()
  const createGoal = useCreateGoal()

  const [formData, setFormData] = useState({
    daily_calories: currentGoal?.daily_calories || 2000,
    daily_protein: currentGoal?.daily_protein || 150,
    daily_carbs: currentGoal?.daily_carbs || 250,
    daily_fat: currentGoal?.daily_fat || 65,
    notes: currentGoal?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newGoal = await createGoal.mutateAsync(formData)
      setCurrentGoal(newGoal)
    } catch (error) {
      console.error('Failed to save goal:', error)
    }
  }

  const macroCards = [
    {
      name: t('goals.dailyCalories'),
      key: 'daily_calories',
      value: formData.daily_calories,
      icon: Flame,
      unit: t('macros.kcal'),
      color: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      name: t('goals.dailyProtein'),
      key: 'daily_protein',
      value: formData.daily_protein,
      icon: Beef,
      unit: t('macros.grams'),
      color: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      name: t('goals.dailyCarbs'),
      key: 'daily_carbs',
      value: formData.daily_carbs,
      icon: Wheat,
      unit: t('macros.grams'),
      color: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      name: t('goals.dailyFat'),
      key: 'daily_fat',
      value: formData.daily_fat,
      icon: Droplets,
      unit: t('macros.grams'),
      color: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('goals.title')}</h1>
        <p className="text-muted-foreground">{t('goals.setGoals')}</p>
      </div>

      {/* Current Goals Display */}
      {currentGoal && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Current Goals</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {macroCards.map((macro) => (
              <Card key={macro.key}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${macro.color}`}>
                      <macro.icon className={`h-6 w-6 ${macro.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {formatNumber(currentGoal[macro.key as keyof typeof currentGoal] as number, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">{macro.unit}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Goal Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {currentGoal ? t('common.edit') : t('goals.setGoals')}
          </CardTitle>
          <CardDescription>
            {t('app.tagline')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {macroCards.map((macro) => (
                <div key={macro.key} className="space-y-2">
                  <Label htmlFor={macro.key} className="flex items-center gap-2">
                    <macro.icon className={`h-4 w-4 ${macro.iconColor}`} />
                    {macro.name}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={macro.key}
                      type="number"
                      min="0"
                      value={formData[macro.key as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [macro.key]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="flex-1"
                    />
                    <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted rounded-md">
                      {macro.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('goals.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any notes about your goals..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={createGoal.isPending}>
              {createGoal.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
