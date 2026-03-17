# SpicyHealth — Sprint Plan

**Version:** 0.2.0 | **Date:** 2026-03-17 | **Sprint length:** 2 weeks

> **Sync policy:** This document, `SSD.md`, and `HISTORY.md` are kept in sync.
> When a sprint task changes scope, adds a new component, or alters a technical decision:
> 1. Update the task here (mark done, add notes, or revise description)
> 2. Update the relevant section in `SSD.md`
> 3. Log a new entry in `HISTORY.md` if it was a decision (not just an implementation detail)
>
> Update the **Version** and **Date** fields on every change.

---

## Gap Analysis vs Requirements

| Area | Required | Current State |
|---|---|---|
| Design system | Blush/sage/cream theme, rounded UI, responsive | ❌ No CSS, no tokens, no layout |
| Auth UI | Login, register, social OAuth | ❌ Empty stubs |
| Auth API | B2C JWT flow, user creation | ⚠️ Middleware written, untested |
| Recipe library UI | Grid, search, filters | ❌ "Coming soon" placeholder |
| Recipe detail UI | Ingredients, nutrition, cost, comments | ❌ Page doesn't exist |
| Recipe API | CRUD, Cosmos DB queries | ❌ All routes return null |
| Image upload | Azure Blob Storage | ❌ Not implemented |
| Comment system | Threaded comments, likes | ❌ Not implemented |
| Quick Add for Today | Log to today's plan | ❌ Route stub, no logic |
| Meal planner UI | Drag-and-drop weekly grid | ❌ "Coming soon" placeholder |
| Meal planner API | Day slot CRUD | ❌ Route stub, no logic |
| Shopping list UI | Auto-generated, grouped, editable | ❌ "Coming soon" placeholder |
| Shopping list API | Generate from plan, aggregate ingredients | ❌ Route stub, no logic |
| Nutrition lookup | Open Food Facts integration | ⚠️ Service written, not wired |
| Nutrition calculator | Per recipe + per day totals | ❌ Not implemented |
| Cost calculator | Per recipe + per week | ❌ Not implemented |
| User profile | Saved recipes, preferences, history | ❌ Not implemented |
| PWA | Service worker, icons, push notifications | ⚠️ Manifest only, no icons/SW |
| Azure infrastructure | B2C, Cosmos, Blob, App Service, SWA | ❌ Bicep template only |
| CI/CD | GitHub Actions → Azure | ⚠️ Workflow files exist, no secrets |

---

## Sprint 0 — Completed ✅

**Goal:** Monorepo scaffold, shared types, infra templates, SSD.

- [x] npm workspaces + Turborepo config
- [x] Shared TypeScript types (`@spicyhealth/shared`)
- [x] Express API skeleton with route stubs
- [x] Next.js 14 App Router skeleton
- [x] Azure Bicep infrastructure template
- [x] GitHub Actions CI/CD workflow skeletons
- [x] PWA `manifest.json`
- [x] `SSD.md` architecture document

---

## Sprint 1 — Azure Setup & Auth

**Goal:** Running app with working login on Azure infrastructure.
**Outcome:** User can register, log in with email or Google, and see their profile.

### Azure Setup (Infra)
- [x] **S1-01** Terraform state storage bootstrapped; `terraform apply` complete — all Azure resources live
- [x] **S1-02** Set up Entra External ID tenant; create app registration; configured user flow `B2C_1_signupsignin`
- [ ] **S1-03** Add Google as identity provider in Entra External ID ⏸ deferred
- [ ] **S1-04** Add Microsoft as identity provider in Entra External ID ⏸ deferred
- [ ] **S1-05** Add Facebook as identity provider in Entra External ID ⏸ deferred
- [x] **S1-06** Cosmos DB containers created by Terraform: `recipes`, `meal-plans`, `users`, `comments`, `shopping-lists`
- [x] **S1-07** Blob Storage container `media` created by Terraform with public blob access
- [ ] **S1-08** Set GitHub Actions secrets: `AZURE_API_PUBLISH_PROFILE`, `AZURE_STATIC_WEB_APPS_TOKEN` — in progress
- [x] **S1-09** `.env` files created for local dev (api + web); gitignored

