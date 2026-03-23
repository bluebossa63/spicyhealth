import { Router, Request, Response } from 'express';
import { lookupNutrition, searchByName } from '../services/nutrition';
import { searchSwissProducts } from '../services/swiss-products';

export const nutritionRouter = Router();

// GET /api/nutrition/search?q=avocado
nutritionRouter.get('/search', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q) return res.status(400).json({ error: 'q parameter required' });

  // First: search local Swiss product database
  const swissResults = searchSwissProducts(q);
  const localProducts = swissResults.map(p => ({
    product_name: p.name,
    brands: p.brand,
    nutriments: {
      'energy-kcal_100g': p.per100g.calories,
      'proteins_100g': p.per100g.proteinG,
      'carbohydrates_100g': p.per100g.carbsG,
      'fat_100g': p.per100g.fatG,
      'fiber_100g': p.per100g.fiberG,
    },
  }));

  // Then: search Open Food Facts for additional results
  let offProducts: any[] = [];
  if (localProducts.length < 5) {
    try {
      offProducts = await searchByName(q);
    } catch { /* ignore OFF errors */ }
  }

  // Combine: Swiss products first, then OFF
  const combined = [...localProducts, ...offProducts].slice(0, 8);
  res.json({ products: combined });
});

// GET /api/nutrition/:barcode
nutritionRouter.get('/:barcode', async (req: Request, res: Response) => {
  const product = await lookupNutrition(req.params.barcode);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});
