import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { containers } from '../services/cosmos';
import { chatWithStyleConsultant } from '../services/anthropic';
import rateLimit from 'express-rate-limit';
import type { Conversation, ChatMessage } from '@spicyhealth/shared';

export const umstylingRouter = Router();

// Tighter rate limit for AI chat (20 req/min per user)
const chatLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  keyGenerator: (req: Request) => (req as any).user?.sub || (req as any).user?.oid || 'anon',
  standardHeaders: true,
  legacyHeaders: false,
});

const sendMessageSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(5000),
  imageUrls: z.array(z.string().url()).max(3).optional(),
});

// POST /api/umstyling/chat — send a message (create or continue conversation)
umstylingRouter.post('/chat', chatLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.oid;
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { conversationId, message, imageUrls } = parsed.data;
    let conversation: Conversation;

    if (conversationId) {
      // Load existing conversation
      const { resources } = await containers.conversations.items
        .query({ query: 'SELECT * FROM c WHERE c.id = @id AND c.userId = @userId', parameters: [{ name: '@id', value: conversationId }, { name: '@userId', value: userId }] })
        .fetchAll();
      if (!resources.length) return res.status(404).json({ error: 'Konversation nicht gefunden' });
      conversation = resources[0] as Conversation;
    } else {
      // Create new conversation
      const title = message.length > 60 ? message.substring(0, 57) + '...' : message;
      conversation = {
        id: uuidv4(),
        userId,
        title,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Append user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      imageUrls: imageUrls?.length ? imageUrls : undefined,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(userMessage);

    // Call Claude
    const reply = await chatWithStyleConsultant(conversation.messages);

    // Append assistant reply
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(assistantMessage);
    conversation.updatedAt = new Date().toISOString();

    // Persist
    await containers.conversations.items.upsert(conversation);

    res.json({ conversation, reply });
  } catch (err: any) {
    console.error('Umstyling chat error:', err);
    res.status(500).json({ error: 'Stilberatung vorübergehend nicht verfügbar' });
  }
});

// GET /api/umstyling/conversations — list user's conversations
umstylingRouter.get('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.oid;
    const { resources } = await containers.conversations.items
      .query({
        query: 'SELECT c.id, c.title, c.updatedAt, c.createdAt FROM c WHERE c.userId = @userId ORDER BY c.updatedAt DESC',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();
    res.json({ conversations: resources });
  } catch (err: any) {
    res.status(500).json({ error: 'Konversationen konnten nicht geladen werden' });
  }
});

// GET /api/umstyling/conversations/:id — load full conversation
umstylingRouter.get('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.oid;
    const { resources } = await containers.conversations.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.userId = @userId',
        parameters: [{ name: '@id', value: req.params.id }, { name: '@userId', value: userId }],
      })
      .fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Konversation nicht gefunden' });
    res.json({ conversation: resources[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Konversation konnte nicht geladen werden' });
  }
});

// DELETE /api/umstyling/conversations/:id — delete a conversation
umstylingRouter.delete('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.oid;
    const { resources } = await containers.conversations.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.userId = @userId',
        parameters: [{ name: '@id', value: req.params.id }, { name: '@userId', value: userId }],
      })
      .fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Konversation nicht gefunden' });
    await containers.conversations.item(req.params.id, userId).delete();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Konversation konnte nicht gelöscht werden' });
  }
});

// POST /api/umstyling/upload-image — SAS URL for image upload
umstylingRouter.post('/upload-image', async (req: Request, res: Response) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' });

    const accountName = process.env.STORAGE_ACCOUNT!;
    const accountKey = process.env.STORAGE_KEY!;
    const containerName = process.env.STORAGE_CONTAINER || 'media';
    const blobName = `umstyling/${uuidv4()}-${filename}`;

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const expiresOn = new Date(Date.now() + 10 * 60 * 1000);
    const sas = generateBlobSASQueryParameters(
      { containerName, blobName, permissions: BlobSASPermissions.parse('w'), expiresOn, contentType },
      sharedKeyCredential,
    ).toString();

    const uploadUrl = `${blockBlobClient.url}?${sas}`;
    const publicUrl = blockBlobClient.url;

    res.json({ uploadUrl, publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'Upload-URL konnte nicht erstellt werden' });
  }
});
