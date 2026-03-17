import { Router, Request, Response } from 'express';
import { lookupNutrition, searchByName } from '../services/nutrition';

export const nutritionRouter = Router();

// GET /api/nutrition/search?q=avocado
nutritionRouter.get('/search', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q) return res.status(400).json({ error: 'q parameter required' });
  const products = await searchByName(q);
  res.json({ products });
});

// GET /api/nutrition/:barcode
nutritionRouter.get('/:barcode', async (req: Request, res: Response) => {
  const product = await lookupNutrition(req.params.barcode);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});
