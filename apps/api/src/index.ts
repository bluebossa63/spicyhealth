import appInsights from 'applicationinsights';
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights
    .setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .start();
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { recipesRouter } from './routes/recipes';
import { mealPlansRouter } from './routes/meal-plans';
import { shoppingListRouter } from './routes/shopping-list';
import { authRouter } from './routes/auth';
import { nutritionRouter } from './routes/nutrition';
import { usersRouter } from './routes/users';
import { commentsRouter } from './routes/comments';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }));

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/users', authMiddleware, usersRouter);
app.use('/api/recipes', authMiddleware, recipesRouter);
app.use('/api/comments', authMiddleware, commentsRouter);
app.use('/api/meal-plans', authMiddleware, mealPlansRouter);
app.use('/api/shopping-list', authMiddleware, shoppingListRouter);
app.use('/api/nutrition', authMiddleware, nutritionRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`SpicyHealth API running on port ${PORT}`);
});
