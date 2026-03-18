import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { containers } from '../services/cosmos';

export const usersRouter = Router();

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
});

// GET /api/users/me
usersRouter.get('/me', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const { resource } = await containers.users.item(user.sub || user.oid, user.sub || user.oid).read();
    if (!resource) return res.status(404).json({ error: 'Profile not found' });
    res.json({ user: resource });
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/users/me
usersRouter.put('/me', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });

  try {
    const userId = user.sub || user.oid;
    const { resource: existing } = await containers.users.item(userId, userId).read();
    if (!existing) return res.status(404).json({ error: 'Profile not found' });

    const updated = { ...existing, ...parsed.data, updatedAt: new Date().toISOString() };
    const { resource } = await containers.users.items.upsert(updated);
    res.json({ user: resource });
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/me/saved-recipes/:recipeId
usersRouter.post('/me/saved-recipes/:recipeId', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { recipeId } = req.params;
  try {
    const userId = user.sub || user.oid;
    const { resource: existing } = await containers.users.item(userId, userId).read();
    if (!existing) return res.status(404).json({ error: 'Profile not found' });

    const savedRecipeIds: string[] = existing.savedRecipeIds || [];
    if (!savedRecipeIds.includes(recipeId)) savedRecipeIds.push(recipeId);
    const updated = { ...existing, savedRecipeIds };
    await containers.users.items.upsert(updated);
    res.json({ savedRecipeIds });
  } catch {
    res.status(500).json({ error: 'Failed to save recipe' });
  }
});

// DELETE /api/users/me/saved-recipes/:recipeId
usersRouter.delete('/me/saved-recipes/:recipeId', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { recipeId } = req.params;
  try {
    const userId = user.sub || user.oid;
    const { resource: existing } = await containers.users.item(userId, userId).read();
    if (!existing) return res.status(404).json({ error: 'Profile not found' });

    const savedRecipeIds: string[] = (existing.savedRecipeIds || []).filter((id: string) => id !== recipeId);
    const updated = { ...existing, savedRecipeIds };
    await containers.users.items.upsert(updated);
    res.json({ savedRecipeIds });
  } catch {
    res.status(500).json({ error: 'Failed to unsave recipe' });
  }
});
