import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { containers } from '../services/cosmos';
import { chatWithStyleConsultant, extractGarmentDescription, type UserProfile } from '../services/anthropic';
import { generateStyleImage } from '../services/image-gen';
import { virtualTryOn } from '../services/fashn';
import { fluxKontextEdit } from '../services/flux-kontext';
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

    // Load user profile for personalized advice
    let profile: UserProfile | undefined;
    try {
      const { resource } = await containers.users.item(userId, userId).read();
      if (resource) {
        profile = {
          displayName: resource.displayName,
          birthYear: resource.birthYear,
          heightCm: resource.heightCm,
          weightKg: resource.weightKg,
          clothingSize: resource.clothingSize,
          shoeSize: resource.shoeSize,
          hairColor: resource.hairColor,
          waistCm: resource.waistCm,
          bustCm: resource.bustCm,
          eyeColor: resource.eyeColor,
          bodyLikes: resource.bodyLikes,
          bodyDiscreet: resource.bodyDiscreet,
          dietaryPreferences: resource.dietaryPreferences,
        };
      }
    } catch {}

    // Call GPT-4o for style advice with profile context
    const reply = await chatWithStyleConsultant(conversation.messages, profile);

    // Clean up: remove markers and "I can't edit images" disclaimers
    let cleanedReply = reply
      .replace(/\[LOOK_VORSCHLAG:\s*.+?\]/g, '')
      .replace(/\[INSPIRATION:\s*.+?\]/g, '')
      .replace(/[Ii]ch kann[^.!]*?(Bilder?|Fotos?|Personen)[^.!]*?(erstellen|anzeigen|bearbeiten|generieren|verändern|modifizieren|erkennen|analysieren)[^.!]*[.!]?/g, '')
      .replace(/[Ii]ch kann[^.!]*?(nicht|keine)[^.!]*?(sehen|erkennen|analysieren|bearbeiten)[^.!]*[.!]?/g, '')
      .replace(/[Dd]as ist (leider\s+)?(technisch\s+)?nicht möglich[^.!]*[.!]?/g, '')
      .replace(/[Bb]itte (überprüfe|prüfe|schau)[^.!]*App[^.!]*[.!]?/g, '')
      .replace(/[Aa]ber ich helfe dir gerne[,!]?\s*/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // --- Automatic image generation ---
    const generatedImages: string[] = [];
    let garmentDescriptionDE = '';

    // Find the latest user-uploaded photo
    const latestUserImage = [...conversation.messages]
      .reverse()
      .find((m) => m.role === 'user' && m.imageUrls?.length)
      ?.imageUrls?.[0];

    // Auto-generate: when user has uploaded a photo, use Flux Kontext
    // to directly restyle the photo based on the style advice
    // Uses a timeout to prevent hanging requests
    if (latestUserImage && cleanedReply.length > 50) {
      try {
        const styleContext = cleanedReply.substring(0, 500);

        // Extract a precise style description (fast, ~2s)
        const garment = await extractGarmentDescription(styleContext);
        garmentDescriptionDE = garment.description;
        console.log('Style category:', garment.category, '| description:', garment.description);

        // Build category-specific Flux Kontext prompt
        let editPrompt: string;
        if (garment.category === 'makeup') {
          editPrompt = `Apply ONLY makeup to this person's face: ${garment.prompt}. ` +
            `CRITICAL: Do NOT change clothing, hairstyle, body, or anything else. ` +
            `Keep face shape, skin, age, hair EXACTLY identical. Only add/change makeup. Photorealistic.`;
        } else if (garment.category === 'hair') {
          editPrompt = `Change ONLY the hairstyle on this person: ${garment.prompt}. ` +
            `CRITICAL: Do NOT change clothing, makeup, face, skin, body, or age. ` +
            `Keep everything identical except the hair. Photorealistic.`;
        } else if (garment.category === 'accessoires') {
          editPrompt = `Add ONLY accessories to this person: ${garment.prompt}. ` +
            `CRITICAL: Do NOT change clothing, hairstyle, makeup, face, skin, body, or age. ` +
            `Keep everything identical, only add the described accessories. Photorealistic.`;
        } else {
          editPrompt = `Change ONLY the clothing on this person: ${garment.prompt}. ` +
            `CRITICAL: Keep face, skin, neck, body shape, age, hairstyle and makeup EXACTLY identical. ` +
            `Do NOT add wrinkles or age the person. Only change clothing. Photorealistic.`;
        }

        // Flux Kontext with 45-second timeout
        console.log('Flux Kontext editing...');
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Flux timeout after 45s')), 45000)
        );
        const editedUrl = await Promise.race([
          fluxKontextEdit(latestUserImage, editPrompt),
          timeoutPromise,
        ]);
        generatedImages.push(editedUrl);
        console.log('Flux Kontext result:', editedUrl);
      } catch (err) {
        console.error('Image generation failed:', (err as Error).message);
        // No fallback — just show text response without image
      }
    }

    // Save generated images to permanent gallery
    if (generatedImages.length) {
      const userId = user?.sub || user?.oid;
      for (const url of generatedImages) {
        try {
          await containers.outfitGallery.items.create({
            id: uuidv4(),
            userId,
            imageUrl: url,
            description: garmentDescriptionDE || cleanedReply.substring(0, 150),
            createdAt: new Date().toISOString(),
          });
        } catch {}
      }
    }

    // Append assistant reply — add info about image generation
    let replyWithImage = cleanedReply;
    if (generatedImages.length && garmentDescriptionDE) {
      replyWithImage = `${cleanedReply}\n\n👗 **Mein Vorschlag für dich:** ${garmentDescriptionDE}`;
    } else if (latestUserImage && cleanedReply.length > 50 && !generatedImages.length && garmentDescriptionDE) {
      replyWithImage = `${cleanedReply}\n\n⏳ Das Bild konnte diesmal nicht erstellt werden. Klicke auf "Zeig mir den Look" um es nochmal zu versuchen.`;
    }

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: replyWithImage,
      imageUrls: generatedImages.length ? generatedImages : undefined,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(assistantMessage);
    conversation.updatedAt = new Date().toISOString();

    // Persist
    await containers.conversations.items.upsert(conversation);

    res.json({ conversation, reply: cleanedReply, generatedImages });
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

