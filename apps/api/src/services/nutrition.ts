// Open Food Facts API integration for per-ingredient nutrition data

const OPEN_FOOD_FACTS_BASE = 'https://world.openfoodfacts.org/api/v2';

export interface FoodFactsProduct {
  product_name: string;
  nutriments: {
    'energy-kcal_100g': number;
    proteins_100g: number;
    carbohydrates_100g: number;
    fat_100g: number;
    fiber_100g?: number;
  };
}

export async function lookupNutrition(barcode: string): Promise<FoodFactsProduct | null> {
  const res = await fetch(`${OPEN_FOOD_FACTS_BASE}/product/${barcode}.json`);
  if (!res.ok) return null;
  const data = await res.json() as { status: number; product: FoodFactsProduct };
  return data.status === 1 ? data.product : null;
}

export async function searchByName(query: string): Promise<FoodFactsProduct[]> {
  const params = new URLSearchParams({ search_terms: query, json: '1', page_size: '5' });
  const res = await fetch(`${OPEN_FOOD_FACTS_BASE}/search?${params}`);
  if (!res.ok) return [];
  const data = await res.json() as { products: FoodFactsProduct[] };
  return data.products ?? [];
}

export function calculateNutrition(
  product: FoodFactsProduct,
  quantityGrams: number
) {
  const factor = quantityGrams / 100;
  return {
    calories: Math.round((product.nutriments['energy-kcal_100g'] ?? 0) * factor),
    proteinG: Math.round((product.nutriments['proteins_100g'] ?? 0) * factor * 10) / 10,
    carbsG: Math.round((product.nutriments['carbohydrates_100g'] ?? 0) * factor * 10) / 10,
    fatG: Math.round((product.nutriments['fat_100g'] ?? 0) * factor * 10) / 10,
    fiberG: Math.round((product.nutriments['fiber_100g'] ?? 0) * factor * 10) / 10,
  };
}
