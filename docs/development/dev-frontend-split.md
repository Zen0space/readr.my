# Frontend Split — `webapp` → `reader` / `author` / `admin`

> **Codename:** Cabang ("branch")
> **Scope:** Split the current `packages/webapp` into three independent Next.js 14 App Router packages — `packages/reader` (apex `auror.my`), `packages/author` (`author.auror.my`), and `packages/admin` (`admin.auror.my`). Auth routes live in every package; data routes consolidate into `packages/backend`. Shared design system, API client, and domain types stay in `@auror/shared`.
> **Predecessor:** `dev-frontend-migration.md` (Phases A–F complete — Stitch → App Router). This doc assumes the migration is done and starts from the post-migration state of `packages/webapp`.
> **Rule:** *nothing* in the old `packages/webapp` is removed until the replacement package is live on its target domain, typechecked, and verified end-to-end.

## Why this doc exists

The Stitch migration collapsed everything into one app behind a path-based RBAC middleware (`middleware.ts:47-82`). That works for a single deploy, but three production reasons push us to a real split:

1. **Domain isolation.** A reader's session cookie is not the same trust level as an admin's. Hosting on a separate subdomain lets us give `admin.auror.my` stricter CSP, separate cookies, and independent deploys.
2. **Independent deploys.** Reader is high-traffic; admin is internal. Shipping admin changes today should not require a reader rebuild.
3. **Tighter bundles.** The Stitch migration shipped one ~200 KB first-load bundle that carried every surface. Reader doesn't need Recharts; admin doesn't need the editor; each package should ship only what it renders.

## Target topology

```
                           ┌─────────────────────────┐
       auror.my            │   packages/reader       │   ─┐
       (apex, public)      │   - 5 reader surfaces   │    │
                           │   - auth routes         │    │
                           └────────────┬────────────┘    │
                                        │                 │ all three share
                                        ▼                 │  NEXT_PUBLIC_API_BASE_URL
                           ┌─────────────────────────┐    │
       author.auror.my     │   packages/author       │    │  → packages/backend
       (subdomain)         │   - 4 author surfaces   │    │     (Express on :4000)
                           │   - auth routes         │    │
                           └────────────┬────────────┘    │
                                        │                 │
                                        ▼                 │
                           ┌─────────────────────────┐    │
       admin.auror.my      │   packages/admin        │   ─┘
       (subdomain)         │   - 3 admin surfaces    │
                           │   - auth routes         │
                           └─────────────────────────┘

  Session cookie domain: .auror.my (apex)  ←  set by every package's /api/auth/login
```

The apex-cookie trick means **one Supabase login authenticates the user across all three domains** without PKCE, magic-link, or token relay. Each package still re-verifies the session on every request via its own server client — the cookie is just the carrier.

## Package inventory (post-split)

| New package | Old home in `packages/webapp` | New role |
|---|---|---|
| `packages/reader` | `app/(reader)/*`, `components/reader/*`, `app/api/auth/*`, `app/api/chapters/*`, `app/api/library/*`, `app/api/subscription/*`, `app/api/wallet/*` | Browse, Library, Read, Wallet, Subscription |
| `packages/author` | `app/(author)/*`, `components/author/*`, `app/api/auth/*`, `app/api/writings/*`, `app/api/analytics/*`, `app/api/wallet/payout`, `app/api/upload` | Studio, Analytics, Earnings, Settings |
| `packages/admin` | `app/(admin)/*`, `components/admin/*`, `app/api/auth/*`, `app/api/admin/*`, `app/api/analytics/dashboard`, `app/api/social/comment` (moderation) | Command Center, Moderation, Users |
| `packages/backend` (existing) | + `app/api/wallet/*`, `app/api/writings/*`, `app/api/library/*`, `app/api/subscription/*`, `app/api/chapters/*`, `app/api/social/*`, `app/api/upload`, `app/api/analytics/*`, `app/api/admin/*` | Single Express API for all three frontends |

`packages/webapp` is **deleted** by Phase E.

## `@auror/shared` refactor