### Design System (Frontend)
- [x] **S1-10** Tailwind CSS configured with brand tokens (blush/sage/cream/terracotta/charcoal), Playfair Display + Inter
- [x] **S1-11** `NavBar` component built (sticky, desktop nav, mobile hamburger)
- [x] **S1-12** `Footer` component built
- [x] **S1-13** `RootLayout` updated with NavBar, Footer, global CSS, PWA meta
- [x] **S1-14** `Button` component (primary/secondary/ghost, sm/md/lg)
- [x] **S1-15** `Card` component (rounded, shadow, hover lift)
- [x] **S1-16** `Input`, `Toast`, `SkeletonCard`, `SkeletonText` components built

### Auth (API)
- [x] **S1-17** `POST /api/auth/register`: Zod validation, MSAL ROPC flow, user upserted in Cosmos DB
- [x] **S1-18** `POST /api/auth/login`: MSAL ROPC flow, returns JWT
- [x] **S1-19** `authMiddleware` wired to all protected routes; helmet + rate limiting added
- [x] **S1-20** `GET /api/users/me` — returns profile from Cosmos DB

### Auth (Frontend)
- [x] **S1-21** `/auth/login` page — wired to `useAuth().login` with loading/error state
- [x] **S1-22** `/auth/register` page — wired to `useAuth().register` with password confirm
- [ ] **S1-23** Social OAuth redirect flow ⏸ deferred (S1-03/04/05 pending)
- [x] **S1-24** JWT stored in `localStorage` via `AuthProvider`
- [x] **S1-25** `useAuth` hook — `user`, `login`, `register`, `logout`, `isAuthenticated`, `isLoading`
- [x] **S1-26** `ProtectedRoute` component — redirects to `/auth/login` if unauthenticated; applied to meal-planner and shopping-list pages

---

## Sprint 2 — Recipe Library

**Goal:** Users can browse, search, filter, and view recipes.
**Outcome:** Fully functional recipe library with real data, beautiful UI.

### API
- [ ] **S2-01** Implement `GET /api/recipes`: Cosmos DB query with filters (`category`, `dietary`, `maxCalories`, `maxPrepTime`, `maxCost`, `search` full-text); pagination (`page`, `pageSize`)
- [ ] **S2-02** Implement `GET /api/recipes/:id`: fetch recipe by ID with full ingredient detail
- [ ] **S2-03** Implement `POST /api/recipes`: Zod validation, save to Cosmos DB, return created recipe
- [ ] **S2-04** Implement `PUT /api/recipes/:id`: author-only update
- [ ] **S2-05** Implement `DELETE /api/recipes/:id`: author-only soft delete
- [ ] **S2-06** Implement `GET /api/nutrition/search?q=`: proxy to Open Food Facts search
- [ ] **S2-07** Implement `GET /api/nutrition/:barcode`: proxy to Open Food Facts product lookup
- [ ] **S2-08** Add image upload endpoint `POST /api/recipes/upload-image`: generate SAS URL → client uploads directly to Blob Storage; return final URL

### Frontend — Recipe List
- [ ] **S2-09** Build `SearchBar` component (debounced input, 300ms)
- [ ] **S2-10** Build `FilterPanel` component:
  - Category chips (breakfast, lunch, dinner, snack, dessert, smoothie)
  - Dietary toggles (vegan, vegetarian, gluten-free, dairy-free)
  - Calories slider (0–1500 kcal)
  - Prep time slider (0–120 min)
  - Cost slider (€0–€30)
- [ ] **S2-11** Build `RecipeGrid` component: responsive grid (1→2→3→4 col), skeleton loading state
- [ ] **S2-12** Build `RecipeCard` component (full design):
  - Photo with aspect ratio 4:3, lifestyle placeholder if none
  - Title, description (truncated)
  - Badges: prep time, kcal, cost
  - Category chip
  - Quick Add button (terracotta)
  - Heart/save icon (top-right)
- [ ] **S2-13** Build `/recipes` page: compose SearchBar + FilterPanel + RecipeGrid with SWR data fetching
- [ ] **S2-14** Add infinite scroll or pagination to recipe list

