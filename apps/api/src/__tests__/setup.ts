// Mock Cosmos DB so tests don't need a real Azure connection
const makeMockItems = () => ({
  query: jest.fn().mockReturnValue({ fetchAll: jest.fn().mockResolvedValue({ resources: [] }) }),
  create: jest.fn().mockResolvedValue({ resource: {} }),
  upsert: jest.fn().mockResolvedValue({ resource: {} }),
});

jest.mock('../services/cosmos', () => ({
  containers: {
    recipes: { items: makeMockItems() },
    users: { items: makeMockItems() },
    mealPlans: { items: makeMockItems() },
    shoppingLists: { items: makeMockItems() },
    comments: { items: makeMockItems() },
  },
}));

// Suppress AppInsights in tests
process.env.NODE_ENV = 'test';
