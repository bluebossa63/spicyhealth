import { Request, Response, NextFunction } from 'express';
import jwksRsa from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const TENANT = process.env.ENTRA_TENANT!;
const POLICY = process.env.ENTRA_POLICY!;

const jwksClient = jwksRsa({
  jwksUri: `https://${TENANT}/${TENANT}/${POLICY}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    jwksClient.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      resolve(key!.getPublicKey());
    });
  });
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded?.header?.kid) throw new Error('Invalid token structure');
    const signingKey = await getSigningKey(decoded.header.kid);
    const payload = jwt.verify(token, signingKey, {
      algorithms: ['RS256'],
      audience: process.env.ENTRA_CLIENT_ID,
    });
    (req as any).user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
