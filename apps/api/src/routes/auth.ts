import { Router } from 'express';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  // TODO: create user in Azure AD B2C + Cosmos DB profile
  res.status(201).json({ user: null, token: null });
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  // Email/password — validate against Azure AD B2C
  res.json({ user: null, token: null });
});
