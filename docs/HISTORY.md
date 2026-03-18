# SpicyHealth — Decision History

This file records all significant decisions made during design and development of SpicyHealth.
Every decision that affects architecture, tech stack, process, or scope must be logged here.
Cross-referenced with `SSD.md` (sections) and `SPRINT_PLAN.md` (sprint/task IDs).

---

## [2026-03-17] D-001 — Project inception

**Decision:** Build SpicyHealth as a full-stack healthy food & lifestyle recipe platform.

**Context:** Personal project commissioned for a specific user.

**Scope agreed:**
- Recipe library with search, filters, comments, Quick Add
- Meal planner (drag-and-drop weekly/daily)
- Smart shopping list (auto-generated from plan)
- Nutrition calculator (Open Food Facts API)
- Cost calculator (per recipe + per week)
- Auth: email/password + Google, Microsoft, Facebook via Azure AD B2C
- Progressive Web App (PWA) as mobile baseline
- Azure cloud deployment

**Alternatives considered:** None at this stage.

**References:** SSD §1, SPRINT_PLAN S0–S7

---

## [2026-03-17] D-002 — Monorepo with npm workspaces + Turborepo

**Decision:** Use a single monorepo managed by npm workspaces and Turborepo.

**Context:** Frontend (Next.js) and backend (Express) need to share TypeScript types. A monorepo avoids type drift between API contracts and UI expectations.

**Structure:**
```
apps/web    → Next.js frontend
apps/api    → Express API
packages/shared → shared types
```

**Alternatives considered:**
- Separate repos (rejected: type sync burden, harder to refactor)
- Nx (rejected: heavier tooling than needed at this stage)

**References:** SSD §3, SPRINT_PLAN S0

---

## [2026-03-17] D-003 — Next.js 14 with App Router

**Decision:** Use Next.js 14 (App Router) for the frontend.

**Context:** App Router enables server components, built-in streaming, and file-based routing. Aligns with Azure Static Web Apps deployment model.

**Alternatives considered:**
- Vite + React SPA (rejected: no SSR, worse SEO for recipe pages)
- Remix (rejected: less Azure SWA native support)

**References:** SSD §4.1

---

## [2026-03-17] D-004 — Node.js + Express for the API

**Decision:** Use Node.js 20 LTS with Express 4 and TypeScript for the backend API.

**Context:** Familiar, lightweight, and sufficient for the initial feature set. Shares the TypeScript ecosystem with the frontend.

**Alternatives considered:**
- Azure Functions (considered: simpler infra, but cold starts and local dev complexity rejected for MVP)
- .NET (rejected: language context mismatch with frontend team)
- NestJS (rejected: overkill for current scope; can migrate later)

**Scale-up path:** Migrate hot routes to Azure Functions or container-based deployment if traffic grows.

**References:** SSD §4.2, SPRINT_PLAN S7-05

---

## [2026-03-17] D-005 — Azure Cosmos DB (Serverless, NoSQL)

**Decision:** Use Azure Cosmos DB for NoSQL in Serverless mode as the primary database.

**Context:** Recipe and meal plan data is document-shaped. Serverless mode keeps costs near zero at low traffic and scales automatically.

**Containers:** `recipes`, `meal-plans`, `users`, `comments`, `shopping-lists`

**Alternatives considered:**
- Azure SQL (rejected: relational overhead for document-shaped data; migration complexity)
- MongoDB Atlas (rejected: prefers Azure-native to avoid cross-cloud egress costs)
- Cosmos DB provisioned RU/s (deferred: revisit at >10k MAU)

**References:** SSD §5, SPRINT_PLAN S1-06

---

## [2026-03-17] D-006 — Azure AD B2C for authentication

**Decision:** Use Azure AD B2C for all authentication (email/password and social OAuth).

**Context:** B2C natively supports Google, Microsoft, and Facebook as identity providers. Eliminates need for a custom OAuth implementation and manages token issuance, JWKS, and user flows.

**User flow:** `B2C_1_signupsignin` (combined sign-up and sign-in)

**Token validation:** `jwks-rsa` + `jsonwebtoken` in API `authMiddleware`.

**Alternatives considered:**
- Auth0 (rejected: additional cost and vendor outside Azure ecosystem)
- Supabase Auth (rejected: not Azure-native)
- Custom JWT (rejected: security risk, maintenance burden)

**References:** SSD §7, SPRINT_PLAN S1-02–S1-05

---

## [2026-03-17] D-007 — Open Food Facts for nutrition data

**Decision:** Use Open Food Facts API as the nutrition data source for per-ingredient calorie and macro lookup.

**Context:** Free, public, no API key required. Covers a wide range of European grocery products. Lookup by barcode or name search.

**Endpoints used:**
- `GET /api/v2/product/{barcode}.json`
- `GET /api/v2/search?search_terms={q}`