`@auror/shared` grows two new sub-paths and shrinks one. Everything is source-only (`"main": "src/index.ts"`) so consumers compile through their own `tsconfig`.

### Add
- **`@auror/shared/api-client`** — extracted from `packages/webapp/lib/api/{client,types,errors}.ts`. Exports the typed `ApiClient`, `ApiClientError`, `SessionExpiredError`, `ValidationError`, all zod schemas (`RoleSchema`, `UserSchema`, `WritingSchema`, `WalletSchema`, `SubscriptionSchema`, `LibraryItemSchema`, `ApiErrorBodySchema`, …), and a base helper `createApiClient(baseUrl)` that wraps the constructor with the package's `NEXT_PUBLIC_API_BASE_URL`.
- **`@auror/shared/api`** — the per-resource wrappers. Re-export `authApi` (used by every package), plus one wrapper per backend module (`writingsApi`, `walletApi`, `libraryApi`, `subscriptionApi`, `chaptersApi`, `socialApi`, `uploadApi`, `analyticsApi`, `adminApi`). Each package then has a tiny `lib/api/index.ts` that re-exports only what it consumes.

### Keep (unchanged)
- `@auror/shared` root — domain types, error classes, design tokens (CSS vars consumed by each package's `globals.css`).
- `@auror/shared/errors` — the `Toaster` and error helpers.
- `@auror/shared/domain` — `User`, `Role`, `Writing`, etc. (move the zod schemas currently in `lib/api/types.ts` here so `lib/api/*` only consumes them).

### Slim down
- `lib/cn.ts` (3 lines) — keep duplicated per-package; not worth a shared import.
- `lib/session/atoms.ts`, `lib/session/SessionProvider.tsx` — duplicated per-package with one tweak (the `navigateToLogin` helper now points at the **package's own** `/login` route, which on a subdomain means a same-host redirect, not a cross-origin jump).

## Auth model per package

The Stitch migration settled on one `middleware.ts` doing path-based RBAC. That is the wrong shape for a multi-domain deploy — we replace it with **per-package middleware + per-package `/api/auth/*` route handlers** that all share the same Supabase project and write the session cookie with `Domain=.auror.my`.

### Per-package responsibilities
Every one of `reader`, `author`, `admin` ships:

1. **`/login` + `/register` pages** — server-rendered, identical UI as the Stitch migration. Form posts to the package's own `/api/auth/login` and `/api/auth/register` (no cross-origin hop).
2. **`/api/auth/login` + `/api/auth/register` + `/api/auth/logout` + `/api/auth/session` + `/api/auth/callback`** — Next.js route handlers that mirror the current `packages/webapp/app/api/auth/*/route.ts` files verbatim, **with one diff**: the Supabase server client must be constructed with `cookieOptions: { domain: '.auror.my', secure: true }` so the cookie is visible to the other two subdomains.
3. **`middleware.ts`** — short. Only matches the package's own protected paths (e.g., reader matches `/library`, `/read/:path*`, `/wallet`, `/subscription`; author matches `/author/:path*`; admin matches `/admin/:path*`). On unauth, redirect to `/login?redirect=<current>`. **No cross-package redirects** — admin cannot redirect a reader to `author.auror.my/login` from `auror.my`'s middleware.

### What stays in `middleware.ts` (the only thing it does)
- Verify the session cookie → user via `supabase.auth.getUser()`.
- If no user on a protected path, redirect to the package's own `/login`.
- If the user lacks the required role (e.g., a `reader` hits `author.auror.my/studio`), redirect to the package's own `/login?error=Author+privileges+required` (do not bounce to a different subdomain; the user may legitimately have a reader account on apex and want to register as an author on the author subdomain).

### Supabase project layout
- One Supabase project. One `profiles` table with the `role` enum (`reader` / `author` / `admin`).
- The `role` is set at registration time on whichever subdomain the user registered on.
- A user with `role=author` can use `author.auror.my`; a user with `role=reader` is bounced from `author.auror.my` but can browse on `auror.my`. The role lives in the database, not the subdomain.
- **Cross-package promotion flow:** if a reader wants to become an author, they hit `author.auror.my/register` (which is allowed — registration is public), supply a fresh email OR log in, and the registration handler updates their `role` to `author`. The existing `lib/api/auth.ts register()` flow already supports this if we relax the unique-email check to upsert.

## Backend expansion

Today, `packages/webapp/app/api/*` is a BFF layer — Next.js route handlers that call Supabase or proxy to the backend. Post-split, the **data** routes move to Express so each frontend has exactly one API to call. The **auth** routes stay in each frontend because they must run on the same domain that sets the session cookie.

### Routes moving to `packages/backend`
- `writings/*`, `chapters/[chapterId]/*`, `library/*`, `wallet/*` (all four), `subscription/*`, `social/*` (comment, like), `upload`, `analytics/*` (dashboard, track), `admin/*` (reports, users).

### Auth routes staying in each frontend
- `auth/login`, `auth/register`, `auth/logout`, `auth/session`, `auth/callback`. Each is ~60 LoC and a Supabase SSR boilerplate; triplicating them is cheaper than routing them through Express.

### Backend conventions
- All routes become `POST/GET/PATCH/DELETE /v1/<resource>` (no more `/api` prefix on the backend — the frontend's `baseUrl` already includes `/api`).
- Auth on the backend uses the **service-role** Supabase client keyed off the incoming access token (validate via `supabase.auth.getUser(jwt)`). The current `middleware.ts` pattern (Supabase SSR cookie session) only works in Next.js because the cookie is accessible — the backend gets only the bearer.
- The `RoleSchema` and friends come from `@auror/shared/domain` — same zod schemas the frontend uses, single source of truth.

## Team

| Track | PIC | Notes |
|---|---|---|
| Shared-layer extraction (`@auror/shared` refactor, API client, auth helper) | **Khairul** | Unblocks every other track |
| Backend expansion (move 19 BFF routes into Express) | **Khairul** | Has to land before any frontend can drop its `app/api/<data>/*` routes |
| Reader cutover (`webapp` → `reader`, deploy to `auror.my`) | **Khairul** | The reference pattern for the other two |
| Author cutover (clone + strip + deploy to `author.auror.my`) | **Khairul** | Reuses reader's auth/middleware patterns |
| Admin cutover (clone + strip + deploy to `admin.auror.my`) | **Khairul** | Smallest surface, easiest to ship last |
| CI/CD matrix (per-package workflows + image fan-out) | **Khairul** | Touches release-webapp.yml + adds 2 more |

## Working model

1. **One package at a time.** Reader first (it's the one with apex traffic). Author second. Admin last.
2. **`packages/webapp` is read-only from Phase B onward.** Every change goes into the new package or `@auror/shared`. The old folder is deleted in Phase E.
3. **No feature work during the cutover.** Phases A–E are pure restructuring. New features resume only after E.4 passes.
4. **Each phase ends with a green Playwright run on the target domain** (e.g., author cutover verifies `https://author.auror.my/studio` end-to-end via the live tunnel, not localhost).

---

## Phase A — *Asas* ("foundation"): shared layer + backend expansion

> **Goal:** all three packages can be scaffolded against the new shared API; backend has every data route. No frontend package is renamed yet.

### A.1 — `@auror/shared` refactor
- [ ] Create `packages/shared/src/api-client/` — move `client.ts`, `errors.ts`, `types.ts` from `packages/webapp/lib/api/` verbatim.
- [ ] Split types into `packages/shared/src/domain/` (User, Role, Writing, Chapter, Wallet, Subscription, LibraryItem) and `packages/shared/src/api-client/types.ts` (the API response envelopes only).
- [ ] Create `packages/shared/src/api/` — move `auth.ts`, `writings.ts`, `wallet.ts`, `library.ts`, `subscription.ts`, `chapters.ts`, `social.ts`, `upload.ts`, `analytics.ts`, `admin.ts` from `packages/webapp/lib/api/`. Each imports `apiClient` from `api-client` and is base-URL-agnostic.
- [ ] Update `packages/shared/package.json` `exports` map to add `./api-client` and `./api`.
- [ ] Update `packages/webapp` `tsconfig.json` paths so existing imports keep resolving during the transition (`@/lib/api/client` → `@auror/shared/api-client`).

### A.2 — Backend expansion (BFF → Express)
- [ ] Port every route in `packages/webapp/app/api/<data>/*` into `packages/backend/src/modules/<name>/<verb>.ts`. Reuse the existing module layout under `packages/backend/src/modules/`.
- [ ] Backend gains a `requireUser` middleware that validates the bearer token against Supabase (`supabase.auth.getUser(jwt)`) and attaches `req.user`. Replace the Next.js `middleware.ts` role check with this.
- [ ] Add `packages/backend/test/e2e/<name>.spec.ts` per ported route (we have Postman-style coverage today in the Next.js handlers; convert one happy-path + one error per route).
- [ ] Move `packages/webapp/lib/schemas.ts` content into `packages/shared/src/domain/schemas.ts` so backend zod-parses the same shapes the frontend ships.
- [ ] Deploy backend to staging behind the same `/api/*` path the frontends use. Existing Caddy config already proxies `/api/*` to `:4000` — no infra change.

### A.3 — CI/CD matrix scaffolding
- [ ] Rename `.github/workflows/release-webapp.yml` → `release-reader.yml`. Adjust `IMAGE_NAME` → `auror-reader`. Adjust `paths` filter to `packages/reader/**` + `packages/shared/**`.
- [ ] Add `.github/workflows/release-author.yml` and `release-admin.yml` — clones of release-reader with the package name + image name swapped.
- [ ] Add `Dockerfile` templates to each future package directory (or one shared `Dockerfile.template` symlinked in CI). Use the existing `packages/webapp/Dockerfile` as the base.
- [ ] Update `.github/workflows/ci-webapp.yml` → `ci-frontend.yml` with a matrix over `reader`/`author`/`admin`. Each matrix leg runs `pnpm --filter @auror/<pkg> test:e2e`.

### A.4 — Definition of done (Phase A)
1. `pnpm --filter @auror/backend test` covers every ported route with at least one passing spec.
2. `pnpm --filter @auror/webapp build` still passes — `webapp` is unchanged.
3. Three release workflows exist in `.github/workflows/`, all in `workflow_dispatch`-only mode (no `push` trigger yet — that's wired in Phase B).
4. `pnpm --filter @auror/shared typecheck` passes.

---

## Phase B — *Akar* ("root"): reader goes live on `auror.my`

> **Goal:** `packages/reader` is a real, deployable Next.js app on the apex domain. `packages/webapp` is read-only and points readers to the new URL via DNS once the cutover lands.

### B.1 — Scaffold `packages/reader`
- [ ] `mkdir packages/reader`; copy from `packages/webapp` minus:
  - `app/(author)/*`, `app/(admin)/*`, `components/author/*`, `components/admin/*`.
  - `app/api/{analytics,chapters,library,social,subscription,upload,wallet,writings,admin}/*` (all data routes — they live in the backend now).
- [ ] Rename `package.json` `name` to `@auror/reader`. Keep `@auror/shared` dep.
- [ ] Replace local `lib/api/*` imports with `@auror/shared/api` and `@auror/shared/api-client`.
- [ ] Replace local `lib/supabase.ts` with a thin wrapper that adds the apex `domain` cookie option:
  ```ts
  cookieOptions: { domain: '.auror.my', secure: true, sameSite: 'lax' }
  ```
- [ ] Slim `middleware.ts` to only the reader paths (`/library`, `/read/:path*`, `/wallet`, `/subscription`). Drop the cross-role admin/author checks — they don't apply on this package.

### B.2 — Wire the apex cookie
- [ ] Add a Caddy entry that proxies `auror.my` → reader container. Existing `infra/caddy/Caddyfile` handles `/api/*` already; add a second `handle` block for the apex host.
- [ ] In `.env.production` for the reader app, set `NEXT_PUBLIC_API_BASE_URL=https://auror.my/api`. The backend is reached through the same Caddy entry.

### B.3 — Cutover
- [ ] DNS: point `auror.my` A record at the reader container. Keep `www.auror.my` redirecting to apex (301).
- [ ] Playwright `tests/e2e/reader.spec.ts` runs against `https://auror.my` end-to-end: browse → login → read a chapter → top up wallet → confirm balance reflects in UI.
- [ ] Verify a session cookie set by reader's `/api/auth/login` is sent on subsequent requests to `author.auror.my` (manual: log in, open devtools, hit `/api/auth/session` on the author subdomain — should return 200 with the same user).
- [ ] Add `push` trigger to `release-reader.yml` (still gated on `packages/reader/**` and `packages/shared/**`).

### B.4 — Definition of done (Phase B)
1. `pnpm --filter @auror/reader dev` boots; `/` is visually identical to the current webapp's browse dashboard.
2. Login on `auror.my` issues a cookie scoped to `.auror.my`; the cookie is visible to `author.auror.my` and `admin.auror.my`.
3. `packages/webapp/package.json` and `packages/webapp/Dockerfile` are unchanged — the old package is still buildable but no longer deployed.
4. `release-reader.yml` is the only release workflow with a `push` trigger.

---

## Phase C — *Dahan Penulis* ("author branch"): author goes live

> **Goal:** `packages/author` is live on `author.auror.my`. The reader package is unaffected.

### C.1 — Scaffold `packages/author`
- [ ] `mkdir packages/author`; copy from `packages/webapp` minus:
  - `app/(reader)/*`, `app/(admin)/*`, `components/reader/*`, `components/admin/*`.
  - All `app/api/*` routes **except** `app/api/auth/*`.
- [ ] Rename `package.json` `name` to `@auror/author`.
- [ ] Swap imports to `@auror/shared/api` + `@auror/shared/api-client`. The author package uses: `authApi`, `writingsApi`, `walletApi.requestPayout`, `analyticsApi`, `uploadApi`.
- [ ] Slim `middleware.ts` to `/author/:path*` and `/api/writings/*`, `/api/wallet/payout`, `/api/upload`, `/api/analytics/*`.
- [ ] Set `NEXT_PUBLIC_API_BASE_URL=https://author.auror.my/api` in production. Caddy on this subdomain forwards `/api/*` to the backend.

### C.2 — Auth route placement
- [ ] Keep `app/(auth)/login`, `app/(auth)/register`, `app/api/auth/*` in author (with the apex cookie config from B.1).
- [ ] The login page is a duplicate of reader's — that's intentional. Each package owns its own copy. A shared `AuthCard` component lives in `@auror/shared` so the visuals stay identical.

### C.3 — Cutover
- [ ] DNS: `author.auror.my` → author container.
- [ ] Playwright `tests/e2e/author.spec.ts` against `https://author.auror.my`: log in → write a chapter → autosave → reload → content persists.
- [ ] Enable `push` trigger on `release-author.yml`.

### C.4 — Definition of done (Phase C)
1. Author pages render on `author.auror.my`; backend proxy works for `/api/writings/*`, `/api/wallet/payout`, `/api/upload`, `/api/analytics/*`.
2. A reader-account user hitting `https://author.auror.my/studio` is bounced to `https://author.auror.my/login?error=Author+privileges+required`. After re-registering with a fresh email, the `role` flips to `author` and the redirect lands them in the studio.
3. The reader package on `auror.my` is unaffected.

---

## Phase D — *Dahan Pentadbir* ("admin branch"): admin goes live

> **Goal:** `packages/admin` is live on `admin.auror.my`. Strictest security boundary of the three.

### D.1 — Scaffold `packages/admin`
- [ ] `mkdir packages/admin`; copy from `packages/webapp` minus:
  - `app/(reader)/*`, `app/(author)/*`, `components/reader/*`, `components/author/*`.
  - All `app/api/*` routes **except** `app/api/auth/*` and `app/api/admin/*`.
- [ ] Rename `package.json` `name` to `@auror/admin`.
- [ ] Swap imports to `@auror/shared/api` + `@auror/shared/api-client`. Admin uses: `authApi`, `adminApi`, `analyticsApi.dashboard`, `socialApi` (for moderation actions).
- [ ] Slim `middleware.ts` to `/admin/:path*` only. Reject any user without `role === 'admin'`.

### D.2 — Hardening (admin-specific)
- [ ] Add a strict CSP header in `next.config.mjs`: `default-src 'self'; connect-src 'self' https://*.supabase.co`. Reader and author can loosen this later; admin stays strict.
- [ ] Disable the `next/image` optimizer for admin — every image comes from Supabase storage with its own URL.
- [ ] No `@auror/shared` re-export of `authApi.login` — admin's login page is the same shape but the route handler short-circuits if the user isn't admin (return 403 instead of redirecting to `/admin` and letting middleware bounce). This is the only place the cookie path is intentionally narrower.

### D.3 — Cutover
- [ ] DNS: `admin.auror.my` → admin container.
- [ ] Playwright `tests/e2e/admin.spec.ts` against `https://admin.auror.my`: log in as admin → suspend a reader → log in as that reader on `auror.my` → access still works on apex, but admin subdomain now refuses.
- [ ] Enable `push` trigger on `release-admin.yml`.

### D.4 — Definition of done (Phase D)
1. All three packages are independently deployable. Each has its own `Dockerfile`, `next.config.mjs`, `.env.example`, and `playwright.config.ts`.
2. No code in `packages/admin` imports from `packages/reader` or `packages/author` — `rg "from '@auror/(reader|author)" packages/admin` returns zero matches.
3. CI matrix in `ci-frontend.yml` runs all three packages in parallel; total wall time ≤ the slowest single package run.

---

## Phase E — *Pangkas* ("prune"): delete `packages/webapp`

> **Goal:** `packages/webapp` is gone. The three new packages are the only frontends.

### E.1 — Delete the old package
- [ ] `git rm -r packages/webapp/`. Verify no workflow, doc, or script still references `@auror/webapp`:
  - `rg "@auror/webapp" .` should return zero matches outside `pnpm-lock.yaml` (lockfile updates on next install).
- [ ] Remove `packages/webapp` from `pnpm-workspace.yaml` (already implicit, but the file is unchanged — no edit needed).
- [ ] Update root `package.json` if it has hardcoded references (it doesn't today — it uses `pnpm -r`).

### E.2 — Update CI / docs
- [ ] Delete `.github/workflows/ci-webapp.yml` and `release-webapp.yml`. Replaced by `ci-frontend.yml` + the three release workflows.
- [ ] Update `README.md`, `MEMORY.md`, `.claude/skills/webapp/SKILLS.md` (rename to `frontend/SKILLS.md` or three skill files — pick one).
- [ ] Update `docs/development/dev-frontend-migration.md` to add a "Superseded by dev-frontend-split.md" header.
- [ ] Update `docs/contributing/contributing.md` install/run commands.

### E.3 — Performance check
- [ ] Run Lighthouse against each subdomain on the desktop preset. Target ≥ 90 performance + ≥ 95 a11y (same bar as the migration's F.4).
- [ ] Compare first-load JS bundle sizes vs the pre-split webapp. Each package should be < 60 % of the old bundle (the goal was cutting Recharts from reader and the editor from admin).

### E.4 — Definition of done (Phase E)
1. `pnpm install --frozen-lockfile` succeeds. `pnpm -r build` succeeds for all 5 packages (`backend`, `desktop`, `shared`, `reader`, `author`, `admin`).
2. `rg "@auror/webapp|packages/webapp" .` returns zero matches outside `pnpm-lock.yaml`.
3. `git log --stat HEAD~1` shows `packages/webapp` removed in one commit; the three new packages each in their own commit for clean rollback.

---

## Cross-cutting concerns

### Supabase config drift
Each package will set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These must stay byte-identical across the three — pin them in a `.env.shared` at the repo root and `cp` into each package's `.env.local`. Drift here is the most likely cause of "I can log in on auror.my but not on admin.auror.my".

### Cross-package links
Today, `<Link href="/admin/users">` from the admin layout goes to the same origin. Post-split, those links must be absolute: `<Link href="https://admin.auror.my/users">`. Add a tiny `crossLink(kind: 'reader' | 'author' | 'admin', path)` helper in `@auror/shared` that maps `kind` to the package's `NEXT_PUBLIC_PUBLIC_URL` env var. Reader → `https://auror.my`, author → `https://author.auror.my`, admin → `https://admin.auror.my`.

### Service-role exposure
The backend's `requireUser` middleware must use the **anon** Supabase client + `auth.getUser(jwt)` to validate the bearer — never the service-role client on a per-request basis. Service-role is reserved for backend-internal jobs (webhook handlers, scheduled tasks). Today's `lib/supabase.ts` already exposes `createAdminClient()`; that helper stays in `@auror/shared/supabase` for backend use only and must not be imported by any frontend package.

### Tauri desktop sync
`packages/desktop` currently imports nothing from `packages/webapp` (the Stitch migration kept components in the webapp purely presentational, no `next/*` imports — see dev-frontend-migration.md §Component reuse). Post-split, the desktop app imports from `@auror/shared` (UI primitives + api-client + api resource wrappers). Confirm `rg "from '@auror/(reader|author|admin)" packages/desktop` returns zero matches after E.1.

### Bundle budgets
Reader bundle should drop Recharts (moves to author). Author bundle should drop the rich-text editor dependencies that reader doesn't need (Tiptap is the heaviest single dep). Admin should drop the chart library too — KPIs are simple numbers. Verify with `pnpm --filter @auror/<pkg> build && du -sh packages/<pkg>/.next/static`.

## Risks

- **Cookie-domain surprise.** Setting `Domain=.auror.my` on a `localhost` cookie does nothing — the apex only resolves in production. Phase B's DoD must verify on a real staging subdomain, not localhost.
- **Caddy wildcard TLS.** `*.auror.my` needs a wildcard cert. If we use Let's Encrypt via Caddy, the DNS-01 challenge requires the Caddy host to control the apex's DNS — confirm Coolify / hosting provider supports this before Phase B.
- **Backend dependency.** Phases B/C/D all assume the backend has the data routes. If A.2 slips, the frontends can't drop their `app/api/<data>/*` folders and the bundle-savings win evaporates. Mitigation: A.2 has the strictest DoD gate.
- **Role-hijack via author-subdomain registration.** Today a reader can hit `/register` on `author.auror.my` and the handler updates their `role` to `author`. This is intentional but needs an explicit confirmation step ("You're currently a reader on auror.my. Becoming an author is permanent. Continue?") and an audit-log entry. Add to A.2 if not already in the backend's register flow.
- **CI matrix wall time.** Running three parallel Playwright suites could double the CI bill if each leg spins up its own backend. Mitigation: the matrix reuses one backend container started in a setup job (Playwright's `webServer` option already supports this — just point all three legs at the same backend URL).
- **Migration drift.** Devs adding new code to `packages/webapp` instead of the new packages is the silent failure mode. Mitigation: delete `packages/webapp` *before* opening Phase E for review, not after — force the issue.

## Definition of done (whole split)

1. Three Next.js packages (`reader`, `author`, `admin`), one shared library (`@auror/shared`), one backend (`packages/backend`), one desktop (`packages/desktop`).
2. Each package has its own Dockerfile, deploy workflow, Playwright suite, and `.env.example`.
3. A single Supabase login authenticates the user across `auror.my`, `author.auror.my`, `admin.auror.my` via the apex cookie.
4. Bundle sizes: reader < 60 % of pre-split, author < 50 %, admin < 40 %.
5. `pnpm -r build` is green. `pnpm -r typecheck` is green. `pnpm -r test` is green.
6. `git log --oneline` shows a clean cutover: backend-expansion commit → reader-cutover → author-cutover → admin-cutover → webapp-removal.
