# PostgreSQL Deployment

Frames uses PostgreSQL through Prisma.

## Required

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/frames?sslmode=require
```

## Migration

```bash
corepack pnpm --filter @frames/api prisma:generate
corepack pnpm --filter @frames/api prisma:migrate:deploy
```

The initial migration is stored at:

```text
services/api/prisma/migrations/20260817170000_init/migration.sql
```

## Providers

Frames is currently using Supabase:

```text
Project ref: fjhfmxpuyijwinvmqsch
Host: db.fjhfmxpuyijwinvmqsch.supabase.co
Region: ap-south-1
```

Connection string:

```text
DATABASE_URL=postgresql://postgres:<DATABASE_PASSWORD>@db.fjhfmxpuyijwinvmqsch.supabase.co:5432/postgres?sslmode=require
```

Other compatible managed PostgreSQL providers:

- Neon
- Supabase
- Render PostgreSQL
- Railway PostgreSQL
- AWS RDS

The backend must also have Redis for BullMQ workers:

```text
REDIS_URL=rediss://USER:PASSWORD@HOST:6379
```

## Production Rules

- `LOCAL_JSON_DB=false`
- `DEMO_MODE=false`
- Run migrations before starting the API.
- Keep backups enabled.
- Keep database access private to backend services.
