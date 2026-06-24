# Multi-stage build for @auror/backend.
# Shared is source-only TS, so the runtime keeps tsx (now a runtime dep) and
# loads .ts files directly. Compiling shared is deferred until it has enough
# surface to justify the extra build step.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

# ---------- build (typecheck + prove lockfile) ----------
FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
RUN pnpm install --frozen-lockfile
COPY packages/shared packages/shared
COPY packages/backend packages/backend
RUN pnpm --filter @auror/backend typecheck

# ---------- prod-deps (skip devDependencies) ----------
FROM base AS prod-deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
RUN pnpm install --prod --frozen-lockfile

# ---------- runtime ----------
FROM node:20-alpine AS runtime
RUN apk add --no-cache tini \
  && addgroup -S app \
  && adduser -S app -G app
WORKDIR /app
COPY --from=prod-deps --chown=app:app /repo/node_modules ./node_modules
COPY --from=prod-deps --chown=app:app /repo/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=build --chown=app:app /repo/packages/backend/src ./packages/backend/src
COPY --from=build --chown=app:app /repo/packages/backend/package.json ./packages/backend/package.json
COPY --from=build --chown=app:app /repo/packages/backend/tsconfig.json ./packages/backend/tsconfig.json
COPY --from=build --chown=app:app /repo/packages/shared/src ./packages/shared/src
COPY --from=build --chown=app:app /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=build --chown=app:app /repo/packages/shared/tsconfig.json ./packages/shared/tsconfig.json
COPY --chown=app:app package.json pnpm-workspace.yaml ./
USER app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4000
EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "packages/backend/node_modules/tsx/dist/cli.mjs", "packages/backend/src/server.ts"]
