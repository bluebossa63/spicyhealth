import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { containers } from '../services/cosmos';
import type { Recipe } from '@spicyhealth/shared';

export const recipesRouter = Router();

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(0).default(1),
  unit: z.string().default(''),
  calories: z.number().optional(),
  proteinG: z.number().optional(),
  carbsG: z.number().optional(),
  fatG: z.number().optional(),
  fiberG: z.number().optional(),
  estimatedCostEur: z.number().optional(),
  openFoodFactsId: z.string().optional(),
});

const recipeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  category: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'smoothie']),
  imageUrl: z.string().url().optional().or(z.literal('')),
  prepTimeMinutes: z.number().int().min(0).default(0),
  cookTimeMinutes: z.number().int().min(0).default(0),
  servings: z.number().int().min(1).default(1),
  ingredients: z.array(ingredientSchema).default([]),
  instructions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  estimatedCostEur: z.number().min(0).default(0),
});

// GET /api/recipes
recipesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search, maxCalories, maxPrepTime, maxCost, page = '1', pageSize = '12' } = req.query;

    let query = 'SELECT * FROM c WHERE (NOT IS_DEFINED(c.deleted) OR c.deleted = false)';
    const params: { name: string; value: any }[] = [];

    if (category) {
      query += ' AND c.category = @category';
      params.push({ name: '@category', value: category });
    }
    if (maxCalories) {
      query += ' AND c.nutrition.calories <= @maxCalories';
      params.push({ name: '@maxCalories', value: Number(maxCalories) });
    }
    if (maxPrepTime) {
      query += ' AND (c.prepTimeMinutes + c.cookTimeMinutes) <= @maxPrepTime';
      params.push({ name: '@maxPrepTime', value: Number(maxPrepTime) });
    }
    if (maxCost) {
      query += ' AND c.estimatedCostEur <= @maxCost';
      params.push({ name: '@maxCost', value: Number(maxCost) });
    }
    if (search) {
      // Cosmos DB LOWER() only lowercases ASCII — breaks umlauts (ä ö ü ß).
      // Search both original and lowercased (ASCII-safe) to cover mixed-case ASCII titles.
      query += ' AND (CONTAINS(c.title, @search) OR CONTAINS(c.description, @search) OR CONTAINS(LOWER(c.title), @searchLower) OR CONTAINS(LOWER(c.description), @searchLower))';
      params.push({ name: '@search', value: String(search) });
      params.push({ name: '@searchLower', value: String(search).toLowerCase() });
    }

    const offset = (Number(page) - 1) * Number(pageSize);
    query += ` OFFSET ${offset} LIMIT ${pageSize}`;

    const { resources } = await containers.recipes.items.query({ query, parameters: params }).fetchAll();
    res.json({ recipes: resources, total: resources.length, page: Number(page), pageSize: Number(pageSize) });
  } catch (err: any) {
    console.error('GET /recipes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// GET /api/recipes/:id
recipesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Cross-partition query since we don't have the category as partition key here
    const { resources } = await containers.recipes.items.query({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }]
    }).fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ recipe: resources[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// POST /api/recipes
recipesRouter.post('/', async (req: Request, res: Response) => {
  const parsed = recipeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });

  try {
    const user = (req as any).user;
    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: uuidv4(),
      ...parsed.data,
      nutrition: calculateNutrition(parsed.data.ingredients),
      authorId: user?.sub || user?.oid || 'anonymous',
      createdAt: now,
      updatedAt: now,
    };
    await containers.recipes.items.create(recipe);
    res.status(201).json({ recipe });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// PUT /api/recipes/:id
recipesRouter.put('/:id', async (req: Request, res: Response) => {
  const parsed = recipeSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });

  try {
    const { resources } = await containers.recipes.items.query({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: req.params.id }]
    }).fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Recipe not found' });

    const user = (req as any).user;
    const existing = resources[0];
    if (existing.authorId !== (user?.sub || user?.oid)) return res.status(403).json({ error: 'Forbidden' });

    const updated = { ...existing, ...parsed.data, updatedAt: new Date().toISOString() };
    if (parsed.data.ingredients) updated.nutrition = calculateNutrition(updated.ingredients);
    await containers.recipes.items.upsert(updated);
    res.json({ recipe: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// DELETE /api/recipes/:id (soft delete)
recipesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { resources } = await containers.recipes.items.query({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: req.params.id }]
    }).fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Recipe not found' });

    const user = (req as any).user;
    const existing = resources[0];
    if (existing.authorId !== (user?.sub || user?.oid)) return res.status(403).json({ error: 'Forbidden' });

    await containers.recipes.items.upsert({ ...existing, deleted: true, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// POST /api/recipes/:id/quick-add (log to today's meal plan)
recipesRouter.post('/:id/quick-add', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.oid;
    const { resources: recipeRes } = await containers.recipes.items.query({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: req.params.id }]
    }).fetchAll();
    if (!recipeRes.length) return res.status(404).json({ error: 'Recipe not found' });

    const today = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStart(today);

    // Get or create meal plan for this week
    const { resources: planRes } = await (containers as any).mealPlans.items.query({
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.weekStart = @weekStart',
      parameters: [{ name: '@userId', value: userId }, { name: '@weekStart', value: weekStart }]
    }).fetchAll();

    const hour = new Date().getHours();
    const slot = hour < 10 ? 'breakfast' : hour < 14 ? 'lunch' : hour < 18 ? 'dinner' : 'snacks';

    let plan = planRes[0] || { id: uuidv4(), userId, weekStart, days: [] };
    let day = plan.days.find((d: any) => d.date === today);
    if (!day) { day = { date: today, snacks: [] }; plan.days.push(day); }

    if (slot === 'snacks') { day.snacks = [...(day.snacks || []), recipeRes[0]]; }
    else { day[slot] = recipeRes[0]; }

    await (containers as any).mealPlans.items.upsert(plan);
    res.json({ success: true, slot });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to quick-add recipe' });
  }
});

