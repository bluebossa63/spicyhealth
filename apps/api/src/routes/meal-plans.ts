import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { containers } from '../services/cosmos';

export const mealPlansRouter = Router();

function getWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function emptyDay(date: string) {
  return {
    date,
    breakfast: null,
    lunch: null,
    dinner: null,
    snacks: [],
    totalNutrition: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    totalCostEur: 0,
  };
}

function calcTotals(day: any) {
  const slots = [day.breakfast, day.lunch, day.dinner, ...(day.snacks || [])].filter(Boolean);
  const totals = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  let cost = 0;
  for (const r of slots) {
    const servings = r?.servings || 1;
    if (r?.nutrition) {
      totals.calories += (r.nutrition.calories || 0) / servings;
      totals.proteinG += (r.nutrition.proteinG || 0) / servings;
      totals.carbsG += (r.nutrition.carbsG || 0) / servings;
      totals.fatG += (r.nutrition.fatG || 0) / servings;
      totals.fiberG += (r.nutrition.fiberG || 0) / servings;
    }
    cost += (r?.estimatedCostEur || 0) / servings;
  }
  return { totalNutrition: totals, totalCostEur: Math.round(cost * 100) / 100 };
}

function buildWeekDays(weekStart: string): string[] {
  const days: string[] = [];
  const base = new Date(weekStart + 'T00:00:00Z');
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// GET /api/meal-plans/current
mealPlansRouter.get('/current', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user.sub || user.oid;
  const weekStart = getWeekStart();
  try {
    const { resources } = await containers.mealPlans.items.query({
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.weekStart = @weekStart',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@weekStart', value: weekStart },
      ],
    }).fetchAll();

    if (resources.length > 0) return res.json({ mealPlan: resources[0] });

    // Create empty plan for current week
    const days = buildWeekDays(weekStart).map(emptyDay);
    const plan = { id: uuidv4(), userId, weekStart, days, createdAt: new Date().toISOString() };
    await containers.mealPlans.items.create(plan);
    res.json({ mealPlan: plan });
  } catch (err: any) {
    console.error('GET /meal-plans/current error:', err.message);
    res.status(500).json({ error: 'Failed to fetch meal plan' });
  }
});

// GET /api/meal-plans?weekStart=YYYY-MM-DD
mealPlansRouter.get('/', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user.sub || user.oid;
  const weekStart = (req.query.weekStart as string) || getWeekStart();
  try {
    const { resources } = await containers.mealPlans.items.query({
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.weekStart = @weekStart',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@weekStart', value: weekStart },
      ],
    }).fetchAll();

    if (resources.length > 0) return res.json({ mealPlan: resources[0] });

    const days = buildWeekDays(weekStart).map(emptyDay);
    const plan = { id: uuidv4(), userId, weekStart, days, createdAt: new Date().toISOString() };
    await containers.mealPlans.items.create(plan);
    res.json({ mealPlan: plan });
  } catch (err: any) {
    console.error('GET /meal-plans error:', err.message);
    res.status(500).json({ error: 'Failed to fetch meal plan' });
  }
});

// PUT /api/meal-plans/:id/day/:date
// Body: { slot: 'breakfast'|'lunch'|'dinner'|'snacks', recipe: RecipeDoc | null }
mealPlansRouter.put('/:id/day/:date', async (req: Request, res: Response) => {
  const { id, date } = req.params;
  const { slot, recipe } = req.body;
  const VALID_SLOTS = ['breakfast', 'lunch', 'dinner', 'snacks'];
  if (!VALID_SLOTS.includes(slot)) return res.status(400).json({ error: 'Invalid slot' });

  try {
    const { resources } = await containers.mealPlans.items.query({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }],
    }).fetchAll();
    const plan = resources[0];
    if (!plan) return res.status(404).json({ error: 'Meal plan not found' });

    const dayIndex = plan.days.findIndex((d: any) => d.date === date);
    if (dayIndex === -1) return res.status(404).json({ error: 'Day not found' });

    const day = { ...plan.days[dayIndex] };
    if (slot === 'snacks') {
      if (recipe) {
        day.snacks = [...(day.snacks || []), recipe];
      } else {
        day.snacks = [];
      }
    } else {
      day[slot] = recipe;
    }
    const { totalNutrition, totalCostEur } = calcTotals(day);
    day.totalNutrition = totalNutrition;
    day.totalCostEur = totalCostEur;

    plan.days[dayIndex] = day;
    await containers.mealPlans.items.upsert(plan);
    res.json({ mealPlan: plan });
  } catch (err: any) {
    console.error('PUT /meal-plans/:id/day/:date error:', err.message);
    res.status(500).json({ error: 'Failed to update meal plan' });
  }
});

// DELETE /api/meal-plans/:id/day/:date/slot/:slot
mealPlansRouter.delete('/:id/day/:date/slot/:slot', async (req: Request, res: Response) => {
  const { id, date, slot } = req.params;
  const { snackIndex } = req.query; // for removing a specific snack
  try {
    const { resources } = await containers.mealPlans.items.query({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }],
    }).fetchAll();
    const plan = resources[0];
    if (!plan) return res.status(404).json({ error: 'Meal plan not found' });

    const dayIndex = plan.days.findIndex((d: any) => d.date === date);
    if (dayIndex === -1) return res.status(404).json({ error: 'Day not found' });

    const day = { ...plan.days[dayIndex] };
    if (slot === 'snacks' && snackIndex !== undefined) {
      day.snacks = (day.snacks || []).filter((_: any, i: number) => i !== Number(snackIndex));
    } else {
      day[slot] = null;
    }
    const { totalNutrition, totalCostEur } = calcTotals(day);
    day.totalNutrition = totalNutrition;
    day.totalCostEur = totalCostEur;

    plan.days[dayIndex] = day;
    await containers.mealPlans.items.upsert(plan);
    res.json({ mealPlan: plan });
  } catch (err: any) {
    console.error('DELETE /meal-plans slot error:', err.message);
    res.status(500).json({ error: 'Failed to remove recipe from slot' });
  }
});
