import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { containers } from '../services/cosmos';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'spicyhealth-dev-secret-change-in-prod';
const JWT_EXPIRES_IN = '7d';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';
const FRONTEND_URL = (process.env.ALLOWED_ORIGIN || 'http://localhost:3000').split(',')[0].trim();

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
    // Check if email already registered
    const { resources } = await containers.users.items.query({
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: email.toLowerCase() }],
    }).fetchAll();

    if (resources.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const now = new Date().toISOString();

    const userDoc = {
      id: userId,
      email: email.toLowerCase(),
      displayName,
      passwordHash,
      dietaryPreferences: [],
      savedRecipeIds: [],
      createdAt: now,
    };

    await containers.users.items.create(userDoc);

    const token = jwt.sign(
      { sub: userId, email: userDoc.email, displayName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      user: { id: userId, email: userDoc.email, displayName },
      token,
    });
  } catch (err: any) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
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
    const { resources } = await containers.users.items.query({
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: email.toLowerCase() }],
    }).fetchAll();

    const user = resources[0];
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err: any) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/users/me
authRouter.get('/me', async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { resource } = await containers.users.item(user.sub, user.sub).read();
    if (!resource) return res.status(404).json({ error: 'User profile not found' });
    res.json({ user: resource });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /api/auth/google — redirect to Google consent screen
authRouter.get('/google', (_req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'Google OAuth not configured' });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// GET /api/auth/google/callback — exchange code, find/create user, redirect with JWT
authRouter.get('/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.redirect(`${FRONTEND_URL}/auth/login?error=missing_code`);
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', await tokenRes.text());
      return res.redirect(`${FRONTEND_URL}/auth/login?error=token_exchange`);
    }

    const tokens = await tokenRes.json() as { access_token: string };

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return res.redirect(`${FRONTEND_URL}/auth/login?error=userinfo`);
    }

    const googleUser = await userInfoRes.json() as { id: string; email?: string; name?: string; picture?: string };
    const email = googleUser.email?.toLowerCase();
    if (!email) {
      return res.redirect(`${FRONTEND_URL}/auth/login?error=no_email`);
    }

    // Find or create user in Cosmos DB
    const { resources } = await containers.users.items.query({
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: email }],
    }).fetchAll();

    let user = resources[0];

    if (!user) {
      const userId = uuidv4();
      const now = new Date().toISOString();
      user = {
        id: userId,
        email,
        displayName: googleUser.name || email.split('@')[0],
        avatarUrl: googleUser.picture || undefined,
        googleId: googleUser.id,
        dietaryPreferences: [],
        savedRecipeIds: [],
        createdAt: now,
      };
      await containers.users.items.create(user);
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleUser.id;
      if (googleUser.picture && !user.avatarUrl) user.avatarUrl = googleUser.picture;
      await containers.users.item(user.id, user.id).replace(user);
    }

    // Issue our JWT
    const token = jwt.sign(
      { sub: user.id, email: user.email, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Redirect to frontend with token
    const userPayload = encodeURIComponent(JSON.stringify({
      id: user.id, email: user.email, displayName: user.displayName,
    }));
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${userPayload}`);
  } catch (err: any) {
    console.error('Google OAuth error:', err.message);
    res.redirect(`${FRONTEND_URL}/auth/login?error=server`);
  }
});
