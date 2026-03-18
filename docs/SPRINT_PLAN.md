# SpicyHealth — Sprint Plan

**Version:** 0.7.0 | **Date:** 2026-03-18 | **Sprint length:** 2 weeks

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
| Design system | Blush/sage/cream theme, rounded UI, responsive | ✅ Done (S1) |
| Auth UI | Login, register, social OAuth | ✅ Email/password done; social OAuth deferred (S1) |
| Auth API | bcryptjs + HS256 JWT, user creation | ✅ Done (S1/D-018) |
| Recipe library UI | Grid, search, filters | ✅ Done (S2) |
| Recipe detail UI | Ingredients, nutrition, cost, comments | ✅ Done (S2) |
| Recipe API | CRUD, Cosmos DB queries | ✅ Done (S2) |
| Image upload | Azure Blob Storage via SAS URL | ✅ Done (S2) |
| Comment system | Threaded comments, likes, emoji reactions | ✅ Done (S3) |
| Quick Add for Today | Log to today's plan | ✅ Done (S2) |
| Meal planner UI | Drag-and-drop weekly grid | ✅ Done (S4) |
| Meal planner API | Day slot CRUD | ✅ Done (S4) |
| Shopping list UI | Auto-generated, grouped, editable | ✅ Done (S5) |
| Shopping list API | Generate from plan, aggregate ingredients | ✅ Done (S5) |
| Nutrition lookup | Open Food Facts integration | ✅ Done (S2) |
| Nutrition calculator | Per recipe + per day totals | ✅ Done (S2/S4) |
| Cost calculator | Per recipe + per week | ✅ Done (S2/S4) |
| User profile | Saved recipes, preferences, avatar | ✅ Done (S3) |
| PWA | Manifest + next-pwa config | ⚠️ Manifest done; icons/SW/push pending (S6) |
| Azure infrastructure | Terraform — Cosmos, Blob, App Service, SWA | ✅ Live in production (S1) |
| CI/CD | GitHub Actions → Azure | ✅ Secrets set, pipeline active (S1) |

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
- [x] **S1-08** Set GitHub Actions secrets: `AZURE_API_PUBLISH_PROFILE`, `AZURE_STATIC_WEB_APPS_TOKEN`
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

## Sprint 2 — Recipe Library ✅

**Goal:** Users can browse, search, filter, and view recipes.
**Outcome:** Fully functional recipe library with real data, beautiful UI.

### API
- [x] **S2-01** Implement `GET /api/recipes`: Cosmos DB query with filters (`category`, `dietary`, `maxCalories`, `maxPrepTime`, `maxCost`, `search` full-text); pagination (`page`, `pageSize`)
- [x] **S2-02** Implement `GET /api/recipes/:id`: fetch recipe by ID with full ingredient detail
- [x] **S2-03** Implement `POST /api/recipes`: Zod validation, save to Cosmos DB, return created recipe
- [x] **S2-04** Implement `PUT /api/recipes/:id`: author-only update
- [x] **S2-05** Implement `DELETE /api/recipes/:id`: author-only soft delete
- [x] **S2-06** Implement `GET /api/nutrition/search?q=`: proxy to Open Food Facts search
- [x] **S2-07** Implement `GET /api/nutrition/:barcode`: proxy to Open Food Facts product lookup
- [x] **S2-08** Add image upload endpoint `POST /api/recipes/upload-image`: generate SAS URL → client uploads directly to Blob Storage; return final URL

### Frontend — Recipe List
- [x] **S2-09** Build `SearchBar` component (debounced input, 300ms)
- [x] **S2-10** Build `FilterPanel` component: category chips, calories/prep-time/cost sliders
- [x] **S2-11** Build `RecipeGrid` component: responsive grid (1→2→3→4 col), skeleton loading state
- [x] **S2-12** Build `RecipeCard` component: image, badges, category chip, Quick Add, heart/save
- [x] **S2-13** Build `/recipes` page: SearchBar + FilterPanel + RecipeGrid
- [x] **S2-14** Add "Load more" pagination to recipe list

