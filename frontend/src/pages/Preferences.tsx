import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePreferences, useUpdatePreferences, DietaryRestrictions, PreferencesUpdate } from '@/hooks/usePreferences'
import { 
  Heart, 
  HeartOff, 
  AlertTriangle, 
  Leaf, 
  Clock, 
  Wallet,
  X,
  Plus,
  Save
} from 'lucide-react'

const defaultDietaryRestrictions: DietaryRestrictions = {
  vegan: false,
  vegetarian: false,
  pescatarian: false,
  gluten_free: false,
  dairy_free: false,
  nut_free: false,
  halal: false,
  kosher: false,
  low_carb: false,
  keto: false,
}

const commonAllergies = [
  'Peanuts',
  'Tree nuts',
  'Milk',
  'Eggs',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
]

export default function Preferences() {
  const { t } = useTranslation()
  const { data: preferences, isLoading } = usePreferences()
  const updatePreferences = useUpdatePreferences()

  const [likedFoods, setLikedFoods] = useState<string[]>([])
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([])
  const [allergies, setAllergies] = useState<string[]>([])
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestrictions>(defaultDietaryRestrictions)
  const [budgetPreference, setBudgetPreference] = useState<'low' | 'medium' | 'high' | null>(null)
  const [maxCookingTime, setMaxCookingTime] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  
  const [newLikedFood, setNewLikedFood] = useState('')
  const [newDislikedFood, setNewDislikedFood] = useState('')
  const [newAllergy, setNewAllergy] = useState('')

  useEffect(() => {
    if (preferences) {
      setLikedFoods(preferences.liked_foods || [])
      setDislikedFoods(preferences.disliked_foods || [])
      setAllergies(preferences.allergies || [])
      setDietaryRestrictions(preferences.dietary_restrictions || defaultDietaryRestrictions)
      setBudgetPreference(preferences.budget_preference)
      setMaxCookingTime(preferences.max_cooking_time_minutes)
      setNotes(preferences.notes || '')
    }
  }, [preferences])

  const handleSave = async () => {
    const data: PreferencesUpdate = {
      liked_foods: likedFoods,
      disliked_foods: dislikedFoods,
      allergies,
      dietary_restrictions: dietaryRestrictions,
      budget_preference: budgetPreference,
      max_cooking_time_minutes: maxCookingTime,
      notes: notes || null,
    }
    
    try {
      await updatePreferences.mutateAsync(data)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  }

  const addLikedFood = () => {
    if (newLikedFood.trim() && !likedFoods.includes(newLikedFood.trim())) {
      setLikedFoods([...likedFoods, newLikedFood.trim()])
      setNewLikedFood('')
    }
  }

  const addDislikedFood = () => {
    if (newDislikedFood.trim() && !dislikedFoods.includes(newDislikedFood.trim())) {
      setDislikedFoods([...dislikedFoods, newDislikedFood.trim()])
      setNewDislikedFood('')
    }
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()])
      setNewAllergy('')
    }
  }

  const toggleDietaryRestriction = (key: keyof DietaryRestrictions) => {
    setDietaryRestrictions({
      ...dietaryRestrictions,
      [key]: !dietaryRestrictions[key],
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const dietaryOptions: { key: keyof DietaryRestrictions; label: string }[] = [
    { key: 'vegan', label: t('preferences.dietary.vegan') },
    { key: 'vegetarian', label: t('preferences.dietary.vegetarian') },
    { key: 'pescatarian', label: t('preferences.dietary.pescatarian') },
    { key: 'gluten_free', label: t('preferences.dietary.glutenFree') },
    { key: 'dairy_free', label: t('preferences.dietary.dairyFree') },
    { key: 'nut_free', label: t('preferences.dietary.nutFree') },
    { key: 'halal', label: t('preferences.dietary.halal') },
    { key: 'kosher', label: t('preferences.dietary.kosher') },
    { key: 'low_carb', label: t('preferences.dietary.lowCarb') },
    { key: 'keto', label: t('preferences.dietary.keto') },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('preferences.title')}</h1>
          <p className="text-muted-foreground">{t('preferences.description')}</p>
        </div>
        <Button onClick={handleSave} disabled={updatePreferences.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updatePreferences.isPending ? t('common.loading') : t('common.save')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Liked Foods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-green-500" />
              {t('preferences.likedFoods')}
            </CardTitle>
            <CardDescription>{t('preferences.likedFoodsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                value={newLikedFood}
                onChange={(e) => setNewLikedFood(e.target.value)}
                placeholder={t('preferences.addFood')}
                onKeyDown={(e) => e.key === 'Enter' && addLikedFood()}
              />
              <Button size="icon" onClick={addLikedFood}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {likedFoods.map((food) => (
                <span
                  key={food}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm"
                >
                  {food}
                  <button
                    onClick={() => setLikedFoods(likedFoods.filter((f) => f !== food))}
                    className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Disliked Foods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartOff className="h-5 w-5 text-red-500" />
              {t('preferences.dislikedFoods')}
            </CardTitle>
            <CardDescription>{t('preferences.dislikedFoodsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                value={newDislikedFood}
                onChange={(e) => setNewDislikedFood(e.target.value)}
                placeholder={t('preferences.addFood')}
                onKeyDown={(e) => e.key === 'Enter' && addDislikedFood()}
              />
              <Button size="icon" onClick={addDislikedFood}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {dislikedFoods.map((food) => (
                <span
                  key={food}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm"
                >
                  {food}
                  <button
                    onClick={() => setDislikedFoods(dislikedFoods.filter((f) => f !== food))}
                    className="hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Allergies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t('preferences.allergies')}
            </CardTitle>
            <CardDescription>{t('preferences.allergiesDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder={t('preferences.addAllergy')}
                onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
              />
              <Button size="icon" onClick={addAllergy}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {allergies.map((allergy) => (
                <span
                  key={allergy}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm"
                >
                  {allergy}
                  <button
                    onClick={() => setAllergies(allergies.filter((a) => a !== allergy))}
                    className="hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">{t('preferences.commonAllergies')}</p>
              <div className="flex flex-wrap gap-2">
                {commonAllergies.filter(a => !allergies.includes(a)).map((allergy) => (
                  <button
                    key={allergy}
                    onClick={() => setAllergies([...allergies, allergy])}
                    className="px-3 py-1 rounded-full border border-dashed hover:bg-muted text-sm"
                  >
                    + {allergy}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dietary Restrictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-500" />
              {t('preferences.dietaryRestrictions')}
            </CardTitle>
            <CardDescription>{t('preferences.dietaryRestrictionsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {dietaryOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => toggleDietaryRestriction(option.key)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    dietaryRestrictions[option.key]
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className={dietaryRestrictions[option.key] ? 'font-medium' : ''}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Budget Preference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              {t('preferences.budget')}
            </CardTitle>
            <CardDescription>{t('preferences.budgetDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setBudgetPreference(budgetPreference === level ? null : level)}
                  className={`flex-1 p-3 rounded-lg border text-center transition-colors ${
                    budgetPreference === level
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className={budgetPreference === level ? 'font-medium' : ''}>
                    {t(`preferences.budgetLevels.${level}`)}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cooking Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              {t('preferences.cookingTime')}
            </CardTitle>
            <CardDescription>{t('preferences.cookingTimeDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="5"
                  max="480"
                  value={maxCookingTime || ''}
                  onChange={(e) => setMaxCookingTime(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="60"
                  className="w-24"
                />
                <span className="text-muted-foreground">{t('preferences.minutes')}</span>
              </div>
              <div className="flex gap-2">
                {[15, 30, 45, 60, 90, 120].map((time) => (
                  <button
                    key={time}
                    onClick={() => setMaxCookingTime(time)}
                    className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                      maxCookingTime === time
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {time}m
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>{t('preferences.notes')}</CardTitle>
          <CardDescription>{t('preferences.notesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('preferences.notesPlaceholder')}
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  )
}
