# SpicyHealth — Architecture Overview

## Stack

| Layer | Technology | Azure Service |
|---|---|---|
| Frontend | Next.js 14 (App Router, PWA) | Azure Static Web Apps |
| Backend | Node.js + Express + TypeScript | Azure App Service (B1+) |
| Database | Azure Cosmos DB (NoSQL, Serverless) | Cosmos DB |
| Auth | Entra External ID / bcryptjs + HS256 JWT | Microsoft Entra External ID |
| Storage | Azure Blob Storage | Storage Account |
| CI/CD | GitHub Actions | — |

## High-Level Architecture

```
Browser / PWA (Next.js)
        │
        │ HTTPS
        ▼
Azure Static Web Apps
        │
        │ REST API calls
        ▼
Azure App Service (Node.js API)
        ├──► Entra External ID  (JWT validation)
        ├──► Azure Cosmos DB  (recipes, meal plans, users, comments)
        └──► Open Food Facts API  (nutrition lookup)

Azure Blob Storage ◄── image uploads from API
```

## API Endpoints

### Public
- `POST /api/auth/register`
- `POST /api/auth/login`

### Protected (Bearer JWT)
- `GET  /api/recipes` — list with filters
- `GET  /api/recipes/:id`
- `POST /api/recipes`
- `POST /api/recipes/:id/comments`
- `POST /api/recipes/:id/quick-add` — log to today's plan
- `GET  /api/meal-plans/current`
- `PUT  /api/meal-plans/:id/day/:date` — update day slot
- `GET  /api/shopping-list`
- `POST /api/shopping-list/generate`
- `PATCH /api/shopping-list/:itemId`

## Cosmos DB Containers

| Container | Partition Key | Description |
|---|---|---|
| recipes | /category | All recipes |
| meal-plans | /userId | Weekly meal plans |
| users | /id | User profiles |
| comments | /recipeId | Recipe comments |
| shopping-lists | /userId | Smart shopping lists |

## Entra External ID — Social Login Setup

1. Create B2C tenant at portal.azure.com
2. Register app → client ID & secret
3. Add Identity Providers: Google, Microsoft, Facebook
4. Create User Flow: `B2C_1_signupsignin`
5. Set `B2C_TENANT` + `B2C_POLICY` env vars in API

## Pricing Estimate (West Europe, low traffic)

| Service | Tier | ~Cost/month |
|---|---|---|
| Static Web Apps | Standard | €9 |
| App Service | B1 | €13 |
| Cosmos DB | Serverless | €0–10 |
| Blob Storage | LRS | <€1 |
| Entra External ID | 50k MAU free | €0 |
| **Total** | | **~€23–33/mo** |

## Milestones

### MVP (Phase 1)
- [ ] Auth (email/password + Google OAuth)
- [ ] Recipe CRUD + search/filter
- [ ] Recipe detail page with comments
- [ ] Quick Add for Today

### v1 (Phase 2)
- [ ] Meal planner (drag-and-drop)
- [ ] Nutritional calculator (Open Food Facts)
- [ ] Smart shopping list (auto-generated)

### v2 (Phase 3)
- [ ] Cost calculator (price estimates)
- [ ] Push notifications (PWA)
- [ ] React Native companion app
- [ ] Social login (Microsoft, Facebook)
