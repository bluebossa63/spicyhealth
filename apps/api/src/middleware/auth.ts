import { Request, Response, NextFunction } from 'express';
import { JwksClient } from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const client = new JwksClient({
  jwksUri: `https://${process.env.B2C_TENANT}.b2clogin.com/${process.env.B2C_TENANT}.onmicrosoft.com/${process.env.B2C_POLICY}/discovery/v2.0/keys`,
});

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.decode(token, { complete: true });
    const kid = decoded?.header?.kid;
    const key = await client.getSigningKey(kid);
    const signingKey = key.getPublicKey();
    const payload = jwt.verify(token, signingKey);
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
