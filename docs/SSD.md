# Software System Design (SSD)
# SpicyHealth — Healthy Food & Lifestyle Platform

**Version:** 0.3.0
**Date:** 2026-03-18
**Status:** Active

> **Sync policy:** This document, `SPRINT_PLAN.md`, and `HISTORY.md` are kept in sync.
> Any change to architecture, tech stack, scope, or constraints must be:
> 1. Reflected in the relevant section(s) of this document
> 2. Reflected in the affected sprint task(s) in `SPRINT_PLAN.md`
> 3. Recorded as a new decision entry in `HISTORY.md` using the decision template
>
> Update the **Version** and **Date** fields on every change.

---

## 1. Introduction

### 1.1 Purpose

This document describes the software system design for **SpicyHealth**, a full-stack web platform for healthy food recipes, meal planning, nutrition tracking, and smart shopping list management. It covers system architecture, component design, data models, API contracts, infrastructure, and security.

### 1.2 Scope

- Web application (Next.js, PWA-capable)
- REST API backend (Node.js / Express)
- Azure cloud infrastructure
- Authentication via Entra External ID (email/password + social OAuth)
- Integrations: Open Food Facts API (nutrition data)

### 1.3 Definitions

| Term | Meaning |
|---|---|
| B2C | Azure Active Directory B2C (identity provider) |
| Cosmos DB | Azure Cosmos DB for NoSQL (document store) |
| SWA | Azure Static Web Apps |
| PWA | Progressive Web App |
| MAU | Monthly Active Users |
| JWT | JSON Web Token |

---

## 2. System Context

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                            │
│                                                             │
│  ┌──────────┐    HTTPS     ┌──────────────────────────┐    │
│  │  Browser │◄────────────►│  Azure Static Web Apps   │    │
│  │  / PWA   │              │  (Next.js frontend)       │    │
│  └──────────┘              └──────────┬───────────────┘    │
│                                       │ REST API            │
│                            ┌──────────▼───────────────┐    │
│                            │  Azure App Service        │    │
│                            │  (Node.js / Express API)  │    │
│                            └─┬────────┬──────────┬────┘    │
│                              │        │          │          │
│               ┌──────────────▼┐  ┌────▼────┐ ┌──▼──────┐  │
│               │  Entra External ID │  │Cosmos DB│ │  Blob   │  │
│               │  (Auth)       │  │(Data)   │ │ Storage │  │
│               └───────────────┘  └─────────┘ └─────────┘  │
│                                                             │
│                            Open Food Facts API (external)   │
└─────────────────────────────────────────────────────────────┘
```

**External users:** End users via browser or installed PWA.
**External systems:** Open Food Facts (nutrition lookup).

---

## 3. Architecture Overview

SpicyHealth follows a **monorepo, multi-tier architecture** organized with npm workspaces and Turborepo.

```
spicyhealth/
├── apps/
│   ├── web/        → Next.js 14 frontend (SSR + PWA)
│   └── api/        → Express REST API
├── packages/
│   └── shared/     → Shared TypeScript types
├── infra/          → Azure Bicep IaC
├── .github/        → CI/CD workflows
└── docs/           → Design documents
```

### 3.1 Architectural Drivers

| Driver | Decision |
|---|---|
| Feminine / lifestyle UX | Next.js SSR for SEO; blush/sage design tokens |
| Mobile-first | PWA via `manifest.json` + responsive layout |
| Azure-native | SWA + App Service + Cosmos DB + AD B2C + Blob |
| Cost efficiency | Cosmos DB Serverless; B1 App Service; SWA Standard |
| Social login | Entra External ID (Google, Microsoft, Facebook built-in) |
| Shared types | `@spicyhealth/shared` package eliminates API drift |

---

## 4. Component Design

### 4.1 Frontend — `apps/web`

**Framework:** Next.js 14 with App Router
**Language:** TypeScript
**Deployment:** Azure Static Web Apps

#### 4.1.1 Page Structure (App Router)

```
src/app/
├── layout.tsx              Root layout (fonts, PWA meta, theme)
├── page.tsx                Landing / home
├── recipes/
│   ├── page.tsx            Recipe library (grid, filters, search)
│   └── [id]/
│       └── page.tsx        Recipe detail + comments
├── meal-planner/
│   └── page.tsx            Weekly drag-and-drop planner
├── shopping-list/
│   └── page.tsx            Smart shopping list
└── auth/
    ├── login/page.tsx      Login page (email + social)
    └── register/page.tsx   Registration