### Frontend — Recipe Detail
- [x] **S2-15** Create `/recipes/detail?id=` page (static-export compatible)
- [x] **S2-16** RecipeHero: large image, title, meta (author, prep/cook time, servings)
- [x] **S2-17** IngredientList: name, quantity, unit, kcal, cost per ingredient
- [x] **S2-18** Build `NutritionPanel`: macros bar chart per serving and per recipe
- [x] **S2-19** Cost panel: cost per serving and total recipe cost
- [x] **S2-20** InstructionList: numbered steps
- [x] **S2-21** QuickAddButton: POST to `/api/recipes/:id/quick-add`, toast feedback
- [x] **S2-22** SaveRecipeButton: toggle saved state

### Frontend — Recipe Create/Edit
- [x] **S2-23** Build `/recipes/new` 3-step wizard: basic info → ingredients → instructions
- [ ] **S2-24** Auto-calculate nutrition + cost totals as user adds ingredients ⏸ deferred to S3

---

## Sprint 3 — Comments & User Profiles ✅

**Goal:** Social engagement layer and personalization.
**Outcome:** Users can comment, react, save recipes, and manage their profile.

### API
- [x] **S3-01** `GET /api/recipes/:id/comments` — threaded comments
- [x] **S3-02** `POST /api/recipes/:id/comments` — create comment or reply (`parentId` optional)
- [x] **S3-03** `POST /api/comments/:id/like` — toggle like for authenticated user
- [x] **S3-04** `DELETE /api/comments/:id` — author-only delete
- [x] **S3-05** `GET /api/users/me` — full profile with saved recipes and preferences
- [x] **S3-06** `PUT /api/users/me` — update display name, avatar, dietary preferences
- [x] **S3-07** `POST /api/users/me/saved-recipes/:recipeId` — save recipe
- [x] **S3-08** `DELETE /api/users/me/saved-recipes/:recipeId` — unsave recipe
- [x] **S3-13b** `POST /api/comments/:id/react` — emoji reactions with per-user toggle

### Frontend — Comments
- [x] **S3-09** `CommentThread` component: root comments + nested replies, optimistic updates
- [x] **S3-10** `CommentItem`: avatar initials, username, timestamp, like count, reply, delete (own)
- [x] **S3-11** `CommentForm`: textarea with submit integrated into CommentThread
- [x] **S3-12** `ReplyForm`: collapsible inline form per comment
- [x] **S3-13** Emoji reactions bar 👍❤️😋🔥 — stored as per-user sets in comment document

### Frontend — User Profile
- [x] **S3-14** `/profile` page: avatar, display name, dietary prefs chips, saved recipes grid
- [x] **S3-15** `AvatarUpload` component: drag-and-drop + preview, SAS URL → Blob Storage
- [x] **S2-24** Auto-calculate nutrition + cost totals as ingredients are added (recipe create wizard)

---

## Sprint 4 — Meal Planner ✅

**Goal:** Drag-and-drop weekly meal planning with nutritional and cost totals.
**Outcome:** Users can plan their full week, see daily totals, and log meals with one click.

### API
- [x] **S4-01** `GET /api/meal-plans/current` — get or create current week's plan; auto-calculates totals
- [x] **S4-02** `GET /api/meal-plans?weekStart=` — get/create any week's plan
- [x] **S4-03** `PUT /api/meal-plans/:id/day/:date` — update slot, recalculate day totals
- [x] **S4-05** `DELETE /api/meal-plans/:id/day/:date/slot/:slot` — remove recipe from slot
- [ ] **S4-04** Quick-add time-of-day detection ⏸ deferred (basic quick-add works via recipe detail)

### Frontend
- [x] **S4-06** `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` installed
- [x] **S4-07** Weekly 8-col grid (slot label + Mon–Sun), week navigation arrows, today highlight
- [x] **S4-08** `MealSlot`: droppable target, compact recipe preview, hover-reveal clear button, `+` picker button
- [x] **S4-09** `RecipePickerModal`: debounced search, image/emoji thumbnails, click-to-assign
- [x] **S4-11** `DayTotalsBar`: calories, cost, P/C/F macros per day column
- [x] **S4-12** `WeekTotalsPanel`: weekly aggregate + avg per active day
- [x] **S4-13** Drag-and-drop wired: `DndContext` → `PUT /api/meal-plans/:id/day/:date`
- [x] **S4-14** `/meal-planner` page: full planner with week nav, totals, modal, drag overlay

