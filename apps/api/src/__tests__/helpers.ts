import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'spicyhealth-dev-secret-change-in-prod';

export function makeToken(userId = 'user-test-1', email = 'test@example.com') {
  return jwt.sign({ sub: userId, email }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
