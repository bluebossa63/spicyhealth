// Open Food Facts API integration for per-ingredient nutrition data

const OPEN_FOOD_FACTS_BASE = 'https://world.openfoodfacts.org/api/v2';

export interface FoodFactsProduct {
  product_name: string;
  brands?: string;
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
  // Search with Swiss products first, then global fallback
  const chParams = new URLSearchParams({
    search_terms: query,
    json: '1',
    page_size: '10',
    countries_tags_en: 'switzerland',
    fields: 'product_name,brands,nutriments',
  });
  const chRes = await fetch(`${OPEN_FOOD_FACTS_BASE}/search?${chParams}`);
  let products: FoodFactsProduct[] = [];

  if (chRes.ok) {
    const chData = await chRes.json() as { products: FoodFactsProduct[] };
    products = (chData.products ?? []).filter(p =>
      p.product_name && p.nutriments?.['energy-kcal_100g'] > 0
    );
  }

  // If not enough Swiss results, search globally
  if (products.length < 3) {
    const globalParams = new URLSearchParams({
      search_terms: query,
      json: '1',
      page_size: '10',
      fields: 'product_name,brands,nutriments',
    });
    const globalRes = await fetch(`${OPEN_FOOD_FACTS_BASE}/search?${globalParams}`);
    if (globalRes.ok) {
      const globalData = await globalRes.json() as { products: FoodFactsProduct[] };
      const globalProducts = (globalData.products ?? []).filter(p =>
        p.product_name && p.nutriments?.['energy-kcal_100g'] > 0
      );
      // Add global results that aren't duplicates
      const existingNames = new Set(products.map(p => p.product_name?.toLowerCase()));
      for (const p of globalProducts) {
        if (!existingNames.has(p.product_name?.toLowerCase())) {
          products.push(p);
        }
      }
    }
  }

  return products.slice(0, 8);
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