**Limitations acknowledged:**
- Coverage gaps for fresh produce (no barcode)
- Data quality varies by contributor
- No guaranteed uptime SLA

**Alternatives considered:**
- USDA FoodData Central (considered: good data quality but US-centric)
- Edamam Nutrition API (rejected: paid tier required for production use)
- Manual data entry (rejected: too much friction for recipe creation)

**References:** SSD §9.1, SPRINT_PLAN S2-06, S2-07

---

## [2026-03-17] D-008 — PWA as mobile baseline (no React Native for MVP)

**Decision:** Ship a PWA as the mobile app for MVP. React Native is deferred to backlog.

**Context:** A well-configured Next.js PWA (service worker, manifest, responsive layout) is installable on iOS and Android from the browser. It shares 100% of the codebase and ships faster.

**PWA features planned:**
- Installable (`manifest.json`, standalone display)
- Offline cache (static assets + last-viewed recipes)
- Push notifications (meal reminders)

**React Native:** Recorded in backlog. Can share API layer when prioritized.

**References:** SSD §4.1.3, SPRINT_PLAN S6

---

## [2026-03-17] D-009 — Azure Blob Storage for media

**Decision:** Store all recipe images and user avatars in Azure Blob Storage.

**Pattern:** API generates a SAS URL → client uploads directly to Blob → API stores the final public URL in Cosmos DB. Avoids routing binary data through the API server.

**Container:** `media` (public read)

**Alternatives considered:**
- Store in Cosmos DB (rejected: document store not suited for binary blobs)
- Cloudinary (rejected: outside Azure ecosystem; additional cost)

**References:** SSD §8.1, SPRINT_PLAN S2-08

---

## [2026-03-17] D-010 — Design language: feminine lifestyle aesthetic

**Decision:** Apply a warm, feminine lifestyle design language throughout the UI.

**Design tokens:**
| Token | Value | Use |
|---|---|---|
| `blush` | `#f4b8b0` | Accents, tags |
| `sage` | `#8fad88` | Secondary actions, icons |
| `cream` | `#fdf6f0` | Page backgrounds |
| `terracotta` | `#d4856a` | Primary CTA buttons |
| `charcoal` | `#3a3a3a` | Body text |

**Typography:** Playfair Display (headings) + Inter (body) via `next/font`

**Components:** `rounded-2xl` border radius default; soft box shadows; 44px min touch targets.

**References:** SSD §4.1, SPRINT_PLAN S1-10–S1-16

---

## [2026-03-011] D-011 — Cost estimate target: ~€23–28/month

**Decision:** Target Azure infrastructure cost of ~€23–28/month for low-traffic production.

**Breakdown:**
| Service | Tier | €/month |
|---|---|---|
| Azure Static Web Apps | Standard | €9 |
| Azure App Service | B1 | €13 |
| Cosmos DB | Serverless | €0–5 |
| Blob Storage | LRS | <€1 |
| Azure AD B2C | ≤50k MAU free | €0 |

**Scale trigger:** Move App Service to P1v3 (~€60) and Cosmos DB to autoscale when >10k MAU.

**References:** SSD §8.4, SPRINT_PLAN S7-01

---

## [2026-03-17] D-012 — Drag-and-drop library: @dnd-kit

**Decision:** Use `@dnd-kit/core` + `@dnd-kit/sortable` for the meal planner drag-and-drop.

**Context:** `@dnd-kit` is accessibility-first, supports touch/pointer events (important for PWA/mobile), and has no jQuery dependency.

**Alternatives considered:**
- `react-beautiful-dnd` (rejected: unmaintained, no longer actively developed)
- `react-dnd` (rejected: more complex setup, HTML5 DnD backend has poor mobile support)

**References:** SPRINT_PLAN S4-06

---

## [2026-03-17] D-013 — Sprint cadence: 2-week sprints, 7 sprints post-scaffold

**Decision:** 2-week sprint cadence. 7 sprints planned (S1–S7) covering all MVP and v1 features.

**Sprint themes:**
| Sprint | Theme |
|---|---|
| S1 | Auth & Design System |
| S2 | Recipe Library |
| S3 | Social & Profiles |
| S4 | Meal Planner |
| S5 | Shopping List |
| S6 | PWA & Polish |
| S7 | Deploy & Harden |

**References:** SPRINT_PLAN summary table

---

## [2026-03-17] D-014 — Input validation: Zod on all API routes

**Decision:** Use Zod for request body and query parameter validation on all API routes.

**Context:** All current API routes have no validation (noted in sprint plan as S7-09). Zod provides runtime type safety and integrates cleanly with TypeScript.

**Alternatives considered:**
- `express-validator` (rejected: verbose, less ergonomic than Zod)
- Manual validation (rejected: error-prone)