```

#### 4.1.2 Component Hierarchy

```
<RootLayout>
  <NavBar />
  <Page>
    ├── RecipesPage
    │   ├── SearchBar
    │   ├── FilterPanel (category, dietary, calories, prep time, cost)
    │   └── RecipeGrid
    │       └── RecipeCard (+ Quick Add button)
    ├── RecipeDetailPage
    │   ├── IngredientList (with calorie + cost per item)
    │   ├── NutritionPanel
    │   ├── CostPanel
    │   └── CommentThread
    ├── MealPlannerPage
    │   └── WeeklyGrid (drag-and-drop)
    │       └── DayColumn
    │           └── MealSlot (breakfast/lunch/dinner/snacks)
    └── ShoppingListPage
        ├── GenerateButton
        └── ShoppingGroup (by category)
            └── ShoppingItem (checkbox, quantity, cost)
```

#### 4.1.3 PWA Configuration

| Property | Value |
|---|---|
| `display` | `standalone` |
| `theme_color` | `#d4856a` (warm terracotta) |
| `background_color` | `#fdf6f0` (cream) |
| `start_url` | `/` |
| Icons | 192×192, 512×512 PNG |

Push notifications: browser Notifications API via service worker (Phase 3).

#### 4.1.4 API Client (`src/lib/api.ts`)

All requests go through a central `fetchJson` wrapper that:
- Reads Bearer token from `localStorage`
- Sets `Content-Type: application/json`
- Throws on non-2xx responses

---

### 4.2 Backend — `apps/api`

**Framework:** Express 4 + TypeScript
**Runtime:** Node.js 20 LTS
**Deployment:** Azure App Service (Linux, B1 tier)

#### 4.2.1 Module Map

```
src/
├── index.ts                App bootstrap, middleware, route mounting
├── routes/
│   ├── auth.ts             Register, login (delegates to B2C)
│   ├── recipes.ts          CRUD, comments, quick-add
│   ├── meal-plans.ts       Current week plan, day slot updates
│   └── shopping-list.ts    Get, generate from plan, mark purchased
├── middleware/
│   └── auth.ts             JWT validation (JWKS from B2C)
└── services/
    ├── cosmos.ts           Cosmos DB client + container refs
    └── nutrition.ts        Open Food Facts API wrapper
```

#### 4.2.2 Request Lifecycle

```
Client Request
     │
     ▼
CORS middleware
     │
     ▼
JSON body parser
     │
     ▼
Route match
     │
     ▼ (protected routes only)
authMiddleware
  └─► fetch JWKS from B2C endpoint
  └─► verify JWT signature + expiry
  └─► attach decoded payload to req.user
     │
     ▼
Route handler
  ├─► Cosmos DB query / mutation
  └─► Open Food Facts lookup (nutrition routes)
     │
     ▼
JSON response
```

---

### 4.3 Shared Types — `packages/shared`

Published as `@spicyhealth/shared` and consumed by both `web` and `api`. Key interfaces:

| Interface | Purpose |
|---|---|
| `Recipe` | Full recipe entity |
| `Ingredient` | With optional nutrition + cost fields |
| `NutritionInfo` | calories, protein, carbs, fat, fiber |
| `MealPlan` / `DayPlan` | Weekly plan with per-day totals |
| `ShoppingListItem` | With category grouping + purchased flag |
| `Comment` | Threaded, with likes |
| `UserProfile` | Preferences, saved recipes |

---

## 5. Data Design

### 5.1 Cosmos DB — Container Schema

**Database:** `spicyhealth`
**Mode:** Serverless (no provisioned RU/s — pay per operation)

#### `recipes` container
Partition key: `/category`

```json
{
  "id": "uuid",
  "title": "Avocado & Mango Salad",
  "description": "...",
  "category": "lunch",
  "imageUrl": "https://storage.../img.jpg",
  "prepTimeMinutes": 10,
  "cookTimeMinutes": 0,
  "servings": 2,
  "ingredients": [
    {
      "name": "Avocado",
      "quantity": 1,
      "unit": "whole",
      "calories": 240,
      "estimatedCostEur": 1.20,
      "openFoodFactsId": "..."
    }
  ],
  "instructions": ["Slice avocado...", "..."],
  "nutrition": { "calories": 420, "proteinG": 6, "carbsG": 30, "fatG": 28, "fiberG": 10 },
  "estimatedCostEur": 3.50,
  "tags": ["vegan", "gluten-free", "quick"],
  "authorId": "user-uuid",
  "createdAt": "2026-03-17T00:00:00Z",
  "updatedAt": "2026-03-17T00:00:00Z"
}
```

#### `meal-plans` container
Partition key: `/userId`

```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "weekStart": "2026-03-16",
  "days": [
    {
      "date": "2026-03-17",
      "breakfast": { "recipeId": "...", "title": "..." },
      "lunch": { "recipeId": "...", "title": "..." },
      "dinner": { "recipeId": "...", "title": "..." },
      "snacks": [],
      "totalNutrition": { "calories": 1800, "proteinG": 90, "carbsG": 200, "fatG": 60 },
      "totalCostEur": 12.40
    }
  ]
}
```

