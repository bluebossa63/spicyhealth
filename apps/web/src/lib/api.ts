const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  recipes: {
    list: (params?: Record<string, string>) =>
      fetchJson<{ recipes: any[]; total: number }>(`/recipes?${new URLSearchParams(params)}`),
    get: (id: string) => fetchJson<{ recipe: any }>(`/recipes/${id}`),
    quickAdd: (id: string) => fetchJson(`/recipes/${id}/quick-add`, { method: 'POST' }),
  },
  mealPlans: {
    current: () => fetchJson<{ mealPlan: any }>('/meal-plans/current'),
  },
  shoppingList: {
    get: () => fetchJson<{ items: any[] }>('/shopping-list'),
    generate: (mealPlanId: string) =>
      fetchJson('/shopping-list/generate', { method: 'POST', body: JSON.stringify({ mealPlanId }) }),
  },
};
