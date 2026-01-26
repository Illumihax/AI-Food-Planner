import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useGoalStore } from '@/stores/goalStore'
import { useDailyMeals } from '@/hooks/useMeals'
import { getTodayDate, formatNumber, calculateProgress } from '@/lib/utils'
import { Plus, BookOpen, ChefHat, MessageSquare, Flame, Beef, Wheat, Droplets } from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation()
  const { currentGoal } = useGoalStore()
  const { data: dailyMeals } = useDailyMeals(getTodayDate())

  const totals = dailyMeals || {
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
  }

  const macros = [
    {
      name: t('macros.calories'),
      current: totals.total_calories,
      target: currentGoal?.daily_calories || 2000,
      unit: t('macros.kcal'),
      icon: Flame,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      name: t('macros.protein'),
      current: totals.total_protein,
      target: currentGoal?.daily_protein || 150,
      unit: t('macros.grams'),
      icon: Beef,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      name: t('macros.carbs'),
      current: totals.total_carbs,
      target: currentGoal?.daily_carbs || 250,
      unit: t('macros.grams'),
      icon: Wheat,
      color: 'bg-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      name: t('macros.fat'),
      current: totals.total_fat,
      target: currentGoal?.daily_fat || 65,
      unit: t('macros.grams'),
      icon: Droplets,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ]

  const quickActions = [
    { name: t('dashboard.logFood'), href: '/diary', icon: Plus },
    { name: t('dashboard.viewDiary'), href: '/diary', icon: BookOpen },
    { name: t('dashboard.createRecipe'), href: '/recipes', icon: ChefHat },
    { name: t('dashboard.askAi'), href: '/ai-chat', icon: MessageSquare },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
      </div>

      {/* Today's Summary */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.todaysSummary')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {macros.map((macro) => (
            <Card key={macro.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{macro.name}</CardTitle>
                <div className={`p-2 rounded-full ${macro.bgColor}`}>
                  <macro.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(macro.current, 0)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {formatNumber(macro.target, 0)} {macro.unit}
                  </span>
                </div>
                <Progress
                  value={calculateProgress(macro.current, macro.target)}
                  className="mt-2 h-2"
                  indicatorClassName={macro.color}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {macro.current <= macro.target
                    ? `${formatNumber(macro.target - macro.current, 0)} ${macro.unit} ${t('diary.remaining')}`
                    : `${formatNumber(macro.current - macro.target, 0)} ${macro.unit} ${t('diary.over')}`
                  }
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.name} to={action.href}>
              <Card className="cursor-pointer transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-2 rounded-full bg-primary/10">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">{action.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* No Goals Warning */}
      {!currentGoal && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardHeader>
            <CardTitle className="text-lg">{t('goals.noGoals')}</CardTitle>
            <CardDescription>{t('goals.setFirst')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/goals">
              <Button>{t('goals.setGoals')}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
