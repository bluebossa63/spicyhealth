const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('auth') || '{}').token || null; } catch { return null; }
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

export interface RecipeFilters {
  category?: string;
  search?: string;
  maxCalories?: number;
  maxPrepTime?: number;
  maxCost?: number;
  page?: number;
  pageSize?: number;
}

export const api = {
  recipes: {
    list: (filters?: RecipeFilters) => {
      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.maxCalories) params.set('maxCalories', String(filters.maxCalories));
      if (filters?.maxPrepTime) params.set('maxPrepTime', String(filters.maxPrepTime));
      if (filters?.maxCost) params.set('maxCost', String(filters.maxCost));
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
      const qs = params.toString();
      return fetchJson<{ recipes: any[]; total: number }>(`/recipes${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => fetchJson<{ recipe: any }>(`/recipes/${id}`),
    create: (data: any) => fetchJson<{ recipe: any }>('/recipes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchJson<{ recipe: any }>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJson<{ success: boolean }>(`/recipes/${id}`, { method: 'DELETE' }),
    quickAdd: (id: string) => fetchJson<{ success: boolean; slot: string }>(`/recipes/${id}/quick-add`, { method: 'POST' }),
    getComments: (id: string) => fetchJson<{ comments: any[] }>(`/recipes/${id}/comments`),
    addComment: (id: string, body: string, parentId?: string) =>
      fetchJson<{ comment: any }>(`/recipes/${id}/comments`, { method: 'POST', body: JSON.stringify({ body, parentId }) }),
    requestUploadUrl: (filename: string, contentType: string) =>
      fetchJson<{ uploadUrl: string; publicUrl: string }>('/recipes/upload-image', { method: 'POST', body: JSON.stringify({ filename, contentType }) }),
  },
  nutrition: {
    search: (q: string) => fetchJson<{ products: any[] }>(`/nutrition/search?q=${encodeURIComponent(q)}`),
    lookup: (barcode: string) => fetchJson<{ product: any }>(`/nutrition/${barcode}`),
  },
  comments: {
    like: (id: string) => fetchJson<{ likes: number; liked: boolean }>(`/comments/${id}/like`, { method: 'POST' }),
    react: (id: string, emoji: string) => fetchJson<{ reactionCounts: Record<string, number> }>(`/comments/${id}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }),
    delete: (id: string) => fetchJson<{ success: boolean }>(`/comments/${id}`, { method: 'DELETE' }),
  },
  users: {
    me: () => fetchJson<{ user: any }>('/users/me'),
    update: (data: { displayName?: string; avatarUrl?: string; dietaryPreferences?: string[] }) =>
      fetchJson<{ user: any }>('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
    saveRecipe: (recipeId: string) => fetchJson<{ savedRecipeIds: string[] }>(`/users/me/saved-recipes/${recipeId}`, { method: 'POST' }),
    unsaveRecipe: (recipeId: string) => fetchJson<{ savedRecipeIds: string[] }>(`/users/me/saved-recipes/${recipeId}`, { method: 'DELETE' }),
    uploadAvatar: (filename: string, contentType: string) =>
      fetchJson<{ uploadUrl: string; publicUrl: string }>('/recipes/upload-image', { method: 'POST', body: JSON.stringify({ filename, contentType }) }),
  },
  mealPlans: {
    current: () => fetchJson<{ mealPlan: any }>('/meal-plans/current'),
    forWeek: (weekStart: string) => fetchJson<{ mealPlan: any }>(`/meal-plans?weekStart=${weekStart}`),
    updateSlot: (id: string, date: string, slot: string, recipe: any | null) =>
      fetchJson<{ mealPlan: any }>(`/meal-plans/${id}/day/${date}`, {
        method: 'PUT',
        body: JSON.stringify({ slot, recipe }),
      }),
    removeSlot: (id: string, date: string, slot: string, snackIndex?: number) => {
      const qs = snackIndex !== undefined ? `?snackIndex=${snackIndex}` : '';
      return fetchJson<{ mealPlan: any }>(`/meal-plans/${id}/day/${date}/slot/${slot}${qs}`, { method: 'DELETE' });
    },
  },
  shoppingList: {
    get: () => fetchJson<{ items: any[] }>('/shopping-list'),
    generate: (mealPlanId: string) =>
      fetchJson('/shopping-list/generate', { method: 'POST', body: JSON.stringify({ mealPlanId }) }),
  },
};
