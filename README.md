# readr.my

> A self-hosted, Malaysia-first Wattpad alternative for authors and novelists.

**Status:** 🚧 Early development (Phase 0 — *Mula*). Not yet usable.

readr.my pairs a markdown-native, chapter-by-chapter writing experience with a transparent monetization stack (coins, subscriptions, tips) and gives operators full visibility into platform health and payouts. Everything self-hosts via Docker — no required SaaS.

---

## What's inside

This is a **pnpm monorepo** with four packages:

| Package | Purpose |
|---|---|
| [`packages/backend`](packages/backend) | Node.js + Fastify REST API. Talks to Supabase + Redis. |
| [`packages/webapp`](packages/webapp) | Next.js (App Router) + Jotai. Reader + author + admin web UI. |
| [`packages/desktop`](packages/desktop) | Tauri v2 desktop wrapper. Offline-first authoring. |
| [`packages/shared`](packages/shared) | Shared types, DTOs, Zod schemas, error contract. |

## Tech stack at a glance

- **Backend:** Node.js (LTS), Fastify, Pino, BullMQ, ioredis.
- **DB + Auth:** Supabase (self-hosted Postgres + Auth + Storage).
- **Cache + queues:** Redis.
- **Webapp:** Next.js App Router, Supabase Auth, Jotai state, Zod validation.
- **Desktop:** Tauri v2 (Rust + webview). No Electron.
- **API style:** REST under `/v1/...` with OpenAPI docs. **Not tRPC, not GraphQL.**
- **Deploy:** `docker compose up` — webapp, backend, Supabase, Redis, reverse proxy.

## Repo layout

```
.
├── packages/
│   ├── backend/         # Fastify REST API
│   ├── webapp/          # Next.js webapp
│   ├── desktop/         # Tauri desktop app
│   └── shared/          # Cross-package types, error contract
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
git clone git@github.com:Zen0space/readr.my.git
cd readr.my

# Install all workspace deps
pnpm install

# Bring up infra (Supabase, Redis, etc.) — coming in Phase 0
docker compose up -d

# Run everything in dev
pnpm dev
```

Per-package scripts:

```bash
pnpm --filter @auror/backend dev
pnpm --filter @auror/webapp dev
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
| [Contributing](docs/contributing/contributing.md) | Setup, branches, conventions, review flow |

## Engineering conventions

Each package has a skill file in `.claude/skills/<pkg>/SKILLS.md` codifying the rules a Claude Code agent (and human contributors) follow:

- [`.claude/skills/webapp/SKILLS.md`](.claude/skills/webapp/SKILLS.md) — Jotai state, no `as any`, `useEffect` last resort.
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
