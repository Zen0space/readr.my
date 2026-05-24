# Multi-stage build. Builds shared + backend; runs with tsx for now (TS is light enough).
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
RUN pnpm install --filter @readr/backend... --frozen-lockfile=false

FROM base AS runtime
COPY --from=deps /repo/node_modules /repo/node_modules
COPY --from=deps /repo/packages/shared/node_modules /repo/packages/shared/node_modules
COPY --from=deps /repo/packages/backend/node_modules /repo/packages/backend/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared packages/shared
COPY packages/backend packages/backend
EXPOSE 4000
CMD ["pnpm", "--filter", "@readr/backend", "start"]
