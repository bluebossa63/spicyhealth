import { Router } from 'express';

export const shoppingListRouter = Router();

// GET /api/shopping-list — get list for current week
shoppingListRouter.get('/', async (req, res) => {
  res.json({ items: [] });
});

// POST /api/shopping-list/generate — generate from meal plan
shoppingListRouter.post('/generate', async (req, res) => {
  const { mealPlanId } = req.body;
  // TODO: aggregate ingredients from all recipes in the plan
  res.json({ items: [] });
});

// PATCH /api/shopping-list/:itemId — mark purchased
shoppingListRouter.patch('/:itemId', async (req, res) => {
  res.json({ success: true });
});
