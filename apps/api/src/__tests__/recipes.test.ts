import request from 'supertest';
import { app } from '../index';
import { containers } from '../services/cosmos';
import { makeToken, authHeader } from './helpers';

const token = makeToken('user-test-1');

const mockRecipe = {
  id: 'recipe-1',
  title: 'Avocado Toast',
  description: 'Creamy avocado on sourdough',
  category: 'breakfast',
  prepTimeMinutes: 5,
  cookTimeMinutes: 5,
  servings: 1,
  ingredients: [{ name: 'Avocado', quantity: 1, unit: 'piece', calories: 200 }],
  instructions: ['Toast the bread', 'Mash avocado, spread on toast'],
  tags: ['vegan', 'quick'],
  estimatedCostEur: 2.5,
  authorId: 'user-test-1',
  deleted: false,
};

function mockQuery(resources: any[]) {
  return jest.fn().mockReturnValue({
    fetchAll: jest.fn().mockResolvedValue({ resources }),
  });
}

describe('Recipes API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/recipes', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/recipes');
      expect(res.status).toBe(401);
    });

    it('returns recipe list', async () => {
      (containers.recipes.items.query as jest.Mock) = mockQuery([mockRecipe]);

      const res = await request(app)
        .get('/api/recipes')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.recipes).toHaveLength(1);
      expect(res.body.recipes[0].title).toBe('Avocado Toast');
    });
  });

  describe('GET /api/recipes/:id', () => {
    it('returns 404 for unknown recipe', async () => {
      (containers.recipes.items.query as jest.Mock) = mockQuery([]);

      const res = await request(app)
        .get('/api/recipes/unknown-id')
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });

    it('returns recipe when found', async () => {
      (containers.recipes.items.query as jest.Mock) = mockQuery([mockRecipe]);

      const res = await request(app)
        .get('/api/recipes/recipe-1')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.recipe.title).toBe('Avocado Toast');
    });
  });

  describe('POST /api/recipes', () => {
    it('rejects invalid payload', async () => {
      const res = await request(app)
        .post('/api/recipes')
        .set(authHeader(token))
        .send({ title: '' });

      expect(res.status).toBe(400);
    });

    it('creates a recipe', async () => {
      const created = { ...mockRecipe, id: 'new-id' };
      (containers.recipes.items.create as jest.Mock).mockResolvedValue({ resource: created });

      const res = await request(app)
        .post('/api/recipes')
        .set(authHeader(token))
        .send({
          title: 'Avocado Toast',
          description: 'Creamy avocado on sourdough',
          category: 'breakfast',
          prepTimeMinutes: 5,
          cookTimeMinutes: 5,
          servings: 1,
          ingredients: [{ name: 'Avocado', quantity: 1, unit: 'piece', calories: 200 }],
          instructions: ['Toast the bread', 'Mash avocado, spread on toast'],
          tags: ['vegan'],
          estimatedCostEur: 2.5,
        });

      expect(res.status).toBe(201);
      expect(res.body.recipe).toBeDefined();
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    it('soft-deletes own recipe', async () => {
      (containers.recipes.items.query as jest.Mock) = mockQuery([{ ...mockRecipe, authorId: 'user-test-1' }]);
      (containers.recipes.items as any).upsert = jest.fn().mockResolvedValue({});

      const res = await request(app)
        .delete('/api/recipes/recipe-1')
        .set(authHeader(token));

      expect(res.status).toBe(200);
    });

    it("forbids deleting another user's recipe", async () => {
      (containers.recipes.items.query as jest.Mock) = mockQuery([{ ...mockRecipe, authorId: 'other-user' }]);

      const res = await request(app)
        .delete('/api/recipes/recipe-1')
        .set(authHeader(token));

      expect(res.status).toBe(403);
    });
  });
});
