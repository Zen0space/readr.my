---
name: backend
description: Conventions for the @auror/backend package — Node.js + Fastify REST API, Supabase, Redis. No tRPC, no `as any`, simple but production-grade.
---

# backend skill

Rules for working inside `packages/backend`. This is the Node.js API server. It talks to Supabase (Postgres + Auth + Storage) and Redis, and exposes a **REST API** to the webapp and desktop clients.

## Stack decisions (settled)

- **Framework: Fastify.** Not Express, not Nest, not Hono. Reason: mature, fast, structured logging built-in (Pino), first-class Zod schema validation, OpenAPI plugin available.
- **API style: REST.** **Not tRPC, not GraphQL.** Reasons:
  - Webapp + desktop + future third-party clients all consume the same surface.
  - Cacheable at the proxy layer.
  - Self-documenting via OpenAPI.
  - Boring and well-understood — junior devs can navigate it on day one.
- **DB: Supabase Postgres.** Use the Supabase JS client server-side. For complex queries, raw SQL is fine.
- **Cache + queues: Redis** via `ioredis` (cache, rate limits) and **BullMQ** (jobs, scheduled publish, payouts).
- **Logging: Pino** (built into Fastify). Structured JSON only — never `console.log` in committed code.
- **Validation: Zod**, with schemas shared via `@auror/shared` so the webapp and desktop see the same types.

## Workspace

- pnpm monorepo. Add deps with `pnpm add <pkg> --filter @auror/backend`.
- Shared types/DTOs live in `@auror/shared` (`workspace:*`). Never duplicate a type that crosses the wire.
- Run with `pnpm --filter @auror/backend dev`.

## Project structure

```
packages/backend/
├── src/
│   ├── server.ts              # Entry point — boots Fastify
│   ├── app.ts                 # Fastify instance + plugin registration
│   ├── config/
│   │   └── env.ts             # Zod-validated process.env
│   ├── plugins/               # Fastify plugins (cross-cutting)
│   │   ├── auth.ts            # Supabase JWT verification
│   │   ├── supabase.ts        # Supabase client decorator
│   │   ├── redis.ts           # ioredis client decorator
│   │   ├── error-handler.ts   # Global error formatter
│   │   └── rate-limit.ts
│   ├── modules/               # ← business logic lives here, organized by feature
│   │   ├── stories/
│   │   │   ├── routes.ts      # Fastify route definitions
│   │   │   ├── service.ts     # Business logic — no Fastify imports
│   │   │   ├── repository.ts  # DB access (optional split)
│   │   │   └── schema.ts      # Zod request/response schemas
│   │   ├── chapters/
│   │   ├── wallet/
│   │   ├── payments/
│   │   ├── admin/
│   │   └── ...
│   ├── jobs/                  # BullMQ workers + queues
│   │   ├── payouts.ts
│   │   ├── notifications.ts
│   │   └── scheduled-publish.ts
│   └── lib/                   # Cross-cutting utilities (small, justified)
└── test/
```

**Rule:** business logic in `service.ts` knows nothing about Fastify. Routes are thin: parse → call service → return. Makes services testable without HTTP.

## REST API conventions

- **Versioned prefix:** every route under `/v1/...`. Bumping to `/v2` is the only blessed way to break clients.
- **Resource URLs, HTTP verbs:**
  - `GET /v1/stories` (list), `GET /v1/stories/:id` (read)
  - `POST /v1/stories` (create)
  - `PATCH /v1/stories/:id` (partial update), `PUT` only for full replace
  - `DELETE /v1/stories/:id`
  - Sub-resources: `GET /v1/stories/:id/chapters`
- **Actions that aren't CRUD:** use a verb sub-path, not a query flag.
  - `POST /v1/chapters/:id/publish`
  - `POST /v1/payouts/:id/approve`
- **Status codes:** 200 / 201 / 204, 400 / 401 / 403 / 404 / 409 / 422, 429, 500. Don't return 200 with `{ error: ... }`.
- **Pagination:** cursor-based (`?cursor=...&limit=...`). Offset only for admin tables where stable scrolling matters.
- **Error shape:** consistent JSON.
  ```json
  { "error": { "code": "story_not_found", "message": "…", "details": {} } }
  ```
- **OpenAPI:** every route registered with a Zod schema; `@fastify/swagger` generates `/v1/docs`. If a route has no schema, it doesn't merge.

## TypeScript

- **Never use `as any`.** Same rule as `[[webapp]]` and `[[desktop]]`. Includes:
  - No `as any` to shut up Supabase client types — write a typed wrapper or augment the module.
  - No `as any` on `req.body` — declare the route's Zod schema and let Fastify infer.
  - No `as unknown as T` to launder casts.
- `// @ts-ignore` / `// @ts-expect-error` banned unless paired with a comment explaining the upstream issue and a link.
- Prefer `unknown` + Zod parse over `any` for incoming external data.

## Routes pattern (the canonical shape)

```ts
// modules/stories/schema.ts
import { z } from 'zod'

export const createStoryBody = z.object({
  title: z.string().min(1).max(200),
  blurb: z.string().max(2000).optional(),
  language: z.enum(['ms', 'en']),
})

export const storyResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  authorId: z.string().uuid(),
  // ...
})
```