### Frontend — Recipe Detail
- [ ] **S2-15** Create `/recipes/[id]` page route
- [ ] **S2-16** Build `RecipeHero`: large image, title, meta (author, date, prep/cook time, servings)
- [ ] **S2-17** Build `IngredientList`: each ingredient shows name, quantity, unit, kcal, cost; link to Open Food Facts lookup
- [ ] **S2-18** Build `NutritionPanel`: macros bar chart (calories, protein, carbs, fat, fiber) per serving and per recipe
- [ ] **S2-19** Build `CostPanel`: cost per serving and total recipe cost
- [ ] **S2-20** Build `InstructionList`: numbered steps with clean typography
- [ ] **S2-21** Build `QuickAddButton`: POST to `/api/recipes/:id/quick-add`, show success toast
- [ ] **S2-22** Build `SaveRecipeButton`: toggle saved state, optimistic update

### Frontend — Recipe Create/Edit
- [ ] **S2-23** Build `/recipes/new` page with multi-step form:
  - Step 1: Title, description, category, tags
  - Step 2: Ingredients (dynamic list, Open Food Facts autocomplete per ingredient)
  - Step 3: Instructions (ordered drag-and-drop list)
  - Step 4: Image upload, preview
- [ ] **S2-24** Auto-calculate and display nutrition + cost totals as user adds ingredients

---

## Sprint 3 — Comments & User Profiles

**Goal:** Social engagement layer and personalization.
**Outcome:** Users can comment, react, save recipes, and manage their profile.

### API
- [ ] **S3-01** Implement `GET /api/recipes/:id/comments`: fetch threaded comments (parent + replies), sorted by createdAt
- [ ] **S3-02** Implement `POST /api/recipes/:id/comments`: create comment or reply (`parentId` optional)
- [ ] **S3-03** Implement `POST /api/comments/:id/like`: toggle like for authenticated user
- [ ] **S3-04** Implement `DELETE /api/comments/:id`: author-only delete
- [ ] **S3-05** Implement `GET /api/users/me`: full profile with saved recipes and preferences
- [ ] **S3-06** Implement `PUT /api/users/me`: update display name, avatar, dietary preferences
- [ ] **S3-07** Implement `POST /api/users/me/saved-recipes/:recipeId`: save recipe
- [ ] **S3-08** Implement `DELETE /api/users/me/saved-recipes/:recipeId`: unsave recipe

### Frontend — Comments
- [ ] **S3-09** Build `CommentThread` component: renders root comments + nested replies (2 levels deep)
- [ ] **S3-10** Build `CommentItem`: avatar, username, timestamp, body, like button (count), reply button, delete button (own)
- [ ] **S3-11** Build `CommentForm`: textarea with submit; attach to recipe detail page below instructions
- [ ] **S3-12** Build `ReplyForm`: collapsible inline form under each comment
- [ ] **S3-13** Add emoji reactions bar (👍 ❤️ 😋 🔥) — store as reaction type counts in comment document

### Frontend — User Profile
- [ ] **S3-14** Build `/profile` page:
  - Avatar (upload to Blob)
  - Display name, email (read-only from B2C)
  - Dietary preferences (multi-select chips)
  - Saved recipes grid (reuses RecipeCard)
  - Meal history (last 4 weeks, clickable weeks)
- [ ] **S3-15** Build `AvatarUpload` component: drag-and-drop + preview, uploads to Blob Storage

---

## Sprint 4 — Meal Planner

**Goal:** Drag-and-drop weekly meal planning with nutritional and cost totals.
**Outcome:** Users can plan their full week, see daily totals, and log meals with one click.

### API
- [ ] **S4-01** Implement `GET /api/meal-plans/current`: get or create current week's plan for user; compute `totalNutrition` and `totalCostEur` per day
- [ ] **S4-02** Implement `GET /api/meal-plans?weekStart=`: get specific week's plan
- [ ] **S4-03** Implement `PUT /api/meal-plans/:id/day/:date`: update meal slot(s) for a day; recalculate totals
- [ ] **S4-04** Implement `POST /api/recipes/:id/quick-add`: upsert today's `DayPlan`, add recipe to appropriate meal slot (detect by time of day), recalculate totals
- [ ] **S4-05** Implement `DELETE /api/meal-plans/:id/day/:date/slot/:slot`: remove a recipe from a specific meal slot

