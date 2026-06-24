# Multi-stage build for @auror/author.
#
# Ships to author.auror.my. The `Domain=.auror.my` cookie option is applied
# in `lib/supabase.ts` so a single login authenticates across reader/author
# subdomains (the apex-cookie trick from docs/development/dev-frontend-split.md
# §B.2 + §C.1).

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY packages/author/package.json packages/author/
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /repo/packages/author/node_modules ./packages/author/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared packages/shared
COPY packages/author packages/author
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @auror/author build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=app:app /repo/packages/author/.next/standalone ./
COPY --from=build --chown=app:app /repo/packages/author/.next/static ./packages/author/.next/static
COPY --from=build --chown=app:app /repo/packages/author/public ./packages/author/public
USER app
EXPOSE 3000
CMD ["node", "packages/author/server.js"]