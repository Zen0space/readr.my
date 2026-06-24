# Multi-stage build for @auror/admin.
#
# Ships to admin.auror.my. The strictest security boundary of the three
# frontends — same Domain=.auror.my apex cookie as reader/author, plus a
# locked-down CSP (default-src 'self') enforced by next.config.mjs.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY packages/admin/package.json packages/admin/
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /repo/packages/admin/node_modules ./packages/admin/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared packages/shared
COPY packages/admin packages/admin
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @auror/admin build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=app:app /repo/packages/admin/.next/standalone ./
COPY --from=build --chown=app:app /repo/packages/admin/.next/static ./packages/admin/.next/static
COPY --from=build --chown=app:app /repo/packages/admin/public ./packages/admin/public
USER app
EXPOSE 3000
CMD ["node", "packages/admin/server.js"]