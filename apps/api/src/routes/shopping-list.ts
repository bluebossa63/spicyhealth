import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { containers } from '../services/cosmos';

export const shoppingListRouter = Router();

type ShoppingCategory = 'produce' | 'dairy' | 'meat' | 'grains' | 'pantry' | 'frozen' | 'other';

const CATEGORY_KEYWORDS: Record<ShoppingCategory, string[]> = {
  produce: [
    // Gemüse
    'tomate', 'tomaten', 'cherry', 'salat', 'spinat', 'karotte', 'rüebli', 'rüebel', 'zwiebel',
    'knoblauch', 'peperoni', 'paprika', 'gurke', 'zucchetti', 'zucchini', 'brokkoli', 'blumenkohl',
    'champignon', 'pilz', 'avocado', 'lauch', 'sellerie', 'fenchel', 'spargel', 'bohne', 'erbsen',
    'mais', 'kürbis', 'süsskartoffel', 'kartoffel', 'randen', 'aubergine', 'radieschen', 'kohlrabi',
    'kabis', 'kohl', 'rosenkohl', 'federkohl', 'mangold', 'bärlauch', 'sojasprossen', 'bambussprossen',
    'edamame', 'ingwer',
    // Früchte
    'apfel', 'äpfel', 'banane', 'zitrone', 'limette', 'orange', 'mandarine', 'birne', 'mango',
    'ananas', 'erdbeere', 'himbeere', 'blaubeere', 'heidelbeere', 'beeren', 'kirsche', 'traube',
    'kiwi', 'pfirsich', 'aprikose', 'pflaume', 'zwetschge', 'wassermelone', 'rhabarber', 'quitte',
    'passionsfrucht', 'cranberr',
    // Kräuter
    'basilikum', 'petersilie', 'koriander', 'schnittlauch', 'rosmarin', 'thymian', 'minze',
    'oregano', 'dill', 'salbei',
  ],
  dairy: [
    'milch', 'käse', 'butter', 'rahm', 'sahne', 'joghurt', 'quark', 'skyr',
    'eier', 'eigelb', 'eiweiss', 'mozzarella', 'parmesan', 'feta', 'gruyère', 'emmentaler',
    'mascarpone', 'ricotta', 'hüttenkäse', 'cottage', 'halloumi', 'burrata',
    'frischkäse', 'schmand', 'crème', 'gelatine',
  ],
  meat: [
    'poulet', 'hähnchen', 'chicken', 'huhn', 'hühn', 'rind', 'kalb', 'schwein',
    'lamm', 'fisch', 'lachs', 'thunfisch', 'garnele', 'crevette', 'trute',
    'speck', 'pancetta', 'schinken', 'wurst', 'salami', 'fleisch',
  ],
  grains: [
    'pasta', 'spaghetti', 'penne', 'nudel', 'reis', 'basmatireis', 'sushireis',
    'brot', 'toast', 'zopf', 'mehl', 'haferflocken', 'hafer', 'quinoa', 'hirse',
    'bulgur', 'couscous', 'tortilla', 'wrap', 'ciabatta', 'naan', 'knäckebrot',
    'reiswaffel', 'griess', 'polenta', 'buchweizen', 'ditalini', 'löffelbiskuit',
    'reisnudel', 'granola', 'müesli', 'cornflakes', 'crouton',
  ],
  frozen: [
    'tiefgekühlt', 'tiefkühl', 'gefroren', 'glace', 'frozen',
  ],
  pantry: [
    'öl', 'olivenöl', 'sesamöl', 'kokosöl', 'essig', 'salz', 'pfeffer', 'zucker',
    'honig', 'ahornsirup', 'sauce', 'sojasauce', 'passata', 'tomatenmark',
    'dose', 'linsen', 'kichererbsen', 'kokosmilch', 'bouillon', 'brühe',
    'gewürz', 'kurkuma', 'kreuzkümmel', 'curry', 'zimt', 'muskat', 'vanille',
    'backpulver', 'hefe', 'schokolade', 'kakao', 'nüsse', 'mandel', 'walnuss',
    'cashew', 'erdnuss', 'pistazie', 'pinienkern', 'kürbiskern', 'sesam',
    'leinsamen', 'chiasamen', 'tahini', 'senf', 'ketchup', 'pesto',
    'acai', 'matcha', 'proteinpulver', 'kokosflocken', 'agar',
    'chilliflocken', 'chiliflocken', 'paprikapulver',
  ],
  other: [],
};

// Exact words that should match even as standalone (e.g. "Ei")
const EXACT_MATCH: Record<string, ShoppingCategory> = {
  'ei': 'dairy',
};

function categorize(name: string): ShoppingCategory {
  const lower = name.toLowerCase().trim();
  // Check exact match first
  if (EXACT_MATCH[lower]) return EXACT_MATCH[lower];
  // Check word-level exact matches
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (EXACT_MATCH[word]) return EXACT_MATCH[word];
  }
  // Check keyword includes
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ShoppingCategory, string[]][]) {
    if (cat === 'other') continue;
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return 'other';
}

