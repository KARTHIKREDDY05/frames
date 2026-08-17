# Deployment

Phase 1 local deployment:

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL and Redis with `docker compose up postgres redis`.
3. Run `pnpm install`.
4. Run `pnpm db:migrate`.
5. Run `pnpm seed`.
6. Start API and worker with `pnpm --filter @frames/api dev` and `pnpm --filter @frames/worker dev`.
7. Start mobile with `pnpm --filter @frames/mobile dev`.

Production deployment should provide managed PostgreSQL, Redis, object storage, CDN, worker autoscaling, Sentry, Prometheus, and Grafana.
