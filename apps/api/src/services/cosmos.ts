import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT!,
  key: process.env.COSMOS_KEY!,
});

const db = client.database(process.env.COSMOS_DB_NAME || 'spicyhealth');

export const containers = {
  recipes: db.container('recipes'),
  mealPlans: db.container('meal-plans'),
  users: db.container('users'),
  comments: db.container('comments'),
  shoppingLists: db.container('shopping-lists'),
  conversations: db.container('conversations'),
};
