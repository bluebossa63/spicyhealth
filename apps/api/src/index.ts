import express from 'express';
import cors from 'cors';
import { recipesRouter } from './routes/recipes';
import { mealPlansRouter } from './routes/meal-plans';
import { shoppingListRouter } from './routes/shopping-list';
import { authRouter } from './routes/auth';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/recipes', authMiddleware, recipesRouter);
app.use('/api/meal-plans', authMiddleware, mealPlansRouter);
app.use('/api/shopping-list', authMiddleware, shoppingListRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`SpicyHealth API running on port ${PORT}`);
});
