# SpicyHealth 🌿

Healthy recipe platform with meal planning and smart shopping lists. Built for family use.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (static export), Tailwind CSS v3, TypeScript |
| Backend | Node.js + Express + TypeScript |
| Auth | bcryptjs + JWT (HS256) |
| Database | Azure Cosmos DB (Serverless, NoSQL) |
| Storage | Azure Blob Storage (images + avatars) |
| Infra | Terraform (azurerm ~3.100) |
| CI/CD | GitHub Actions → Azure SWA + App Service |
| Monitoring | Azure Application Insights |

## Local development

### Prerequisites
- Node.js 20+
- npm 10+

### Setup

```bash
git clone git@github.com:bluebossa63/spicyhealth.git
cd spicyhealth
npm install
```

Create `apps/api/.env`:
```env
COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_KEY=your-key
COSMOS_DB_NAME=spicyhealth
STORAGE_ACCOUNT=your-storage-account
STORAGE_CONTAINER=media
STORAGE_KEY=your-storage-key
JWT_SECRET=any-long-random-string
ALLOWED_ORIGIN=http://localhost:3000
PORT=3001
```

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Run

```bash
# Build shared types first
npm run build --workspace=packages/shared

# Start API (hot reload)
npm run dev --workspace=apps/api

# Start web (separate terminal)
npm run dev --workspace=apps/web
```

Web: http://localhost:3000
API: http://localhost:3001

## Production deployment

Infrastructure is managed via Terraform in `infra/terraform/`.

### Azure resources

| Resource | Name |
|---|---|
| Resource Group | rg-spicyhealth-prod |
| Static Web App | spicyhealth-web-prod |
| App Service | spicyhealth-api-prod |
| Cosmos DB | spicyhealth-cosmos-prod |
| Storage | spicyhealthmediaprod |
| App Insights | spicyhealth-insights-prod |

### Required GitHub secrets

| Secret | Description |
|---|---|
| `AZURE_STATIC_WEB_APPS_TOKEN` | SWA deployment token |
| `AZURE_API_PUBLISH_PROFILE` | App Service publish profile |

### Required App Service settings

| Setting | Description |
|---|---|
| `JWT_SECRET` | HS256 signing secret (min 32 chars) |
| `COSMOS_ENDPOINT` | Set by Terraform |
| `COSMOS_KEY` | Set by Terraform |
| `COSMOS_DB_NAME` | Set by Terraform |
| `STORAGE_ACCOUNT` | Set by Terraform |
| `STORAGE_CONTAINER` | Set by Terraform |
| `STORAGE_KEY` | Set by Terraform |
| `ALLOWED_ORIGIN` | Set by Terraform (SWA URL) |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Set by Terraform |

### Deploy

Deployment is fully automated via GitHub Actions on push to `main`.

To provision from scratch:
```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars  # fill in credentials
terraform init
terraform apply
```

## Project structure

```
spicyhealth/
├── apps/
│   ├── api/          # Express API
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared TypeScript types
├── infra/
│   └── terraform/    # Azure infrastructure
└── docs/
    ├── SSD.md        # Architecture document
    ├── SPRINT_PLAN.md
    └── HISTORY.md    # Decision log
```

## Features

- 🍽️ Recipe library — search, filter, create, comment
- 📅 Meal planner — drag-and-drop weekly grid
- 🛒 Shopping list — auto-generated from meal plan
- 🥗 Nutrition tracking — Open Food Facts integration
- 👤 User profiles — dietary preferences, saved recipes
- 📱 PWA — installable on iOS/Android
