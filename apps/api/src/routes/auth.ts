import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { containers } from '../services/cosmos';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'spicyhealth-dev-secret-change-in-prod';
const JWT_EXPIRES_IN = '7d';

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