---

## Sprint 5 — Shopping List ✅

**Goal:** Smart shopping list auto-generated from meal plan, with manual editing and cost tracking.
**Outcome:** Users get a ready-to-use grouped shopping list with estimated costs.

### API
- [x] **S5-01** `POST /api/shopping-list/generate` — aggregate + deduplicate ingredients from meal plan, auto-categorize
- [x] **S5-02** `GET /api/shopping-list` — fetch/create current list for user
- [x] **S5-03** `POST /api/shopping-list/items` — manually add item with auto-categorization
- [x] **S5-04** `PATCH /api/shopping-list/items/:id` — toggle purchased, update quantity/name
- [x] **S5-05** `DELETE /api/shopping-list/items/:id` — remove item
- [x] **S5-06** `shopping-lists` container added to cosmos.ts (partition key `/userId`)

### Frontend
- [x] **S5-07** `/shopping-list` page with "Generate from plan" button + loading state
- [x] **S5-08** Items grouped by category with icon + count badge
- [x] **S5-09** Checkbox (strike-through on purchased), quantity, name, cost badge, delete button
- [x] **S5-10** Inline add-item form per category + global add form at bottom
- [x] **S5-11** Progress bar (n/total done) + estimated total cost
- [x] **S5-12** "Copy to clipboard" — plain text with emoji category headers
- [x] **S5-13** "Clear done" bulk removes all purchased items

---

## Sprint 6 — PWA, Polish & Notifications ⚠️ Partially complete

**Goal:** Installable PWA, polished responsive design, push notifications.
**Outcome:** App is installable on iOS/Android, looks great on all screen sizes, sends meal reminders.

### PWA
- [~] **S6-01** PWA icons: `icon-192.svg` exists; PNG files required by manifest still missing → carried to S8
- [x] **S6-02** Service worker via `next-pwa` (auto-generated; cache + offline handled by framework)
- [x] **S6-03** `next-pwa` configured in `next.config.js`
- [x] **S6-04** `InstallBanner` component (beforeinstallprompt, full implementation)
- [ ] **S6-05** Web Push permission request on first login ⏸ deferred to backlog
- [ ] **S6-06** Push notification service (API): subscriptions + daily reminders ⏸ deferred to backlog
- [ ] **S6-07** Notification preferences in user profile ⏸ deferred to backlog

### Responsive Design Polish
- [x] **S6-08** Bottom tab bar (mobile, md:hidden) — fully implemented
- [x] **S6-09** Responsive recipe grid: 1→2→3 col (4-col deferred — not required at current traffic)
- [~] **S6-10** Meal planner: horizontal scroll done; day-by-day mobile toggle missing → carried to S8
- [~] **S6-11** Touch targets: present; swipe-to-delete on shopping items missing → carried to S8
- [x] **S6-12** Lifestyle placeholders: emoji-based (🥗🌿🍽️) — sufficient for current scope

### UX Polish
- [x] **S6-13** `Toast` component (success/error/info, auto-dismiss, animation)
- [x] **S6-14** `SkeletonLoader` components (`SkeletonCard`, `SkeletonText`)
- [x] **S6-15** Empty states with emoji illustrations (recipes, shopping list, saved recipes)
- [~] **S6-16** `ErrorBoundary` component exists; not wired to root layout → carried to S8
- [ ] **S6-17** Page transitions (Framer Motion) → carried to S8
- [~] **S6-18** Accessibility: partial (NavBar aria-label, Toast role=alert); full pass → carried to S8

---

## Sprint 7 — Deployment & Production Hardening ⚠️ Partially complete

**Goal:** Live, deployed application accessible via custom domain.
**Outcome:** App is running on Azure, CI/CD is fully wired, monitoring is in place.

