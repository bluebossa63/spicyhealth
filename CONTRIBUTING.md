# Contributing to SpicyHealth

## Development workflow

1. Fork the repository and create a feature branch: `git checkout -b feat/your-feature`
2. Follow the local setup steps in [README.md](README.md)
3. Make changes, write/update tests
4. Run `npm test --workspace=apps/api` — all tests must pass
5. Open a pull request against `main`

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add nutrition badge to recipe card
fix: correct CORS header on staging slot
chore: bump azurerm provider to 3.110
docs: add CONTRIBUTING guide
```

## Branching

| Branch | Purpose |
|---|---|
| `main` | Production — auto-deploys to Azure |
| `feat/*` | New features |
| `fix/*` | Bug fixes |
| `chore/*` | Tooling, deps, infra |

## Code style

- TypeScript strict mode — no `any` in new code without a comment
- Tailwind class order: layout → sizing → spacing → color → state
- API routes: validate with Zod before touching the database
- No `console.log` in production paths — use `console.error` for caught errors only

## Adding a new API route

1. Create `apps/api/src/routes/your-route.ts`
2. Register it in `apps/api/src/index.ts`
3. Add shared types to `packages/shared/src/types.ts` if needed
4. Write at least a happy-path + auth test in `src/__tests__/your-route.test.ts`
5. Document the endpoint in `docs/openapi.yaml`

## Terraform changes

- Run `terraform fmt` before committing `.tf` files
- Run `terraform validate` locally
- Never commit `terraform.tfvars` — it contains secrets
- Destructive changes (resource replacement) must be noted in the PR description

## Secrets

- API keys and connection strings live in Azure App Service settings (set by Terraform or manually for `JWT_SECRET`)
- Local dev uses `apps/api/.env` (git-ignored)
- Never commit credentials — pre-commit hook blocks `.env` files

## Releasing

Releases follow [SemVer](https://semver.org/). Version is tracked in `docs/SPRINT_PLAN.md`. Tag with:

```bash
git tag v0.8.0 -m "Sprint 8 — PWA, accessibility, Terraform hardening"
git push origin v0.8.0
```
