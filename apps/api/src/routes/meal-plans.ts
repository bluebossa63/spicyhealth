import { Router } from 'express';

export const mealPlansRouter = Router();

// GET /api/meal-plans/current — current week's plan
mealPlansRouter.get('/current', async (req, res) => {
  // TODO: fetch from Cosmos DB
  res.json({ mealPlan: null });
});

// PUT /api/meal-plans/:id/day/:date — update a day slot
mealPlansRouter.put('/:id/day/:date', async (req, res) => {
  // TODO: update day plan (drag-and-drop save)
  res.json({ success: true });
});
