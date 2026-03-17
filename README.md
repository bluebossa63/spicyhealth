# SpicyHealth

A healthy food & lifestyle recipe platform with meal planning, nutrition tracking, and smart shopping lists.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript, deployed to Azure Static Web Apps
- **Backend**: Node.js + Express + TypeScript, deployed to Azure App Service
- **Database**: Azure Cosmos DB (Serverless)
- **Auth**: Azure AD B2C (Google, Microsoft, Facebook OAuth)
- **Storage**: Azure Blob Storage
- **Mobile**: PWA (installable on iOS & Android)
- **CI/CD**: GitHub Actions → Azure

## Local Development

### Prerequisites
- Node.js 20+
- npm 10+

### Setup

```bash
# Install all workspace dependencies
npm install

# Start API (port 3001)
npm run dev --workspace=apps/api

# Start web (port 3000)
npm run dev --workspace=apps/web
```

### Environment Variables

Copy `.env.example` to `.env` in each app and fill in:

**apps/api/.env**
```
COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_KEY=your-key
COSMOS_DB_NAME=spicyhealth
B2C_TENANT=your-tenant
B2C_POLICY=B2C_1_signupsignin
ALLOWED_ORIGIN=http://localhost:3000
PORT=3001
```

**apps/web/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Deployment

See `.github/workflows/deploy.yml` and `infra/main.bicep`.

```bash
# Deploy Azure infrastructure
az deployment group create \
  --resource-group rg-spicyhealth \
  --template-file infra/main.bicep \
  --parameters @infra/parameters.json
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full architecture diagram, API reference, and pricing breakdown.
