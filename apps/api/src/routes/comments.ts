import { Router, Request, Response } from 'express';
import { containers } from '../services/cosmos';

export const commentsRouter = Router();

// POST /api/comments/:id/like
commentsRouter.post('/:id/like', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  try {
    const { resources } = await containers.comments.items.query({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }],
    }).fetchAll();
    const comment = resources[0];
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const likedBy: string[] = comment.likedBy || [];
    const userId = user.sub || user.oid;
    const liked = likedBy.includes(userId);
    const updatedLikedBy = liked ? likedBy.filter((u: string) => u !== userId) : [...likedBy, userId];
    const updated = { ...comment, likedBy: updatedLikedBy, likes: updatedLikedBy.length };
    await containers.comments.items.upsert(updated);
    res.json({ likes: updated.likes, liked: !liked });
  } catch {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// POST /api/comments/:id/react
commentsRouter.post('/:id/react', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { emoji } = req.body; // 'thumbs_up' | 'heart' | 'yum' | 'fire'
  const VALID = ['thumbs_up', 'heart', 'yum', 'fire'];
  if (!VALID.includes(emoji)) return res.status(400).json({ error: 'Invalid emoji' });

  try {
    const { resources } = await containers.comments.items.query({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }],
    }).fetchAll();
    const comment = resources[0];
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const userId = user.sub || user.oid;
    const reactions: Record<string, string[]> = comment.reactions || {};
    VALID.forEach(e => { if (!reactions[e]) reactions[e] = []; });

    // Toggle: remove from all, then add if not present
    const alreadyReacted = reactions[emoji].includes(userId);
    VALID.forEach(e => { reactions[e] = reactions[e].filter((u: string) => u !== userId); });
    if (!alreadyReacted) reactions[emoji].push(userId);

    const reactionCounts = Object.fromEntries(VALID.map(e => [e, reactions[e].length]));
    const updated = { ...comment, reactions, reactionCounts };
    await containers.comments.items.upsert(updated);
    res.json({ reactionCounts });
  } catch {
    res.status(500).json({ error: 'Failed to react' });
  }
});

// DELETE /api/comments/:id
commentsRouter.delete('/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  try {
    const { resources } = await containers.comments.items.query({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }],
    }).fetchAll();
    const comment = resources[0];
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    const userId = user.sub || user.oid;
    if (comment.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    await containers.comments.item(id, comment.recipeId).delete();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});
