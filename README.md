# Frames

Frames is a mobile social scrapbook app: capture now, organize never, remember forever.

This repo is the Stage 1 foundation plus a demo-mode MVP scaffold:

- Expo React Native app with Expo Router.
- Express TypeScript API.
- PostgreSQL schema with Prisma.
- Redis/BullMQ worker architecture.
- Deterministic scrapbook renderer.
- Shared packages for types, UI tokens, config, and templates.
- Docker Compose for local PostgreSQL, Redis, API, and worker.

## Local Setup

```bash
pnpm install
copy .env.example .env
docker compose up postgres redis
pnpm db:generate
pnpm db:migrate
pnpm seed
pnpm --filter @frames/api dev
pnpm --filter @frames/worker dev
pnpm --filter @frames/mobile dev
```

Demo login uses the mobile demo button flow. Seeded backend users use password `password123`.

## Run Without Docker

If Docker/PostgreSQL/Redis are not installed yet, run the local JSON-backed API for real HTTP testing:

```powershell
corepack pnpm --filter @frames/api build
$env:PORT="3002"
$env:LOCAL_JSON_DB="true"
$env:JWT_SECRET="dev-access-secret"
$env:JWT_REFRESH_SECRET="dev-refresh-secret"
node services/api/dist/services/api/src/index.js
```

Then test:

- API health: `http://localhost:3002/health`
- Mobile/web preview: `http://localhost:8080`

Local JSON data is stored at `services/api/.local/local-db.json`.

## Production Deployment Targets

This repo now includes deploy configs for real hosting:

- `render.yaml`: API, worker, web, PostgreSQL, and Redis blueprint.
- `services/api/Dockerfile`: production API image.
- `services/worker/Dockerfile`: production worker image.
- `apps/mobile/Dockerfile.web`: desktop/web app image using the Expo web export.
- `railway.json`: API service deploy starter.
- `fly.toml`: Fly.io API service deploy starter.
- `docs/SUPABASE.md`: active Supabase project and database setup.
- `docs/ADMIN_AND_EXTERNAL_USER_VIEWS.md`: administrator versus external-user data access and storage flow.
- `docs/MOBILE_APP_GUIDE.md`: how the mobile app is structured, what each folder does, and how to build shareable APKs before Play Store release.

For a real launch, set these environment variables in the hosting provider:

```text
DATABASE_URL
REDIS_URL
JWT_SECRET
JWT_REFRESH_SECRET
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_BUCKET_NAME
CDN_URL
EXPO_PUBLIC_API_URL
SENTRY_DSN
```

## Structure

```text
apps/mobile
apps/web-share
services/api
services/worker
services/scrapbook-renderer
packages/types
packages/ui
packages/config
packages/templates
docs
infrastructure
```

## Current Status

The first build slice establishes architecture and user-facing demo screens. It is ready for dependency installation, Prisma migration, and iterative MVP hardening.