```ts
// modules/stories/routes.ts
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { createStoryBody, storyResponse } from './schema'
import * as service from './service'

export const storyRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post('/v1/stories', {
    schema: {
      body: createStoryBody,
      response: { 201: storyResponse },
    },
    handler: async (req, reply) => {
      const story = await service.createStory(req.user.id, req.body)
      return reply.code(201).send(story)
    },
  })
}
```

```ts
// modules/stories/service.ts
import type { CreateStoryInput, Story } from '@auror/shared'

export const createStory = async (
  authorId: string,
  input: CreateStoryInput,
): Promise<Story> => {
  // pure business logic; no Fastify, no req/reply
}
```

**Rule:** route handlers are 5–15 lines. If a handler grows, the logic belongs in the service.

## Auth

- Supabase issues JWTs. The `auth` plugin verifies the token on each request and attaches `req.user`.
- **RLS first:** read queries that should respect a user's identity go through the Supabase client with the user's JWT — Postgres RLS does the filtering.
- **Service role second:** privileged operations (admin actions, cross-user queries, financial writes) use the service-role client. Every service-role call should be obvious in the code (named `adminSupabase` or similar).
- Never trust `req.body` for `userId` — always read from `req.user.id`.

## Database access

- Default: Supabase JS client with user JWT (RLS-respecting).
- Complex queries: raw SQL via the Supabase client's `.rpc()` or a direct Postgres connection (`postgres.js`) when needed.
- Type-safe query building: if it grows painful, adopt **Kysely** — *don't* introduce a full ORM (Prisma/Drizzle) without a written reason.
- Migrations: Supabase CLI migrations only. No ad-hoc schema changes in code.

## Redis

- One `ioredis` client decorated onto Fastify via the `redis` plugin.
- **Caching:** key prefix per feature (e.g. `story:${id}`). TTLs explicit, never infinite. Bust on write.
- **Rate limiting:** `@fastify/rate-limit` backed by Redis. Per-route limits for write endpoints; global for reads.
- **Queues (BullMQ):** queue + worker per feature. Workers live in `src/jobs/`. Jobs are idempotent — they may run twice.

## Error handling

- Throw typed errors in services; the global error handler maps them to HTTP responses.
- Define a small `AppError` class with `code`, `status`, `message`. Everything else is a 500.
- Don't leak stack traces in production responses (Pino logs them server-side).

```ts
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}
```

## Logging

- Pino, structured JSON. Every log line has a `req_id` (Fastify adds this automatically).
- `app.log.info({ userId, storyId }, 'story.created')` — event-style messages, fields as context.
- **Never log secrets, tokens, full request bodies, or PII.** Pino redact paths configured in `app.ts`.

## Security

- Validate **every** request body, query, and params with Zod. No exceptions.
- Helmet (`@fastify/helmet`) registered globally.
- CORS allowlist driven by env (`CORS_ORIGINS`).
- Secrets only via env — `config/env.ts` parses `process.env` through Zod and exports a typed `env`. Code reads `env.X`, never `process.env.X` directly.
- Webhook endpoints: verify signatures (e.g. payment processor HMAC) before doing anything. Idempotency keys on every write.
- SQL injection: only via parameterized queries. No template-string SQL with user input. Ever.

## Testing

- **Vitest** for unit + integration.
- Unit tests on services (pure functions).
- **Integration tests hit a real Postgres** (a disposable test DB via Docker) and a real Redis — no mocking the data layer. Reason: mocked DB tests passed but prod migrations failed elsewhere; we don't trust them.
- HTTP tests via `fastify.inject()` — no real network.

## Background jobs (BullMQ)

- One queue per concern (`payouts`, `notifications`, `scheduled-publish`).
- Workers are **idempotent**: receiving the same job twice produces the same result.
- Failed jobs go to a dead-letter queue; ops alerts on DLQ depth.
- Cron-like jobs use BullMQ's `repeat` option — don't run a separate cron container.

## Solution shape

- **Simplest solution that meets industry standards.** Same rule as the other skills.
- No new abstraction without ≥3 concrete callers.
- No "framework on top of the framework" — Fastify is enough.
- Don't add error handling, fallbacks, or validation for scenarios that can't happen. Validate only at the request boundary and at external integrations (DB, payment APIs, webhooks).
- Don't introduce dependency injection containers, event buses, or CQRS patterns. Services + plain function calls scale far further than people think.

## Quick checklist before opening a PR

- [ ] No `as any`, no `@ts-ignore`, no `as unknown as T`.
- [ ] Every route has a Zod schema for body / query / params / response.
- [ ] Route handler is thin; business logic in `service.ts`.
- [ ] No `console.log` — use `app.log` / Pino.
- [ ] Cross-wire types live in `@auror/shared`, not duplicated.
- [ ] DB writes are transactional where they need to be (coin spends, payouts).
- [ ] BullMQ jobs are idempotent.
- [ ] OpenAPI doc renders cleanly at `/v1/docs`.
- [ ] `pnpm --filter @auror/backend typecheck` and `test` pass.

## Related

- `[[webapp]]` — frontend consumer of this API. Shared DTOs live in `@auror/shared`.
- `[[desktop]]` — also consumes this API (and a few desktop-only Tauri commands).
