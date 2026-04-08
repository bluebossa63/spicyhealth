import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { containers } from '../services/cosmos';
import { notifyDailyLog } from '../services/notify-admin';

export const dailyLogsRouter = Router();

const updateLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  waterGlasses: z.number().int().min(0).max(20).optional(),
  mood: z.enum(['great', 'good', 'okay', 'tired', 'stressed']).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  sleepQuality: z.number().int().min(1).max(5).optional(),
  note: z.string().max(500).optional(),
});

// GET /api/daily-logs?date=2026-03-24
// GET /api/daily-logs?from=2026-03-18&to=2026-03-24
dailyLogsRouter.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub || (req as any).user?.oid;
  const { date, from, to } = req.query;

  try {
    if (date) {
      const { resources } = await containers.dailyLogs.items.query({
        query: 'SELECT * FROM c WHERE c.userId = @userId AND c.date = @date',
        parameters: [{ name: '@userId', value: userId }, { name: '@date', value: date }],
      }).fetchAll();
      res.json({ log: resources[0] || null });
    } else if (from && to) {
      const { resources } = await containers.dailyLogs.items.query({
        query: 'SELECT * FROM c WHERE c.userId = @userId AND c.date >= @from AND c.date <= @to ORDER BY c.date ASC',
        parameters: [{ name: '@userId', value: userId }, { name: '@from', value: from }, { name: '@to', value: to }],
      }).fetchAll();
      res.json({ logs: resources });
    } else {
      res.status(400).json({ error: 'date or from+to required' });
    }
  } catch {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// PUT /api/daily-logs — upsert a daily log
dailyLogsRouter.put('/', async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub || (req as any).user?.oid;
  const parsed = updateLogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const { date, ...data } = parsed.data;
    const id = `${userId}_${date}`;

    // Load existing or create new
    const { resources } = await containers.dailyLogs.items.query({
      query: 'SELECT * FROM c WHERE c.id = @id AND c.userId = @userId',
      parameters: [{ name: '@id', value: id }, { name: '@userId', value: userId }],
    }).fetchAll();

    const existing = resources[0] || { id, userId, date, waterGlasses: 0 };
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };

    await containers.dailyLogs.items.upsert(updated);
    const u = (req as any).user;
    notifyDailyLog(
      { water: updated.waterGlasses ?? 0, mood: updated.mood, energy: updated.energy },
      { id: userId, name: u?.name || u?.email || 'Unbekannt', email: u?.email || '—' }
    ).catch(() => {});
    res.json({ log: updated });
  } catch {
    res.status(500).json({ error: 'Failed to save log' });
  }
});
