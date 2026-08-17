FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages ./packages
COPY services/api/package.json ./services/api/package.json
RUN pnpm install --filter @frames/api... --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY services/api ./services/api
RUN pnpm --filter @frames/api prisma:generate
RUN pnpm --filter @frames/api build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3001
CMD ["pnpm", "--filter", "@frames/api", "start"]
