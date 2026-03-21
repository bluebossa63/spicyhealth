import request from 'supertest';
import { app } from '../index';
import { containers } from '../services/cosmos';
import { makeToken, authHeader } from './helpers';

const token = makeToken('user-sl-1');

const mockList = {
  id: 'sl-1',
  userId: 'user-sl-1',
  items: [
    { id: 'item-1', name: 'Avocado', quantity: 2, unit: 'piece', checked: false },
  ],
};

describe('Shopping List API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/shopping-list', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/shopping-list');
      expect(res.status).toBe(401);
    });

    it('returns empty list when none exists', async () => {
      (containers.shoppingLists.items.query as jest.Mock).mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
      });

      const res = await request(app)
        .get('/api/shopping-list')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
    });

    it('returns existing list', async () => {
      (containers.shoppingLists.items.query as jest.Mock).mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: [mockList] }),
      });

      const res = await request(app)
        .get('/api/shopping-list')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
    });
  });
});