#### `users` container
Partition key: `/id`

```json
{
  "id": "b2c-object-id",
  "email": "user@example.com",
  "displayName": "Sofia",
  "avatarUrl": "https://...",
  "dietaryPreferences": ["vegan", "gluten-free"],
  "savedRecipeIds": ["uuid1", "uuid2"],
  "createdAt": "2026-03-17T00:00:00Z"
}
```

#### `comments` container
Partition key: `/recipeId`

```json
{
  "id": "uuid",
  "recipeId": "recipe-uuid",
  "userId": "user-uuid",
  "parentId": null,
  "body": "This was delicious!",
  "likes": 4,
  "createdAt": "2026-03-17T00:00:00Z"
}
```

---

## 6. API Reference

### 6.1 Base URL

| Environment | URL |
|---|---|
| Local | `http://localhost:3001/api` |
| Production | `https://spicyhealth-api-prod.azurewebsites.net/api` |

### 6.2 Authentication

All protected endpoints require:
`Authorization: Bearer <Entra External ID JWT>`

### 6.3 Endpoint Catalogue

#### Auth (public)

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account (email + password) |
| `POST` | `/auth/login` | Email/password login → returns JWT |

#### Recipes (protected)

| Method | Path | Description |
|---|---|---|
| `GET` | `/recipes` | List recipes; query params: `category`, `maxCalories`, `maxPrepTime`, `search` |
| `GET` | `/recipes/:id` | Recipe detail with full ingredient nutrition |
| `POST` | `/recipes` | Create new recipe |
| `PUT` | `/recipes/:id` | Update recipe (author only) |
| `DELETE` | `/recipes/:id` | Delete recipe (author only) |
| `POST` | `/recipes/:id/comments` | Add comment (or reply with `parentId`) |
| `POST` | `/recipes/:id/quick-add` | Log recipe to today's meal plan |

#### Meal Plans (protected)

| Method | Path | Description |
|---|---|---|
| `GET` | `/meal-plans/current` | This week's plan for authenticated user |
| `PUT` | `/meal-plans/:id/day/:date` | Update a single day slot (drag-and-drop save) |

#### Shopping List (protected)

| Method | Path | Description |
|---|---|---|
| `GET` | `/shopping-list` | Current list (grouped by category) |
| `POST` | `/shopping-list/generate` | Auto-generate from `mealPlanId` |
| `PATCH` | `/shopping-list/:itemId` | Toggle `purchased` flag |

#### Nutrition (protected)

| Method | Path | Description |
|---|---|---|
| `GET` | `/nutrition/search?q=avocado` | Search Open Food Facts by name |
| `GET` | `/nutrition/:barcode` | Lookup by barcode |

---

## 7. Security Design

### 7.1 Authentication Flow (email/password — current implementation)

> See D-018 in HISTORY.md. MSAL/ROPC was dropped in favour of self-managed credentials.

```
User submits email + password
        │
        ▼
POST /api/auth/register  or  POST /api/auth/login
        │
        ▼
API: bcrypt.compare(password, storedHash)
        │
        ▼
API: jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' })
        │
        ▼
Frontend stores JWT in localStorage via AuthProvider
        │
        ▼
API calls include: Authorization: Bearer <token>
        │
        ▼
authMiddleware: jwt.verify(token, JWT_SECRET) → req.user
```

**Current identity support:**
- Email / password (active)
- Google / Microsoft / Facebook via Entra External ID (deferred — S1-03/04/05)

### 7.2 Token Validation

- Algorithm: HS256, signed with `JWT_SECRET` env var
- Library: `jsonwebtoken`
- Expiry: 7 days
- Validated claims: `exp`, `userId`, `email`

### 7.3 Security Controls

| Control | Implementation |
|---|---|
| Transport security | HTTPS enforced (Azure SWA + App Service TLS) |
| CORS | Allowlist: SWA domain only |
| Input validation | Zod schemas on all POST/PUT bodies (Phase 1) |
| SQL injection | N/A — Cosmos DB parameterized queries |
| XSS | Next.js auto-escapes JSX; Content-Security-Policy header |
| Secrets management | Azure Key Vault (production); `.env` never committed |
| Image upload | Signed SAS URLs — client uploads direct to Blob Storage |

---

## 8. Infrastructure Design

### 8.1 Azure Resource Map

> **Infrastructure is managed by Terraform** at `infra/terraform/`. The Bicep template has been replaced. Run `terraform init / plan / apply` from that directory to provision all resources below.