const generateLookSchema = z.object({
  conversationId: z.string(),
  sourceImageUrl: z.string().url(),
  garmentImageUrl: z.string().url().optional(),
  styleDescription: z.string().min(1).max(2000),
});

// POST /api/umstyling/generate-look — try on a garment or generate a style image
umstylingRouter.post('/generate-look', chatLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.oid;
    const parsed = generateLookSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { conversationId, sourceImageUrl, garmentImageUrl, styleDescription } = parsed.data;

    // Load conversation
    const { resources } = await containers.conversations.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id AND c.userId = @userId', parameters: [{ name: '@id', value: conversationId }, { name: '@userId', value: userId }] })
      .fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Konversation nicht gefunden' });
    const conversation = resources[0] as Conversation;

    let generatedImageUrl: string;

    if (garmentImageUrl) {
      // FASHN Virtual Try-On: person photo + garment photo → person wearing garment
      generatedImageUrl = await virtualTryOn(sourceImageUrl, garmentImageUrl);
    } else {
      // Flux Kontext: directly edit the user's photo
      try {
        generatedImageUrl = await fluxKontextEdit(
          sourceImageUrl,
          `Change ONLY the clothing on this person: ${styleDescription}. ` +
            `CRITICAL: Keep face, skin, neck, body shape, and age EXACTLY identical. ` +
            `Do NOT add wrinkles or age the person. Only change clothing. Photorealistic.`,
        );
      } catch {
        // Fallback to DALL-E 3 inspiration image
        generatedImageUrl = await generateStyleImage(
          `Modefoto: ${styleDescription}. Realistisch, hochwertig.`,
        );
      }
    }

    // Append to conversation as assistant message with image
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: garmentImageUrl
        ? `Hier siehst du, wie das Kleidungsstück an dir aussehen würde!`
        : `Hier ist mein Vorschlag: ${styleDescription}`,
      imageUrls: [generatedImageUrl],
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(assistantMessage);
    conversation.updatedAt = new Date().toISOString();
    await containers.conversations.items.upsert(conversation);

    // Save to permanent gallery
    try {
      await containers.outfitGallery.items.create({
        id: uuidv4(), userId, imageUrl: generatedImageUrl,
        description: styleDescription.substring(0, 150),
        createdAt: new Date().toISOString(),
      });
    } catch {}

    res.json({ conversation, generatedImageUrl });
  } catch (err: any) {
    console.error('Generate look error:', err);
    res.status(500).json({ error: 'Bild konnte nicht generiert werden. Bitte versuche es nochmal.' });
  }
});

