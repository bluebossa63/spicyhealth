import { Router, Request, Response } from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { z } from 'zod';
import { containers } from '../services/cosmos';

export const authRouter = Router();

const msalConfig = {
  auth: {
    clientId: process.env.ENTRA_CLIENT_ID!,
    clientSecret: process.env.ENTRA_CLIENT_SECRET!,
    authority: `https://${process.env.ENTRA_TENANT}/${process.env.ENTRA_TENANT}/${process.env.ENTRA_POLICY}`,
    knownAuthorities: [process.env.ENTRA_TENANT!],
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

const registerSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { displayName, email, password } = parsed.data;

  try {
    // Acquire token using ROPC flow to create user
    const tokenResponse = await cca.acquireTokenByUsernamePassword({
      scopes: ['openid', 'profile'],
      username: email,
      password,
    });

    // Create user profile in Cosmos DB
    const now = new Date().toISOString();
    const userDoc = {
      id: tokenResponse?.uniqueId || email,
      email,
      displayName,
      dietaryPreferences: [],
      savedRecipeIds: [],
      createdAt: now,
    };

    await containers.users.items.upsert(userDoc);

    res.status(201).json({
      user: { id: userDoc.id, email, displayName },
      token: tokenResponse?.idToken,
    });
  } catch (err: any) {
    console.error('Register error:', err.message);
    res.status(400).json({ error: 'Registration failed', message: err.message });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  try {
    const tokenResponse = await cca.acquireTokenByUsernamePassword({
      scopes: ['openid', 'profile', 'email'],
      username: email,
      password,
    });

    res.json({
      token: tokenResponse?.idToken,
      user: {
        id: tokenResponse?.uniqueId,
        email: tokenResponse?.account?.username,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err.message);
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

// GET /api/users/me
authRouter.get('/me', async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { resource } = await containers.users.item(user.sub || user.oid, user.sub || user.oid).read();
    if (!resource) return res.status(404).json({ error: 'User profile not found' });
    res.json({ user: resource });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});