### Deployment
- [x] **S7-01** Azure infrastructure live via Terraform (`terraform apply` complete)
- [~] **S7-02** Entra External ID redirect URIs — must add `https://spicyhealth.niceneasy.ch` in Azure portal → carried to S8
- [x] **S7-03** Production secrets set via Terraform app_settings + GitHub Actions secrets
- [x] **S7-04** Custom domain `spicyhealth.niceneasy.ch` configured (Terraform, CNAME in place)
- [ ] **S7-05** Staging slot on App Service → carried to S8
- [ ] **S7-06** Validate CI/CD end-to-end (PR → build → merge → deploy) → carried to S8

### Production Hardening
- [x] **S7-07** Application Insights wired to API (connection string via app_settings; Log Analytics workspace added)
- [x] **S7-08** `express-rate-limit`: 100 req/min/IP in `apps/api/src/index.ts`
- [x] **S7-09** Zod validation on all API routes (auth, recipes, shopping-list, users)
- [x] **S7-10** `helmet.js` active in `apps/api/src/index.ts`
- [ ] **S7-11** CSP header on SWA (`staticwebapp.config.json`) → carried to S8
- [ ] **S7-12** Cosmos DB index policies for category, userId, recipeId → carried to S8
- [x] **S7-13** `GET /health` endpoint; health_check_path configured in Terraform
- [ ] **S7-14** API integration tests (Supertest) → carried to S8
- [ ] **S7-15** Azure Blob lifecycle policy (delete unused uploads > 30 days) → carried to S8

### Documentation
- [~] **S7-16** README exists with basic info; full deployment guide still needed → carried to S8
- [ ] **S7-17** `CONTRIBUTING.md` → carried to S8
- [ ] **S7-18** OpenAPI 3.0 spec (`docs/openapi.yaml`) → carried to S8

---

## Sprint 8 — Finish & Ship

**Goal:** Close all remaining S6/S7 carry-overs and ship the app production-ready.
**Outcome:** `spicyhealth.niceneasy.ch` fully live, polished, tested, and documented.
**Sprint start:** 2026-03-18

> **Velocity tracking:** Each task has an estimate (Est.) in minutes of AI working time.
> Log actual time (Act.) when completed to build velocity data.
> Velocity = Est. / Act. (>1.0 means faster than estimated)

---

### 🔴 Must-do — Ship blockers

| # | Task | Est. | Act. | Status |
|---|---|---|---|---|
| S8-01 | Generate `icon-192.png` + `icon-512.png` from SVG (terracotta, brand colours) | 20 min | — | [ ] |
| S8-02 | Wire `ErrorBoundary` into root layout (`apps/web/src/app/layout.tsx`) | 10 min | — | [ ] |
| S8-03 | Add `spicyhealth.niceneasy.ch` to Entra External ID redirect URIs (Azure portal step + doc) | 15 min | — | [~] Manual step: Azure Portal → Entra External ID → App registrations → spicyhealth → Authentication → Add redirect URI: `https://spicyhealth.niceneasy.ch/auth/callback` |
| S8-04 | Create `staticwebapp.config.json` with CSP, cache and security headers | 20 min | — | [ ] |
| S8-05 | Validate CI/CD end-to-end: trigger a PR, check build passes, merge, confirm deploy | 20 min | — | [ ] |

### 🟠 High value — UX completeness

| # | Task | Est. | Act. | Status |
|---|---|---|---|---|
| S8-06 | Meal planner: day-by-day mobile toggle (< md: show one day at a time, prev/next arrows) | 50 min | — | [ ] |
| S8-07 | Shopping list: swipe-to-delete gesture on mobile items | 40 min | — | [ ] |
| S8-08 | Accessibility pass: ARIA labels on all interactive elements, focus rings, contrast check | 45 min | — | [ ] |
| S8-09 | Page transitions: Framer Motion fade-slide between routes | 50 min | — | [ ] |

### 🟡 Production hardening

| # | Task | Est. | Act. | Status |
|---|---|---|---|---|
| S8-10 | Cosmos DB index policies in Terraform (category, userId, recipeId) | 30 min | — | [ ] |
| S8-11 | Azure Blob lifecycle policy in Terraform (delete unused uploads > 30 days) | 20 min | — | [ ] |
| S8-12 | API integration tests: auth + recipe CRUD + shopping list (Supertest) | 90 min | — | [ ] |
| S8-13 | App Service staging slot — Terraform + swap-to-production workflow | 40 min | — | [ ] |

