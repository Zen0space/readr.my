# Multi-stage build for @auror/webapp.
# Assumes the webapp will use Next.js with `output: "standalone"` in
# next.config.js. Until the webapp gets scaffolded, this image will fail at
# the `next build` step — that's intentional, so the release workflow stays
# wired and starts producing images the moment the source lands.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY packages/webapp/package.json packages/webapp/
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /repo/packages/webapp/node_modules ./packages/webapp/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared packages/shared
COPY packages/webapp packages/webapp
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @auror/webapp build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
# Next.js standalone bundle contains its own minimal node_modules + server.js
COPY --from=build --chown=app:app /repo/packages/webapp/.next/standalone ./
COPY --from=build --chown=app:app /repo/packages/webapp/.next/static ./packages/webapp/.next/static
COPY --from=build --chown=app:app /repo/packages/webapp/public ./packages/webapp/public
USER app
EXPOSE 3000
CMD ["node", "packages/webapp/server.js"]
