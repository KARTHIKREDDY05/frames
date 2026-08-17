FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages ./packages
COPY services/worker/package.json ./services/worker/package.json
COPY services/api/prisma ./services/api/prisma
RUN pnpm install --filter @frames/worker... --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY services/worker ./services/worker
RUN pnpm --filter @frames/worker build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
CMD ["pnpm", "--filter", "@frames/worker", "start"]