### 🔵 Documentation

| # | Task | Est. | Act. | Status |
|---|---|---|---|---|
| S8-14 | `README.md`: real deployment instructions, env var reference, local dev guide | 30 min | — | [ ] |
| S8-15 | `CONTRIBUTING.md`: local setup, branch strategy, PR checklist | 25 min | — | [ ] |
| S8-16 | `docs/openapi.yaml`: OpenAPI 3.0 spec for all API endpoints | 60 min | — | [ ] |

---

### Sprint 8 — Velocity Summary

| Metric | Value |
|---|---|
| Total tasks | 16 |
| Total estimated | 555 min (~9.25 h) |
| Total actual | — |
| Tasks completed | 0 / 16 |
| Velocity (Est/Act) | — |

> Push notifications (S6-05/06/07) deferred to backlog — requires VAPID key setup and is not blocking the launch.

---

## Sprint 9 — Content & DX

**Goal:** Make it easy to add quality content and fix pain points discovered in production.
**Outcome:** Recipe import skill works end-to-end; mobile login fixed; encoding correct; Figma workflow established.
**Sprint start:** 2026-04-01

> **Velocity tracking:** Each task has an estimate (Est.) in minutes of AI working time.
> Log actual time (Act.) when completed to build velocity data.

---

### 🔴 Must-do — Production bugs

| # | Task | Est. | Act. | Status |
|---|---|---|---|---|
| S9-01 | Fix mobile login "failed to fetch" — investigate CORS / network error on mobile data | 30 min | — | [ ] |
| S9-02 | Fix recipe encoding: ensure all API routes accept + store proper UTF-8 umlauts (ä ö ü ß) | 20 min | — | [ ] |

### 🟠 Developer experience — Recipe import skill

| # | Task | Est. | Act. | Status |
|---|---|---|---|---|
| S9-03 | Write `/import-recipe` Claude Code skill: accepts recipe description, POSTs to API with correct UTF-8 encoding | 45 min | — | [ ] |
| S9-04 | Add photo fetch + Azure Blob upload to import skill (auto-search Unsplash → SAS upload → set imageUrl) | 40 min | — | [ ] |
| S9-05 | Seed 10 quality recipes via import skill to populate the app | 30 min | — | [ ] |

### 🟡 Design workflow

| # | Task | Est. | Act. | Status |
|---|---|---|---|---|
| S9-06 | Establish Figma → code workflow: import live site via Builder.io plugin, verify MCP read access | 20 min | — | [ ] |
| S9-07 | Keep `figma-developer-mcp` HTTP server auto-starting on Windows login (Task Scheduler entry) | 15 min | — | [ ] |

---

### Sprint 9 — Velocity Summary

| Metric | Value |
|---|---|
| Total tasks | 7 |
| Total estimated | 200 min (~3.3 h) |
| Total actual | — |
| Tasks completed | 0 / 7 |
| Velocity (Est/Act) | — |

---

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
| S1 ✅ | Auth & Design System | Working login, Tailwind theme, NavBar |
| S2 ✅ | Recipe Library | Browse, search, filter, detail, create |
| S3 ✅ | Social & Profiles | Comments, reactions, saved recipes, profile |
| S4 ✅ | Meal Planner | Drag-and-drop planner, Quick Add, weekly totals |
| S5 ✅ | Shopping List | Auto-generate, group by category, cost totals |
| S6 ⚠️ | PWA & Polish | Service worker, install banner, bottom nav, toast, skeletons — push notifications deferred |
| S7 ⚠️ | Deploy & Harden | Infra live, custom domain, App Insights, rate limiting, Zod, helmet — tests + docs carried |
| S8 | Finish & Ship | Icons, ErrorBoundary, CSP, mobile planner, swipe-delete, a11y, tests, docs |
| S9 | Content & DX | Recipe import skill, encoding fix, mobile login fix, Figma workflow |
