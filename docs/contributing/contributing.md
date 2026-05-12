# Contributing to readr.my

Welcome. This guide is for anyone — internal team or external contributor — making changes to this repo. It covers setup, branch model, commit + PR conventions, and the engineering rules that aren't negotiable.

If you're an AI agent (Claude Code, etc.), read the skill files in `.claude/skills/` — they're the source of truth for per-package conventions. This document is the human summary.

---

## 1. Prerequisites

- **Node.js** ≥ 20 (LTS)
- **pnpm** ≥ 9 — install via `npm i -g pnpm` or `corepack enable`
- **Docker** + **Docker Compose** for local Supabase + Redis
- **Rust toolchain** — only if you're touching `packages/desktop` (Tauri)
- A POSIX shell. WSL2 is fine on Windows.

## 2. Local setup

```bash
git clone git@github.com:Zen0space/readr.my.git
cd readr.my
pnpm install

# Bring up Supabase + Redis + reverse proxy (config arrives in Phase 0)
docker compose up -d

# Copy env templates
cp packages/backend/.env.example packages/backend/.env
cp packages/webapp/.env.example  packages/webapp/.env

# Run everything in dev mode
pnpm dev
```

Per-package dev:

```bash
pnpm --filter @readr/backend dev
pnpm --filter @readr/webapp  dev
pnpm --filter @readr/desktop tauri dev
```

## 3. Branch model

- **`main`** — protected. Production-shippable code only. No direct pushes; all changes via PR from `dev`.
- **`dev`** — primary integration branch. Feature branches merge here. This is where day-to-day work lands.
- **Feature branches** — branch from `dev`, named:
  - `feat/<short-slug>` — new feature
  - `fix/<short-slug>` — bug fix
  - `chore/<short-slug>` — tooling, infra, docs
  - `refactor/<short-slug>` — non-behavioral change

Example:

```bash
git checkout dev
git pull
git checkout -b feat/coin-topup-flow
# …work…
git push -u origin feat/coin-topup-flow
# Open PR: feat/coin-topup-flow → dev
```

**Never** push directly to `main`. **Never** force-push to `dev` or `main`.

## 4. Commit messages

Loose Conventional Commits. Keep the first line under 72 chars.