async function getOrCreateList(userId: string) {
  const { resources } = await containers.shoppingLists.items.query({
    query: 'SELECT * FROM c WHERE c.userId = @userId',
    parameters: [{ name: '@userId', value: userId }],
  }).fetchAll();
  if (resources.length > 0) return resources[0];

  const list = { id: uuidv4(), userId, items: [], createdAt: new Date().toISOString() };
  await containers.shoppingLists.items.create(list);
  return list;
}

// GET /api/shopping-list
shoppingListRouter.get('/', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user.sub || user.oid;
  try {
    const list = await getOrCreateList(userId);
    res.json({ items: list.items, listId: list.id });
  } catch (err: any) {
    console.error('GET /shopping-list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch shopping list' });
  }
});

// POST /api/shopping-list/generate
shoppingListRouter.post('/generate', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user.sub || user.oid;
  const { mealPlanId } = req.body;
  if (!mealPlanId) return res.status(400).json({ error: 'mealPlanId is required' });

  try {
    // Fetch the meal plan
    const { resources: plans } = await containers.mealPlans.items.query({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: mealPlanId }],
    }).fetchAll();
    const plan = plans[0];
    if (!plan) return res.status(404).json({ error: 'Meal plan not found' });

    // Collect all recipes
    const allRecipes: any[] = [];
    for (const day of plan.days) {
      if (day.breakfast) allRecipes.push(day.breakfast);
      if (day.lunch) allRecipes.push(day.lunch);
      if (day.dinner) allRecipes.push(day.dinner);
      for (const s of day.snacks || []) allRecipes.push(s);
    }

    // Aggregate ingredients — merge duplicates by name
    const merged: Map<string, any> = new Map();
    for (const recipe of allRecipes) {
      for (const ing of recipe.ingredients || []) {
        const key = ing.name.toLowerCase().trim();
        if (merged.has(key)) {
          const existing = merged.get(key)!;
          existing.quantity += ing.quantity;
          existing.estimatedCostEur = (existing.estimatedCostEur || 0) + (ing.estimatedCostEur || 0);
          if (!existing.recipeIds.includes(recipe.id)) existing.recipeIds.push(recipe.id);
        } else {
          merged.set(key, {
            id: uuidv4(),
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            estimatedCostEur: ing.estimatedCostEur || 0,
            category: categorize(ing.name),
            purchased: false,
            recipeIds: [recipe.id],
          });
        }
      }
    }

    const items = Array.from(merged.values()).sort((a, b) => a.category.localeCompare(b.category));

    // Upsert the shopping list
    const list = await getOrCreateList(userId);
    list.items = items;
    list.updatedAt = new Date().toISOString();
    await containers.shoppingLists.items.upsert(list);
    res.json({ items, listId: list.id });
  } catch (err: any) {
    console.error('POST /shopping-list/generate error:', err.message);
    res.status(500).json({ error: 'Failed to generate shopping list' });
  }
});

// POST /api/shopping-list/items — add manual item
const addItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().default(1),
  unit: z.string().default(''),
  estimatedCostEur: z.number().min(0).default(0),
});

shoppingListRouter.post('/items', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user.sub || user.oid;
  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });

  try {
    const list = await getOrCreateList(userId);
    const newItem = {
      id: uuidv4(),
      ...parsed.data,
      category: categorize(parsed.data.name),
      purchased: false,
      recipeIds: [],
    };
    list.items = [...(list.items || []), newItem];
    list.updatedAt = new Date().toISOString();
    await containers.shoppingLists.items.upsert(list);
    res.status(201).json({ item: newItem });
  } catch (err: any) {
    console.error('POST /shopping-list/items error:', err.message);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// PATCH /api/shopping-list/items/:id
shoppingListRouter.patch('/items/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user.sub || user.oid;
  const { id } = req.params;
  const { purchased, quantity, name } = req.body;

  try {
    const list = await getOrCreateList(userId);
    const idx = list.items.findIndex((i: any) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Item not found' });

    const item = { ...list.items[idx] };
    if (purchased !== undefined) item.purchased = purchased;
    if (quantity !== undefined) item.quantity = quantity;
    if (name !== undefined) { item.name = name; item.category = categorize(name); }
    list.items[idx] = item;
    list.updatedAt = new Date().toISOString();
    await containers.shoppingLists.items.upsert(list);
    res.json({ item });
  } catch (err: any) {
    console.error('PATCH /shopping-list/items/:id error:', err.message);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/shopping-list/items/:id
shoppingListRouter.delete('/items/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user.sub || user.oid;
  const { id } = req.params;

  try {
    const list = await getOrCreateList(userId);
    list.items = list.items.filter((i: any) => i.id !== id);
    list.updatedAt = new Date().toISOString();
    await containers.shoppingLists.items.upsert(list);
    res.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /shopping-list/items/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});