const generateSuggestionSchema = z.object({
  conversationId: z.string(),
  styleDescription: z.string().min(1).max(2000),
});

// POST /api/umstyling/generate-suggestion — generate a style image without source photo
umstylingRouter.post('/generate-suggestion', chatLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.oid;
    const parsed = generateSuggestionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { conversationId, styleDescription } = parsed.data;

    // Load conversation
    const { resources } = await containers.conversations.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id AND c.userId = @userId', parameters: [{ name: '@id', value: conversationId }, { name: '@userId', value: userId }] })
      .fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Konversation nicht gefunden' });
    const conversation = resources[0] as Conversation;

    // Generate suggestion image via OpenAI
    const generatedImageUrl = await generateStyleImage(
      `Erstelle ein modisches, inspirierendes Bild: ${styleDescription}. ` +
      `Das Bild soll stilvoll, modern und ansprechend sein — wie aus einem hochwertigen Modemagazin.`,
    );

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: `Hier ist eine Inspiration: ${styleDescription}`,
      imageUrls: [generatedImageUrl],
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(assistantMessage);
    conversation.updatedAt = new Date().toISOString();
    await containers.conversations.items.upsert(conversation);

    // Save to permanent gallery
    try {
      await containers.outfitGallery.items.create({
        id: uuidv4(), userId, imageUrl: generatedImageUrl,
        description: styleDescription.substring(0, 150),
        createdAt: new Date().toISOString(),
      });
    } catch {}

    res.json({ conversation, generatedImageUrl });
  } catch (err: any) {
    console.error('Generate suggestion error:', err);
    res.status(500).json({ error: 'Bild konnte nicht generiert werden. Bitte versuche es nochmal.' });
  }
});

// GET /api/umstyling/gallery — load all saved outfit images
umstylingRouter.get('/gallery', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.oid;
    const { resources } = await containers.outfitGallery.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();
    res.json({ images: resources });
  } catch {
    res.status(500).json({ error: 'Galerie konnte nicht geladen werden' });
  }
});

// DELETE /api/umstyling/gallery/:id — delete one gallery image
umstylingRouter.delete('/gallery/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.oid;
    await containers.outfitGallery.item(req.params.id, userId).delete();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Bild konnte nicht gelöscht werden' });
  }
});

// DELETE /api/umstyling/gallery — delete all gallery images
umstylingRouter.delete('/gallery', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.oid;
    const { resources } = await containers.outfitGallery.items
      .query({ query: 'SELECT * FROM c WHERE c.userId = @userId', parameters: [{ name: '@userId', value: userId }] })
      .fetchAll();
    await Promise.all(resources.map((r: any) => containers.outfitGallery.item(r.id, userId).delete()));
    res.json({ success: true, deleted: resources.length });
  } catch {
    res.status(500).json({ error: 'Galerie konnte nicht gelöscht werden' });
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