```
<type>: <imperative summary>

<optional body — why, not what>
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `style`, `build`, `ci`.

**Good:**
- `feat: add coin top-up payment flow`
- `fix: prevent double-spend on concurrent chapter unlock`
- `docs: clarify Tauri capability scoping in desktop skill`

**Avoid:**
- `update code`
- `WIP`
- `fixed bug`

If a PR contains multiple commits, the **PR title** should follow the same format — that's what lands on `dev` after squash-merge.

## 5. Pull request flow

1. Branch from latest `dev`.
2. Make the change. Keep PRs small — < 400 lines diff if possible.
3. **Run before pushing:**
   ```bash
   pnpm -r typecheck
   pnpm -r lint
   pnpm -r test
   ```
4. Open PR against `dev`. Fill in the template (Summary, Test plan, Screenshots if UI).
5. Request review from the right PIC (see §9).
6. Address feedback with **new commits** — don't force-push during review.
7. Reviewer merges (squash) when approved.

## 6. Engineering rules (non-negotiable)

These apply to every PR. They are enforced in skill files at `.claude/skills/<pkg>/SKILLS.md`.

### Universal

- **No `as any`.** Not in production code, not in tests, not "temporarily." Fix the type at its source. If you genuinely have an unknown shape, use `unknown` + a type guard.
- **No `@ts-ignore` / `@ts-expect-error`** without a comment explaining the upstream bug and a link.
- **No `console.log` / `console.error`** in app code. See the error-handling skill — dev logs pipe to the terminal, not F12.
- **No premature abstraction.** Three similar lines beats a generic helper. Build for ≥3 concrete callers, not hypothetical future ones.
- **No back-compat shims, no feature flags, no fallbacks for cases that can't happen.** Validate only at system boundaries (HTTP, IPC, payment APIs).

### Frontend (webapp + desktop)

- **State: Jotai** for shared state. Atoms colocated with the feature, not in a global dump.
- **`useEffect` is a last resort.** Most of the time it's the wrong tool. Before using it, check: can this be derived during render? Handled in an event? Reset via `key`? Synced with `useSyncExternalStore` or a Jotai atom? Only reach for `useEffect` for true synchronization with non-React systems.
- See `.claude/skills/webapp/SKILLS.md` and `.claude/skills/desktop/SKILLS.md`.

### Desktop (Tauri v2)

- **Tauri v2, not Electron.** Decision is final.
- **Typed IPC.** Every `invoke()` goes through a wrapper in `src/ipc/<feature>.ts` with an explicit `invoke<T>()` generic. Components read Jotai atoms, never call `invoke` directly.
- **Capabilities are default-deny.** No blanket grants, scope FS paths exactly.

### Backend (Fastify)

- **REST under `/v1/...`** with Zod schemas on every route (body, query, params, response). No tRPC. No GraphQL.
- **Routes are thin** (5–15 lines). Business logic lives in `service.ts`, which knows nothing about Fastify.
- **Throw `AppError`** from services for known failure modes. The global error handler does the rest.
- **Integration tests hit a real Postgres** (a disposable Docker DB). Don't mock the data layer.

### Error handling (unified)

- **Single source of truth:** `packages/shared/src/errors/`. No duplicated error classes, message tables, or fetch wrappers.
- **Adding a new error code:** add to `codes.ts`, add `ms` + `en` strings to `messages.ts`, throw `AppError` in the service. TypeScript enforces locale × code coverage.
- **Users see human language.** Toasts and inline errors never expose codes, statuses, or stack traces.
- **Devs read the terminal.** Browser DevTools console stays empty in normal operation.
- See `.claude/skills/error-handling/SKILLS.md` for the full contract.

## 7. Testing

- **Unit tests** on pure functions (services, formatters, helpers). Vitest.
- **Integration tests** on backend hit real Postgres + Redis via Docker. No mocking the data layer.
- **HTTP tests** via `fastify.inject()`.
- **Frontend tests** focus on user-visible behavior. Avoid testing implementation details (atom internals, hook order).
- New features should ship with tests for the happy path + one edge case.

## 8. Code style

- TypeScript everywhere. `strict: true`. No implicit `any`.
- ESLint + Prettier configured per package. Run `pnpm -r lint` before pushing.
- No comments explaining *what* the code does — names should do that. Only comment *why* when the reason isn't obvious from the code.
- Don't reference task numbers, PR numbers, or "added for X" in comments — that belongs in commit messages and PR descriptions.

## 9. Review routing

| Change touches | PIC |
|---|---|
| `packages/backend/**` | **Khairul** |
| `packages/desktop/src-tauri/**` | **Khairul** |
| `packages/shared/**` | **Khairul** (cross-package contract) |
| Complex frontend (editor, payments, charts, service workers, canvas, real-time sync, text-range anchoring, state machines) | **Khairul** |
| Standard frontend (CRUD pages, forms, lists, theming, simple buttons) | **Ajwad** |
| Docs / skills / PRD | Either; ping the relevant owner |

If you're unsure whether a frontend task is "complex" — ask Khairul before starting. Easier to route correctly than rework after review.

## 10. Security & secrets

- **Never commit `.env`, credentials, signing keys, or private files.** `.gitignore` covers the common ones; if you add a new secret-bearing file, add it to `.gitignore` in the same PR.
- Secrets only via env vars, parsed through Zod in `config/env.ts` (backend) or `env.ts` (webapp/desktop).
- If you suspect a secret was committed, **don't just delete and re-commit** — tell the team so we can rotate the key and rewrite history.

## 11. Reporting bugs / proposing features

- **Bug:** open a GitHub issue with reproduction steps, expected vs actual, environment.
- **Feature idea:** check the PRD (`docs/prd/prd.md`) first. If it's already there, reference the score and phase. If not, open an issue describing the user problem (not the solution).
- **Out-of-scope reminder:** features in Phase 4 (`docs/development/dev-phase4.md`) only get built when a specific metric trigger fires. "It would be cool" is not a trigger.

## 12. Questions

- Engineering questions → ping Khairul.
- Frontend ramp-up questions → Ajwad pair-programs with Khairul early in each phase; don't stay stuck > 30 minutes alone.
- Product / scope questions → reference the PRD; escalate to the project owner if still ambiguous.

Thanks for contributing. Keep PRs small, types tight, and toasts kind.
