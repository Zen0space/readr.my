# Multi-stage build for @auror/reader.
#
# This package ships to `auror.my` (apex). The `Domain=.auror.my` cookie
# option is applied in `lib/supabase.ts` so a single login authenticates
# across reader/author/admin subdomains.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY packages/reader/package.json packages/reader/
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /repo/packages/reader/node_modules ./packages/reader/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared packages/shared
COPY packages/reader packages/reader
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @auror/reader build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=app:app /repo/packages/reader/.next/standalone ./
COPY --from=build --chown=app:app /repo/packages/reader/.next/static ./packages/reader/.next/static
COPY --from=build --chown=app:app /repo/packages/reader/public ./packages/reader/public
USER app
EXPOSE 3000
CMD ["node", "packages/reader/server.js"]