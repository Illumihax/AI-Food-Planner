const API_BASE = '/api'

interface RequestOptions {
  method?: string
  body?: any
  headers?: Record<string, string>
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new Error(error.detail || 'An error occurred')
  }

  return response.json()
}

// Foods API
export const foodsApi = {
  search: (query: string, page = 1, pageSize = 20, localOnly = false) =>
    request<any[]>(`/foods/search?query=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}&local_only=${localOnly}`),
  
  getByBarcode: (barcode: string) =>
    request<any>(`/foods/barcode/${barcode}`),
  
  getSaved: (skip = 0, limit = 100) =>
    request<any[]>(`/foods/saved?skip=${skip}&limit=${limit}`),
  
  create: (data: any) =>
    request<any>('/foods/', { method: 'POST', body: data }),
  
  delete: (id: number) =>
    request<void>(`/foods/${id}`, { method: 'DELETE' }),
  
  // Cached foods
  getCached: (savedOnly = false, skip = 0, limit = 100) =>
    request<any[]>(`/foods/cached?saved_only=${savedOnly}&skip=${skip}&limit=${limit}`),
  
  toggleSaveCached: (id: number) =>
    request<any>(`/foods/cached/${id}/save`, { method: 'PUT' }),
  
  updateCached: (id: number, data: any) =>
    request<any>(`/foods/cached/${id}`, { method: 'PUT', body: data }),
  
  deleteCached: (id: number) =>
    request<void>(`/foods/cached/${id}`, { method: 'DELETE' }),
  
  incrementUsage: (id: number) =>
    request<any>(`/foods/cached/${id}/increment-usage`, { method: 'POST' }),
}

// Recipes API
export const recipesApi = {
  getAll: (search?: string) =>
    request<any[]>(`/recipes/${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  
  get: (id: number) =>
    request<any>(`/recipes/${id}`),
  
  create: (data: any) =>
    request<any>('/recipes/', { method: 'POST', body: data }),
  
  update: (id: number, data: any) =>
    request<any>(`/recipes/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: number) =>
    request<void>(`/recipes/${id}`, { method: 'DELETE' }),
}

// Meals API
export const mealsApi = {
  getDaily: (date: string) =>
    request<any>(`/meals/daily/${date}`),
  
  create: (data: any) =>
    request<any>('/meals/', { method: 'POST', body: data }),
  
  addEntry: (mealId: number, data: any) =>
    request<any>(`/meals/${mealId}/entries`, { method: 'POST', body: data }),
  
  removeEntry: (mealId: number, entryId: number) =>
    request<void>(`/meals/${mealId}/entries/${entryId}`, { method: 'DELETE' }),
  
  delete: (id: number) =>
    request<void>(`/meals/${id}`, { method: 'DELETE' }),
}

// Goals API
export const goalsApi = {
  getCurrent: () =>
    request<any | null>('/goals/'),
  
  getHistory: () =>
    request<any[]>('/goals/history'),
  
  create: (data: any) =>
    request<any>('/goals/', { method: 'POST', body: data }),
  
  update: (id: number, data: any) =>
    request<any>(`/goals/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: number) =>
    request<void>(`/goals/${id}`, { method: 'DELETE' }),
}

// AI API
export const aiApi = {
  generateMealPlan: (data: any) =>
    request<any>('/ai/meal-plan', { method: 'POST', body: data }),
  
  suggestRecipes: (data: any) =>
    request<any>('/ai/suggest-recipes', { method: 'POST', body: data }),
  
  chat: (data: any) =>
    request<any>('/ai/chat', { method: 'POST', body: data }),
}

// Preferences API
export const preferencesApi = {
  get: () =>
    request<any | null>('/preferences/'),
  
  update: (data: any) =>
    request<any>('/preferences/', { method: 'PUT', body: data }),
}

// Week Plans API
export const weekPlansApi = {
  getAll: (status?: string) =>
    request<any[]>(`/week-plans/${status ? `?status=${status}` : ''}`),
  
  getDraft: () =>
    request<any | null>('/week-plans/draft'),
  
  get: (id: number) =>
    request<any>(`/week-plans/${id}`),
  
  create: (data: any) =>
    request<any>('/week-plans/', { method: 'POST', body: data }),
  
  update: (id: number, data: any) =>
    request<any>(`/week-plans/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: number) =>
    request<void>(`/week-plans/${id}`, { method: 'DELETE' }),
  
  addMeal: (planId: number, data: any) =>
    request<any>(`/week-plans/${planId}/meals`, { method: 'POST', body: data }),
  
  removeMeal: (planId: number, mealId: number) =>
    request<void>(`/week-plans/${planId}/meals/${mealId}`, { method: 'DELETE' }),
  
  clearDay: (planId: number, dayIndex: number) =>
    request<any>(`/week-plans/${planId}/days/${dayIndex}`, { method: 'DELETE' }),
  
  regenerateDay: (planId: number, data: { day_index: number; meal_type?: string; language?: string }) =>
    request<any>(`/week-plans/${planId}/regenerate-day`, { method: 'POST', body: data }),
  
  applyToDiary: (planId: number, targetStartDate: string) =>
    request<any>(`/week-plans/${planId}/apply-to-diary`, { 
      method: 'POST', 
      body: { target_start_date: targetStartDate } 
    }),
  
  createFromAiPlan: (data: any) =>
    request<any>('/week-plans/from-ai-plan', { method: 'POST', body: data }),
}
