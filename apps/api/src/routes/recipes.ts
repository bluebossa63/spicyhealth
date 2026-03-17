import { Router } from 'express';
import type { Recipe } from '@spicyhealth/shared';

export const recipesRouter = Router();

// GET /api/recipes — list with filters
recipesRouter.get('/', async (req, res) => {
  const { category, maxCalories, maxPrepTime, search } = req.query;
  // TODO: query Cosmos DB with filters
  res.json({ recipes: [], total: 0 });
});

// GET /api/recipes/:id
recipesRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  // TODO: fetch from Cosmos DB
  res.json({ recipe: null });
});

// POST /api/recipes
recipesRouter.post('/', async (req, res) => {
  const body = req.body as Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;
  // TODO: validate & save to Cosmos DB
  res.status(201).json({ recipe: null });
});

// POST /api/recipes/:id/comments
recipesRouter.post('/:id/comments', async (req, res) => {
  // TODO: add comment
  res.status(201).json({ comment: null });
});

// POST /api/recipes/:id/quick-add
recipesRouter.post('/:id/quick-add', async (req, res) => {
  // Logs recipe to today's meal plan
  // TODO: upsert today's DayPlan in Cosmos DB
  res.json({ success: true });
});
