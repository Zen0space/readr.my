# Auror

> A self-hosted, Malaysia-first Wattpad alternative for authors and novelists.

**Status:** 🚧 Early development (Phase 0 — *Mula*). Not yet usable.

Auror pairs a markdown-native, chapter-by-chapter writing experience with a transparent monetization stack (coins, subscriptions, tips) and gives operators full visibility into platform health and payouts. Everything self-hosts via Docker — no required SaaS.

---

## What's inside

This is a **pnpm monorepo** with six packages:

| Package | Purpose | Hostname |
|---|---|---|
| [`packages/backend`](packages/backend) | Node.js + Fastify REST API. Talks to Supabase + Redis. | — |
| [`packages/reader`](packages/reader) | Next.js (App Router). Reader-facing browse/library/read/wallet/subscription UI. | `auror.my` (apex) |
| [`packages/author`](packages/author) | Next.js (App Router). Author-facing studio/analytics/earnings/settings UI. | `author.auror.my` |
| [`packages/admin`](packages/admin) | Next.js (App Router). Admin command-center + moderation + user management. Strict CSP + locked-down `next/image`. | `admin.auror.my` |
| [`packages/desktop`](packages/desktop) | Tauri v2 desktop wrapper. Offline-first authoring. | — |
| [`packages/shared`](packages/shared) | Shared types, DTOs, Zod schemas, error contract, API client. | — |

Each frontend package owns the same auth BFF (`/api/auth/*`) and the
same apex-cookie config (`Domain=.auror.my`); one Supabase login
authenticates the user across all three subdomains. See
[`docs/development/dev-frontend-split.md`](docs/development/dev-frontend-split.md)
for the full split plan.

## Tech stack at a glance

- **Backend:** Node.js (LTS), Fastify, Pino, BullMQ, ioredis.
- **DB + Auth:** Supabase (self-hosted Postgres + Auth + Storage).
- **Cache + queues:** Redis.
- **Frontends:** Next.js App Router, Supabase Auth, Jotai state, Zod validation.
- **Desktop:** Tauri v2 (Rust + webview). No Electron.
- **API style:** REST under `/v1/...` with OpenAPI docs. **Not tRPC, not GraphQL.**
- **Deploy:** `docker compose up` — backend, reader, author, admin, Redis, Caddy reverse proxy.

## Repo layout

```
.
├── packages/
│   ├── backend/         # Fastify REST API
│   ├── reader/          # Next.js — auror.my
│   ├── author/          # Next.js — author.auror.my
│   ├── admin/           # Next.js — admin.auror.my (strict CSP)
│   ├── desktop/         # Tauri desktop app
│   └── shared/          # Cross-package types, error contract, API client
├── docs/
│   ├── prd/             # Product Requirements Document (phased, 0–1 scored)
│   └── development/     # Per-phase dev plans (Mula → Warisan)
├── .claude/
│   └── skills/          # Per-package engineering conventions
├── pnpm-workspace.yaml
└── package.json
```

## Quick start

**Prerequisites:** Node ≥ 20, pnpm ≥ 9, Docker + Docker Compose, Rust toolchain (only if working on desktop).

```bash
# Clone
git clone git@github.com:rekabytes/auror.my.git
cd auror.my

# Install all workspace deps
pnpm install

# Bring up infra (Supabase + Redis)
# — these are two separate stacks managed by different tools
#   (`supabase` CLI for Supabase, `docker compose` for Redis),
#   so we wrap them in one command:
make up          # or: pnpm infra:up

# Run everything in dev
pnpm dev
```

To tear the infra back down (preserves data volumes):

```bash
make down        # or: pnpm infra:down
make status      # or: pnpm infra:status
```

Per-package scripts:

```bash
pnpm --filter @auror/backend dev
pnpm --filter @auror/reader dev
pnpm --filter @auror/author dev
pnpm --filter @auror/admin dev
pnpm --filter @auror/desktop tauri dev
```

Workspace-wide:

```bash
pnpm -r build
pnpm -r typecheck
pnpm -r test
```

## Documentation

| Doc | What it covers |
|---|---|
| [PRD](docs/prd/prd.md) | Full feature spec, phased, every feature scored 0.0–1.0 |
| [Phase 0 — Mula](docs/development/dev-phase0.md) | MVP foundations (the end-to-end loop) |
| [Phase 1 — Teguh](docs/development/dev-phase1.md) | Production-grade trust & moderation |
| [Phase 2 — Tumbuh](docs/development/dev-phase2.md) | Engagement, personalization, ops leverage |
| [Phase 3 — Bersinar](docs/development/dev-phase3.md) | Malaysian moat + advanced features |
| [Phase 4 — Warisan](docs/development/dev-phase4.md) | Metric-gated backlog (no pre-build) |
| [Frontend split — Cabang](docs/development/dev-frontend-split.md) | Reader/author/admin subdomain split plan + phase ledger |
| [Contributing](docs/contributing/contributing.md) | Setup, branches, conventions, review flow |

## Engineering conventions

Each package has a skill file in `.claude/skills/<pkg>/SKILLS.md` codifying the rules a Claude Code agent (and human contributors) follow:

- [`.claude/skills/webapp/SKILLS.md`](.claude/skills/webapp/SKILLS.md) — Generic Next.js + Jotai rules (shared by reader/author/admin).
- [`.claude/skills/desktop/SKILLS.md`](.claude/skills/desktop/SKILLS.md) — Tauri v2, typed IPC, capability-scoped permissions.
- [`.claude/skills/backend/SKILLS.md`](.claude/skills/backend/SKILLS.md) — Fastify REST, Zod schemas, no tRPC, no premature abstraction.
- [`.claude/skills/error-handling/SKILLS.md`](.claude/skills/error-handling/SKILLS.md) — Unified error + logging contract. Single source in `packages/shared/src/errors/`.

See [the contributing guide](docs/contributing/contributing.md) for the human-readable version.

## Team

| Role | Owner |
|---|---|
| Backend + infra + complex frontend | **Khairul** |
| Standard frontend (CRUD, forms, lists, theming) | **Ajwad** |

If a frontend task involves a stateful editor, payment SDK, charting, service workers, real-time sync, canvas, or text-range anchoring — it goes to Khairul.

## License

TBD.