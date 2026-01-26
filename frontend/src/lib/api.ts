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
  search: (query: string, page = 1, pageSize = 20) =>
    request<any[]>(`/foods/search?query=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`),
  
  getByBarcode: (barcode: string) =>
    request<any>(`/foods/barcode/${barcode}`),
  
  getSaved: (skip = 0, limit = 100) =>
    request<any[]>(`/foods/saved?skip=${skip}&limit=${limit}`),
  
  create: (data: any) =>
    request<any>('/foods/', { method: 'POST', body: data }),
  
  delete: (id: number) =>
    request<void>(`/foods/${id}`, { method: 'DELETE' }),
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