**Note:** This was identified as a gap during sprint planning. Should be applied from S1 onwards, not deferred to S7.

**References:** SSD §7.3, SPRINT_PLAN S7-09

---

## [2026-03-17] D-015 — Security middleware: helmet.js + express-rate-limit

**Decision:** Add `helmet.js` (security headers) and `express-rate-limit` (100 req/min/IP) to the API.

**Context:** Identified as gap during production hardening sprint planning.

**References:** SSD §7.3, SPRINT_PLAN S7-08, S7-10

---

## [2026-03-17] D-016 — Terraform replaces Azure Bicep for infrastructure

**Decision:** Use Terraform (HashiCorp) instead of Azure Bicep for infrastructure-as-code.

**Context:** User preference. Terraform is cloud-agnostic, has a larger ecosystem, and is more familiar for DevOps workflows crossing multiple cloud providers.

**Details:**
- Provider: `hashicorp/azurerm`
- All credentials (subscription ID, client ID, client secret, tenant ID) passed as variables — never hardcoded
- `infra/bicep/` replaced by `infra/terraform/`
- State backend: Azure Blob Storage (configured in `backend.tf`)
- Variables defined in `variables.tf`; values supplied via `terraform.tfvars` (gitignored) or environment variables (`TF_VAR_*`)

**Alternatives considered:**
- Azure Bicep (original choice, D-012 superseded by this decision)
- Pulumi (not chosen: less familiar tooling for user's team)

**Impact on sprint plan:** S1-01 updated to use `terraform init / plan / apply` instead of `az deployment group create`.

**References:** SSD §8, SPRINT_PLAN S1-01

---

## [2026-03-17] D-017 — Entra External ID replaces Azure AD B2C

**Decision:** Use Microsoft Entra External ID instead of Azure AD B2C.

**Context:** Azure AD B2C is no longer available to new customers as of May 1, 2025. Entra External ID is the official Microsoft replacement with equivalent capabilities.

**Details:**
- Same social provider support: Google, Microsoft, Facebook
- Same JWT token issuance and JWKS endpoint pattern
- Configured via portal.azure.com → Microsoft Entra External ID
- Free tier: 50k MAU
- Auth middleware in API unchanged — still validates Bearer JWT via JWKS

**Impact:** All references to "Azure AD B2C" in SSD.md and SPRINT_PLAN.md updated to "Entra External ID". `terraform.tfvars` `b2c_tenant` variable repurposed for Entra tenant name.

**References:** SSD §7, SPRINT_PLAN S1-02–S1-05

---

## [2026-03-18] D-018 — Auth: replace MSAL ROPC with bcryptjs + self-signed JWT

**Decision:** Drop Azure AD B2C / MSAL ROPC in favour of bcryptjs password hashing and HS256 JWTs issued by the API itself.

**Context:** ROPC (Resource Owner Password Credentials) can only authenticate existing users — it cannot create new accounts. Creating users in B2C requires Microsoft Graph API with `User.ReadWrite.All` permission, which was not provisioned. Additionally, the authority URL and JWKS URI were misconfigured. The net result: register and login both failed.

**Details:**
- Passwords hashed with bcrypt (cost 12), stored in Cosmos DB `users` container
- JWT signed with `JWT_SECRET` env var (HS256, 7d expiry)
- `authMiddleware` simplified to `jwt.verify` — no JWKS, no external dependency
- `@azure/msal-node` and `jwks-rsa` can be removed when next cleanup happens

**Alternatives considered:**
- Fix MSAL + provision Graph API permissions (deferred: adds Azure setup complexity; revisit when social OAuth is needed)
- Use B2C hosted UI redirect (rejected: breaks email/password API flow)

**References:** SPRINT_PLAN S1-17/18/19, S6 auth fix

---

## [2026-03-18] D-019 — UI language: German

**Decision:** All UI text is written in German. No English/German toggle — the app is German-only.

**Context:** The app is a personal project for a German-speaking user (the developer's wife). There is no requirement for English UI.

**Details:**
- All hardcoded strings in React components translated to German
- Error messages, labels, placeholders, navigation, category names all in German
- `next-intl` (listed in backlog) not needed; direct string replacement is sufficient for a single-language app

**Alternatives considered:**
- next-intl for full i18n (deferred to backlog — only add if English is ever needed)

**References:** SPRINT_PLAN backlog (i18n item)

---

## Template for future decisions

```
## [YYYY-MM-DD] D-XXX — Short title

**Decision:** What was decided.

**Context:** Why this decision was needed.

**Details:** Specifics of the decision.

**Alternatives considered:**
- Option A (rejected: reason)
- Option B (deferred: reason)

**References:** SSD §X.Y, SPRINT_PLAN S#-##
```