```
Resource Group: rg-spicyhealth
│
├── Azure Static Web Apps         spicyhealth-web-prod
│   └── GitHub Actions deploy
│
├── Azure App Service Plan        spicyhealth-plan-prod (B1, Linux)
│   └── App Service               spicyhealth-api-prod (Node 20 LTS)
│
├── Entra External ID tenant           spicyhealthb2c.onmicrosoft.com
│   ├── User flow: B2C_1_signupsignin
│   └── Identity providers: Google, Microsoft, Facebook
│
├── Azure Cosmos DB               spicyhealth-cosmos-prod
│   ├── Database: spicyhealth
│   └── Containers: recipes, meal-plans, users, comments, shopping-lists
│
└── Azure Storage Account         spicyhealthmediaprod
    └── Blob container: media (images, avatars)
```

### 8.2 CI/CD Pipeline

> **Infrastructure changes** (`infra/terraform/`) are applied manually via `terraform apply` or via a separate dedicated workflow — they are **not** part of the application deploy pipeline below.

```
git push → main
     │
     ▼
GitHub Actions: ci.yml (PR gate)
  ├─ npm ci
  ├─ npm run build (all workspaces)
  └─ npm run lint

GitHub Actions: deploy.yml (on merge to main)
  ├─ Job 1: deploy-api
  │    └─ azure/webapps-deploy → App Service
  └─ Job 2: deploy-web
       └─ Azure/static-web-apps-deploy → SWA

Terraform (manual / separate workflow):
  └─ terraform apply → provisions Azure resources
```

### 8.3 Environments

| Environment | Frontend | API | Database |
|---|---|---|---|
| Local dev | `localhost:3000` | `localhost:3001` | Cosmos DB emulator |
| Staging | SWA preview URL | App Service slot | Cosmos DB (dev db) |
| Production | `https://spicyhealth.niceneasy.ch` | `https://spicyhealth-api-prod.azurewebsites.net` | `https://spicyhealth-cosmos-prod.documents.azure.com:443/` |

### 8.4 Pricing Estimate (West Europe)

| Service | Tier | Est. €/month |
|---|---|---|
| Azure Static Web Apps | Standard | €9 |
| Azure App Service | B1 | €13 |
| Azure Cosmos DB | Serverless (< 1M RU) | €0–5 |
| Azure Blob Storage | LRS, < 10 GB | < €1 |
| Entra External ID | ≤ 50k MAU free | €0 |
| GitHub Actions | Free tier | €0 |
| **Total** | | **~€23–28/mo** |

Scale-up path: App Service P1v3 (€60) + Cosmos DB autoscale when > 10k active users.

---

## 9. Integration Design

### 9.1 Open Food Facts API

**Base URL:** `https://world.openfoodfacts.org/api/v2`
**Auth:** None (public API)
**Rate limit:** Polite use; no hard limit stated

| Use case | Endpoint |
|---|---|
| Lookup by barcode | `GET /product/{barcode}.json` |
| Search by name | `GET /search?search_terms={q}&json=1` |

Nutrition fields consumed: `energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`, `fiber_100g`.

Calculation: `value = (per100g_value * quantityGrams) / 100`

---

## 10. Phased Delivery

### Phase 1 — MVP ✅

- [x] Auth: email/password (S1); Google/social OAuth deferred (S1-03–05)
- [x] Recipe CRUD + image upload to Blob Storage (S2)
- [x] Recipe list with search + category/dietary/prep time filter (S2)
- [x] Recipe detail page with ingredient nutrition (Open Food Facts) (S2)
- [x] Comment system (threaded + likes + emoji reactions) (S3)
- [x] Quick Add for Today button (S2)
- [x] PWA manifest + responsive layout (S1/S2); full SW/push pending (S6)

### Phase 2 — v1 ✅

- [x] Meal planner: drag-and-drop weekly/daily grid (S4)
- [x] Per-day nutritional totals (S4)
- [x] Estimated cost per recipe + per week (S2/S4)
- [x] Smart shopping list (auto-generated from plan, grouped by category) (S5)
- [x] Manual shopping list editing + mark purchased (S5)
- [x] User profile (preferences, saved recipes, avatar) (S3)

### Phase 3 — v2

- [ ] Full PWA: service worker, offline support, push notifications (S6)
- [ ] Mobile polish: bottom tab bar, swipe gestures, responsive planner (S6)
- [ ] Google / Microsoft / Facebook social login (deferred from S1)
- [ ] React Native companion app (shared API)
- [ ] Cost estimates from grocery price data
- [ ] Admin dashboard (recipe moderation)

---

## 11. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Which grocery price API for cost estimates? | Product | Open |
| 2 | Multi-language support required? | Product | Resolved: German-only (D-019) |
| 3 | User-generated recipes moderated or open? | Product | Open |
| 4 | Custom domain name? | Infra | Open |
| 5 | Analytics: Azure App Insights or third-party? | Infra | Resolved: Azure App Insights (S7) |