// POST /api/recipes/:id/comments
recipesRouter.post('/:id/comments', async (req: Request, res: Response) => {
  const schema = z.object({ body: z.string().min(1).max(2000), parentId: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  try {
    const user = (req as any).user;
    const comment = {
      id: uuidv4(),
      recipeId: req.params.id,
      userId: user?.sub || user?.oid,
      parentId: parsed.data.parentId,
      body: parsed.data.body,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    await containers.comments.items.create(comment);
    res.status(201).json({ comment });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /api/recipes/:id/comments
recipesRouter.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { resources } = await containers.comments.items.query({
      query: 'SELECT * FROM c WHERE c.recipeId = @recipeId ORDER BY c.createdAt ASC',
      parameters: [{ name: '@recipeId', value: req.params.id }]
    }).fetchAll();
    res.json({ comments: resources });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/recipes/upload-image — returns SAS URL for direct Blob upload
recipesRouter.post('/upload-image', async (req: Request, res: Response) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' });

    const accountName = process.env.STORAGE_ACCOUNT!;
    const accountKey = process.env.STORAGE_KEY!;
    const containerName = process.env.STORAGE_CONTAINER || 'media';
    const blobName = `recipes/${uuidv4()}-${filename}`;

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const expiresOn = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    const sas = generateBlobSASQueryParameters(
      { containerName, blobName, permissions: BlobSASPermissions.parse('w'), expiresOn, contentType },
      sharedKeyCredential
    ).toString();

    const uploadUrl = `${blockBlobClient.url}?${sas}`;
    const publicUrl = blockBlobClient.url;

    res.json({ uploadUrl, publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// --- helpers ---
function calculateNutrition(ingredients: any[]) {
  return ingredients.reduce((acc, ing) => ({
    calories: acc.calories + (ing.calories || 0),
    proteinG: acc.proteinG + (ing.proteinG || 0),
    carbsG: acc.carbsG + (ing.carbsG || 0),
    fatG: acc.fatG + (ing.fatG || 0),
    fiberG: acc.fiberG + (ing.fiberG || 0),
  }), { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 });
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}