### Frontend
- [ ] **S4-06** Install `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop
- [ ] **S4-07** Build `WeeklyGrid`: 7 columns (Mon–Sun), 4 rows (Breakfast, Lunch, Dinner, Snacks), week navigation arrows
- [ ] **S4-08** Build `MealSlot`: drop target; shows assigned `RecipeCard` (compact variant) or empty state with `+` button
- [ ] **S4-09** Build `RecipePickerModal`: searchable recipe list, select to assign to a slot; triggered by `+` button or drag from sidebar
- [ ] **S4-10** Build `RecipeSidebar`: drag source — shows recently used and saved recipes
- [ ] **S4-11** Build `DayTotalsBar`: per-day calorie, macro, and cost summary beneath each day column
- [ ] **S4-12** Build `WeekTotalsPanel`: weekly aggregate nutrition + cost (shown at bottom of planner)
- [ ] **S4-13** Wire drag-and-drop: on drop, call `PUT /api/meal-plans/:id/day/:date`; optimistic update with rollback on error
- [ ] **S4-14** Build `/meal-planner` page: compose all planner components with SWR fetching

---

## Sprint 5 — Shopping List

**Goal:** Smart shopping list auto-generated from meal plan, with manual editing and cost tracking.
**Outcome:** Users get a ready-to-use grouped shopping list with estimated costs.

### API
- [ ] **S5-01** Implement `POST /api/shopping-list/generate`:
  - Accept `mealPlanId`
  - Aggregate all ingredients from all recipes in the plan
  - Merge duplicates (same ingredient name), sum quantities
  - Assign `ShoppingCategory` (produce/dairy/meat/grains/pantry/frozen/other) based on ingredient tags
  - Look up `estimatedCostEur` from recipe data or Open Food Facts
  - Return sorted list grouped by category
- [ ] **S5-02** Implement `GET /api/shopping-list`: fetch current list for user (stored in Cosmos DB `shopping-lists` container)
- [ ] **S5-03** Implement `POST /api/shopping-list/items`: manually add item
- [ ] **S5-04** Implement `PATCH /api/shopping-list/items/:id`: toggle `purchased`, update quantity, update name
- [ ] **S5-05** Implement `DELETE /api/shopping-list/items/:id`: remove item
- [ ] **S5-06** Add `shopping-lists` Cosmos DB container (partition key: `/userId`)

### Frontend
- [ ] **S5-07** Build `/shopping-list` page with `GenerateFromPlanButton` (calls `POST /generate`, shows loading spinner)
- [ ] **S5-08** Build `ShoppingGroup`: section per category with category icon and item count badge
- [ ] **S5-09** Build `ShoppingItem`: checkbox (strike-through on purchased), quantity input, item name, cost badge, delete button
- [ ] **S5-10** Build `AddItemForm`: inline form at bottom of each group to manually add items
- [ ] **S5-11** Build `ListTotalsBar`: total item count, total estimated cost, items remaining
- [ ] **S5-12** Add "Copy to clipboard" button — exports list as plain text for sharing
- [ ] **S5-13** Add "Clear purchased" button — removes all checked items

---

## Sprint 6 — PWA, Polish & Notifications

**Goal:** Installable PWA, polished responsive design, push notifications.
**Outcome:** App is installable on iOS/Android, looks great on all screen sizes, sends meal reminders.

### PWA
- [ ] **S6-01** Design and add PWA icons: `icon-192.png` and `icon-512.png` (use brand terracotta + leaf motif)
- [ ] **S6-02** Implement service worker with `next-pwa`:
  - Cache static assets and API responses (stale-while-revalidate)
  - Offline fallback page
- [ ] **S6-03** Configure `next-pwa` in `next.config.js`
- [ ] **S6-04** Add "Install App" banner component (shown when `beforeinstallprompt` fires)
- [ ] **S6-05** Implement Web Push API: request notification permission on first login
- [ ] **S6-06** Build notification service (API): store push subscriptions in Cosmos DB; send daily meal reminders at configurable time
- [ ] **S6-07** Add notification preferences to user profile settings (enable/disable, reminder time)

### Responsive Design Polish
- [ ] **S6-08** Mobile navigation: bottom tab bar (Home, Recipes, Planner, List, Profile)
- [ ] **S6-09** Responsive recipe grid: 1 col on mobile, 2 on tablet, 3-4 on desktop
- [ ] **S6-10** Responsive meal planner: horizontal scroll on mobile; day-by-day view toggle
- [ ] **S6-11** Touch-friendly controls: min 44px tap targets, swipe to delete shopping items
- [ ] **S6-12** Add lifestyle photography placeholders for all image slots (use Unsplash category seeds or local SVG illustrations)

### UX Polish
- [ ] **S6-13** Add `Toast` component for success/error feedback (Quick Add, save recipe, etc.)
- [ ] **S6-14** Add `SkeletonLoader` components for recipe cards, planner grid, shopping list
- [ ] **S6-15** Add empty states with illustrations (no recipes found, empty planner, empty list)
- [ ] **S6-16** Add `ErrorBoundary` and global error page
- [ ] **S6-17** Add page transitions (Framer Motion fade-slide)
- [ ] **S6-18** Accessibility pass: ARIA labels, keyboard navigation, focus rings, color contrast ≥ 4.5:1

---

## Sprint 7 — Deployment & Production Hardening

**Goal:** Live, deployed application accessible via custom domain.
**Outcome:** App is running on Azure, CI/CD is fully wired, monitoring is in place.

### Deployment
- [ ] **S7-01** Complete Azure infrastructure provisioning (Bicep deploy to `rg-spicyhealth`)
- [ ] **S7-02** Configure B2C redirect URIs for production domains
- [ ] **S7-03** Add all production secrets to Azure App Service Application Settings and GitHub Actions secrets
- [ ] **S7-04** Configure custom domain + managed TLS on Azure SWA and App Service
- [ ] **S7-05** Deploy staging slot on App Service; test before swapping to production
- [ ] **S7-06** Validate full CI/CD pipeline end-to-end (PR → build → merge → deploy)

### Production Hardening
- [ ] **S7-07** Add Azure Application Insights to API (request tracing, error tracking, performance)
- [ ] **S7-08** Add rate limiting middleware to API (`express-rate-limit`): 100 req/min per IP
- [ ] **S7-09** Add Zod validation to all API routes (currently missing on most routes)
- [ ] **S7-10** Add helmet.js to API (security headers: CSP, HSTS, X-Frame-Options)
- [ ] **S7-11** Configure Content Security Policy header on SWA (`staticwebapp.config.json`)
- [ ] **S7-12** Add Cosmos DB index policies for common query patterns (category, userId, recipeId)
- [ ] **S7-13** Add health check endpoint; configure App Service health check probe
- [ ] **S7-14** Write API integration tests (Supertest): auth, recipe CRUD, shopping list generation
- [ ] **S7-15** Configure Azure Blob lifecycle policy: delete unused uploads > 30 days

### Documentation
- [ ] **S7-16** Update `README.md` with real deployment instructions and env var reference
- [ ] **S7-17** Write `CONTRIBUTING.md` with local dev setup guide
- [ ] **S7-18** Document all API endpoints in OpenAPI 3.0 (`docs/openapi.yaml`)

---

## Backlog (Future Sprints)

| Item | Notes |
|---|---|
| React Native companion app | Shares API; Phase 3 |
| Cost lookup from live grocery APIs | Needs API key sourcing |
| Multi-language support (i18n) | `next-intl` when needed |
| Admin moderation dashboard | Recipe approval queue |
| Recipe rating (1-5 stars) | Beyond comments |
| Meal plan templates | "Vegan week", "High-protein week" |
| Barcode scanner (mobile) | Use camera to look up ingredients |
| Nutritional goal tracking | Daily targets vs actuals graph |
| Sharing recipes via link | Public/private recipe visibility |
| Azure Application Insights dashboards | Oncall observability |

---

## Summary

| Sprint | Theme | Key Deliverables |
|---|---|---|
| S0 ✅ | Scaffold | Monorepo, types, Bicep, CI/CD, SSD |
| S1 | Auth & Design System | Working login, Tailwind theme, NavBar |
| S2 | Recipe Library | Browse, search, filter, detail, create |
| S3 | Social & Profiles | Comments, reactions, saved recipes, profile |
| S4 | Meal Planner | Drag-and-drop planner, Quick Add, weekly totals |
| S5 | Shopping List | Auto-generate, group by category, cost totals |
| S6 | PWA & Polish | Service worker, push notifications, responsive |
| S7 | Deploy & Harden | Azure live, monitoring, security, tests |
