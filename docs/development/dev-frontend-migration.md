# Frontend Migration — Stitch → Next.js App Router

> **Superseded by [`dev-frontend-split.md`](./dev-frontend-split.md) (Cabang).**
> The Stitch → App Router migration it describes shipped in Phase F (Sapu) of the old dev pipeline. The subsequent Phase G cutover split the unified `packages/webapp` package into three per-role packages (`packages/reader`, `packages/author`, `packages/admin`) plus a Fastify `packages/backend`. That plan lives in the linked doc; this file is kept as a historical reference for the page-by-page DoD ledger.
>
> **Codename:** Alih ("transfer / move")
> **Scope:** Convert the 16 static Stitch designs in `packages/webapp/public/stitch_auror_modern_reading_platform/` into real Next.js App Router pages (TypeScript, no CDN Tailwind, real data via the existing `/api/*` route handlers).
> **Rule:** *nothing* replaces a rewrite in `next.config.mjs` until the real page is live, typechecked, and visually matches the Stitch screen on a 1280×800 desktop and a 390×844 mobile viewport.

## Why this doc exists

The webapp ships today with 24 API routes in `packages/webapp/app/api/*/route.ts` and **zero** `page.tsx` files. Every reader/author/admin surface is bridged to a static HTML file in `public/stitch_auror_modern_reading_platform/` via the 15 rewrite rules in `next.config.mjs:4-62`. The bridge has served us during API development but blocks us from doing SSR, real auth gating, server components, and proper metadata for SEO. This plan is the controlled cutover.

## Inventory

**16 Stitch screens** (14 with `code.html` + `screen.png`, 2 in `auth/`, 1 design-token doc):

| # | Stitch folder | Current rewrite | Approx LoC | Role gate |
|---|---|---|---|---|
| 1 | `auth/login.html` | `/login` | 186 | public |
| 2 | `auth/register.html` | `/register` | 197 | public |
| 3 | `reader_browse_dashboard/code.html` | `/` | 341 | public |
| 4 | `library_history_progress/code.html` | `/library` | 322 | reader |
| 5 | `immersive_reading_experience/code.html` | `/reading` | 551 | reader |
| 6 | `reader_wallet_rewards/code.html` | `/wallet` | 723 | reader |
| 7 | `reader_subscription_dashboard/code.html` | `/subscription` | 432 | reader |
| 8 | `author_analytics_dashboard/code.html` | `/author/analytics` | 486 | author |
| 9 | `author_earnings_wallet/code.html` | `/author/earnings` | 608 | author |
| 10 | `author_profile_settings/code.html` | `/author/settings` | 448 | author |
| 11 | `author_writing_studio/code.html` | `/author/studio` | 807 | author |
| 12 | `admin_command_center/code.html` | `/admin` | 429 | admin |
| 13 | `admin_content_moderation/code.html` | `/admin/moderation` | 626 | admin |
| 14 | `admin_user_management/code.html` | `/admin/users` | 535 | admin |
| 15 | `lumina_reading_system/DESIGN.md` | — (tokens doc) | 179 | n/a |
| 16 | `assets/js/api.js` | — (client bridge) | 370 | n/a |

**Total:** ~6 900 lines of HTML/JS to absorb. The Stitch JS bridge (16) is a complete fetch wrapper that should be ported verbatim, not rewritten.

## Team

| Track | PIC | Notes |
|---|---|---|
| Foundation / design system / shared chrome | **Khairul** | Sets up Tailwind tokens, route groups, layout shell, API client — everything the other tracks depend on |
| Auth + reader surfaces | **Khairul** | Reader flow is the highest-traffic surface; auth gates every other track |
| Author surfaces | **Khairul** | Author studio = the most stateful screen; reuse Tiptap work from F0.K1 |
| Admin surfaces | **Khairul** | Smallest surface area; lowest priority |
| E2E / visual-regression testing | **Khairul** | Playwright snapshots lock the cutover |

> Note: this migration is single-owner for now. Ajwad gets pulled in once Khairul has shipped one full reader+author surface as the reference pattern.

---

## Phase A — *Cahaya* ("light"): Foundations

> **Goal:** the design system is real, the API client is real, the route-group skeleton is in place. No user-facing screen changes yet. The old rewrites still work.

### A.1 — Lumina design tokens → Tailwind + CSS variables
- [ ] Read `lumina_reading_system/DESIGN.md` end-to-end (179 lines: surfaces, primaries, typography, radii).
- [ ] Replace the CDN tailwind include (`<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries">`) with a real build.
  - [ ] `packages/webapp/tailwind.config.ts` (new) — extend theme with the `surface`/`primary`/`secondary`/`on-*` color tokens, custom `borderRadius` map (`DEFAULT`, `lg`, `xl`, `2xl`, `full`), and font families (`Geist` display, `Inter` body).
  - [ ] `packages/webapp/postcss.config.mjs` (new) — `tailwindcss` + `autoprefixer`.
  - [ ] `packages/webapp/app/globals.css` (new) — `@tailwind base/components/utilities`; CSS custom properties for the surface-tint / on-surface-variant ramp so future dark-mode can flip them in one place.
  - [ ] Self-host `Geist` + `Inter` via `next/font/google` (replaces the two Google Fonts `<link>` tags in every HTML file).
- [ ] Verify by loading `/` (still the reader-browse rewrite) and confirming computed colors match the DESIGN.md values (`#fcf8ff` surface, `#4648d4` primary, `#6b38d4` secondary).

### A.2 — Port the Stitch API client (`assets/js/api.js` → `lib/api/`)
- [ ] Convert the 370-line `assets/js/api.js` fetch wrapper to typed modules under `packages/webapp/lib/api/`:
  - [ ] `lib/api/client.ts` — typed `request<T>` wrapper (mirrors the JS one), zod-parses successful responses, raises typed errors from `@auror/shared/errors`.
  - [ ] `lib/api/auth.ts`, `lib/api/chapters.ts`, `lib/api/wallet.ts`, … — one file per backend module, matching the folder layout in `packages/backend/src/modules/`.
  - [ ] `lib/api/index.ts` — barrel.
- [ ] Reuse the existing 401-redirect-to-login behaviour, but route through `next/navigation` instead of `window.location` so it works inside Server Components that detect a stale session via cookies.
- [ ] Keep the JS file in place for the duration of the migration so the still-rewritten HTML pages can keep calling it from `<script src="/stitch_auror_modern_reading_platform/assets/js/api.js">`. Delete it only in Phase F.

### A.3 — Route-group skeleton + shared chrome
- [ ] App Router structure (do not put any `page.tsx` in here yet — this is just the skeleton):
  ```
  app/
    (marketing)/                 # public landing, future
    (auth)/
      layout.tsx                 # centred card, gradient backdrop
    (reader)/
      layout.tsx                 # reader nav (Browse / Library / Reading / Wallet / Sub)
    (author)/
      layout.tsx                 # author nav (Studio / Analytics / Earnings / Settings)
    (admin)/
      layout.tsx                 # admin nav
  ```
- [ ] `app/layout.tsx` (new, root) — `<html><body>` with `<Suspense>` for `next/font` injection, `<Toaster />` from `@auror/shared/errors/toaster`, global `<meta>` defaults.
- [ ] Shared primitives under `packages/webapp/components/ui/` — `Button`, `Card`, `Field` (input+label+error), `Avatar`, `Badge`, `Sheet`, `Tabs`, `Skeleton`. All styled with Lumina tokens, all client-component where they need state.
- [ ] `next.config.mjs` — **keep the 15 rewrites in place.** They are the safety net for every phase below. Each rewrite gets a `// MIGRATE: see dev-frontend-migration.md Phase X` comment above it.

### A.4 — Definition of done (Phase A)
1. `pnpm --filter @auror/webapp dev` boots; `/` looks visually identical to the Stitch `reader_browse_dashboard` screen.
2. `pnpm --filter @auror/webapp typecheck` and `pnpm --filter @auror/webapp build` both pass.
3. `lib/api/*` exists with typed wrappers for every backend module; old `assets/js/api.js` is unchanged.
4. No new page is reachable except via the existing rewrites.

---

## Phase B — *Pintas* ("shortcut"): Auth

> **Goal:** `/login` and `/register` are real App Router pages. Replace the auth rewrites.

### B.1 — `app/(auth)/login/page.tsx`
- [ ] Server Component shell, Client Component form (uses `useFormState` / `useTransition`).
- [ ] Calls `POST /api/auth/login` via the typed client; on success, server action sets the session cookie and `redirect()`s to `/`.
- [ ] Maps Stitch's error-alert block to a `Field` `error` prop.
- [ ] Keeps the gradient glow background and "Enter the Realm of Deep Flow" tagline (visual parity).

### B.2 — `app/(auth)/register/page.tsx`
- [ ] Same shape as login; calls `POST /api/auth/register`.
- [ ] Adds client-side zod schema (port from `auth/register.html`'s inline validation if any).

### B.3 — Cutover
- [ ] Once B.1 + B.2 are visually + functionally verified, remove the two `login`/`register` rewrites from `next.config.mjs`.
- [ ] Add Playwright spec `tests/e2e/auth.spec.ts` covering happy-path login + register + invalid-credentials error.

### B.4 — Definition of done (Phase B)
1. Hitting `/login` and `/register` shows the new page, not the Stitch HTML.
2. Logout (`POST /api/auth/logout`) clears the session cookie and a follow-up `GET /api/auth/session` returns 401.
3. The 401-redirect logic in `lib/api/client.ts` works from a Client Component (verify by manually expiring a cookie in DevTools).

---

## Phase C — *Baca* ("read"): Reader surfaces

> **Goal:** all 5 reader screens are real pages. Replace the reader rewrites. This is the largest phase — 2 369 LoC of HTML.

### C.1 — `app/(reader)/page.tsx` (browse dashboard)
- [ ] Server Component, fetches initial rail data via the existing backend (no rewrite-driven mock).
- [ ] Lazy-loads images with `next/image`; honours the Stitch `screen.png` aspect ratios.

### C.2 — `app/(reader)/library/page.tsx`
- [ ] Server Component fetches `GET /api/library` (already exists).
- [ ] Renders tabs: Continue Reading / Bookmarks (P2) / History. Empty states match Stitch's "Your library is a blank page" copy.

### C.3 — `app/(reader)/read/[chapterId]/page.tsx`
- [ ] **Why Khairul:** server-side gating check (coin/sub), `generateMetadata` for SEO, hydration of reading-position, scroll restoration.
- [ ] Streaming `<Suspense>` boundary around the chapter body (which can be large).

### C.4 — `app/(reader)/wallet/page.tsx`
- [ ] Server Component for the balance + recent transactions; Client Component island for the top-up modal.
- [ ] Wires the existing `POST /api/wallet/purchase` and `GET /api/wallet/transactions`.

### C.5 — `app/(reader)/subscription/page.tsx`
- [ ] Server Component; one Client Component for the plan-switcher confirmation dialog.
- [ ] Uses existing `GET/POST /api/subscription`.

### C.6 — Cutover
- [ ] Remove the 5 reader rewrites (`/`, `/library`, `/reading`, `/wallet`, `/subscription`).
- [ ] Add Playwright specs for: empty library, top-up modal open/close, chapter-gating paywall, sub-plan switch.

### C.7 — Definition of done (Phase C)
1. A logged-out user lands on `/` and sees the real page (not the Stitch HTML).
2. A logged-in reader can navigate Browse → Story → Chapter → unlock-with-coin → read. Progress persists across reloads.
3. Wallet balance and transactions match what `GET /api/wallet/balance` returns.
4. Subscription page reflects the current plan from `GET /api/subscription`.

---

## Phase D — *Tulis* ("write"): Author surfaces

> **Goal:** all 4 author screens are real pages. Reuse the Tiptap editor work from F0.K1.

### D.1 — `app/(author)/studio/page.tsx` (writing studio)
- [ ] **Why Khairul:** the most stateful surface. Editor (F0.K1), autosave, chapter list, publish action.
- [ ] Server Component for the chapter list; Client Component for the editor pane.
- [ ] The Stitch screen is 807 LoC — split into 4 components: `<ChapterList>`, `<Editor>`, `<PublishPanel>`, `<StoryMetadataSidebar>`.

### D.2 — `app/(author)/analytics/page.tsx`
- [ ] Server Component fetches aggregated metrics; Client Component renders the chart (Recharts, see F0.K3).
- [ ] Map the Stitch gauge/line/bar widgets to typed chart components under `components/charts/`.

### D.3 — `app/(author)/earnings/page.tsx`
- [ ] Mirrors the reader-wallet pattern: server-rendered table of recent payouts + Client Component for the request-payout modal.
- [ ] Wires `GET /api/wallet/payout` (already exists).

### D.4 — `app/(author)/settings/page.tsx`
- [ ] Pure Client Component form (form state, validation); calls a `PATCH /api/author/profile` endpoint — flag with backend if missing.
- [ ] Cover-image uploader reuses F0.K6.

### D.5 — Cutover
- [ ] Remove the 4 author rewrites (`/author/*`).
- [ ] Playwright spec for: open a draft chapter → edit → autosave indicator shows "Saved <2s" → reload → content persists.

### D.6 — Definition of done (Phase D)
1. An author can write, autosave, and publish a chapter end-to-end.
2. Analytics charts reflect real backend data (or honest "no data yet" empty state — not the Stitch hard-coded numbers).
3. Earnings table matches `GET /api/wallet/payout` payload.

---

## Phase E — *Kawal* ("control"): Admin surfaces

> **Goal:** all 3 admin screens are real pages. Smallest phase.

### E.1 — `app/(admin)/admin/page.tsx` (command center)
- [ ] Server Component; KPI tiles (DAU/MAU/ARPU come from B1.6 in P1 — show skeleton until then).

### E.2 — `app/(admin)/admin/moderation/page.tsx`
- [ ] Server Component for the flagged queue; Client Component for the action drawer (approve / remove / suspend).
- [ ] Wires `GET /api/admin/reports` (already exists).

### E.3 — `app/(admin)/admin/users/page.tsx`
- [ ] Server Component with search + filter (URL search params, no client state).
- [ ] Wires `GET /api/admin/users`.

### E.4 — Cutover
- [ ] Remove the 3 admin rewrites (`/admin*`).
- [ ] Playwright spec for: search users → suspend → re-login from the suspended account is blocked.

### E.5 — Definition of done (Phase E)
1. A non-admin user hitting `/admin` is redirected to `/` by the `(admin)` route group's `layout.tsx` role check.
2. An admin can suspend a user and the suspension takes effect on the user's next request.

---

## Phase F — *Sapu* ("sweep"): Cleanup

> **Goal:** the bridge is gone. The static HTML is gone. The webapp is a normal Next.js app.

### F.1 — Delete the Stitch folder
- [ ] `git rm -r packages/webapp/public/stitch_auror_modern_reading_platform/` — both `*.html` and `assets/js/api.js`.
- [ ] Confirm `pnpm --filter @auror/webapp build` no longer needs the public assets (the only referencer is `next.config.mjs` rewrites, all removed by now).

### F.2 — Empty-state the API client
- [ ] Remove the legacy `assets/js/api.js` reference from any still-cached references.
- [ ] Verify `rg "api\.js|stitch_auror"` returns zero matches in `packages/webapp/`.

### F.3 — Playwright visual regression
- [ ] Add `tests/e2e/visual/` with one snapshot per migrated route (desktop 1280×800 + mobile 390×844).
- [ ] Wire into `.github/workflows/ci-webapp.yml` as a non-blocking check first; promote to blocking once 1 week of green.

### F.4 — Accessibility & perf audit
- [ ] `axe-core` run against every migrated page in Playwright; fix any serious/critical violations.
- [ ] Lighthouse on `/` and `/read/[chapterId]`: target ≥ 90 performance + ≥ 95 a11y on the desktop preset.

### F.5 — Definition of done (Phase F)
1. `next.config.mjs` has zero `rewrites` entries.
2. `packages/webapp/public/` no longer contains `stitch_auror_modern_reading_platform/`.
3. `pnpm --filter @auror/webapp build` produces a clean bundle with no `// MIGRATE:` comments left in `next.config.mjs`.
4. All 16 screens from the original inventory are reachable as real pages, role-gated, and typechecked.

---

## Cross-cutting concerns

### Component reuse with `packages/desktop`
The Stitch designs are reader/author surfaces. Several of them (Studio, Analytics, Earnings, Settings) will eventually need a desktop counterpart under `packages/desktop/src/routes/` (see D0.x tasks in dev-phase0). Plan: any component lifted out of Stitch HTML into `packages/webapp/components/` should be **pure presentational** (no `next/*` imports, no Supabase clients) so it can be re-used inside the Tauri webview without bundling Next.

### Supabase server-side auth
Today the HTML pages call the `/api/*` routes from the browser. During migration, the new App Router pages should use the same Supabase server client (`middleware.ts` already exists — verify it covers the new route groups) and let server components fetch with the user's session attached. This is the single biggest behaviour change vs the static HTML.

### Design-system governance
Any pixel deviation from a Stitch screen during migration must be raised as a PR comment with a `design-review` label — not silently "fixed". The Lumina tokens are the source of truth; the Stitch screens are the visual spec.

## Working model for the cutover

1. One rewrite out at a time. Never remove a rewrite *before* its replacement page is shipped and verified.
2. The Playwright spec for a page must be green for **3 consecutive runs** before its rewrite is removed.
3. Each phase ends with a short demo recording (Loom) of the new page vs the Stitch `screen.png` for the team channel.
4. If a phase slips more than 1 sprint, the rewrites stay and we accept the cost — we do not half-migrate a screen.

## Risks

- **Bridge-leakage.** The biggest risk is removing a rewrite too early and breaking a flow the team depends on. Mitigation: the rewrite-comments + the "3 consecutive green" rule.
- **CDN Tailwind drift.** The HTML files pin `cdn.tailwindcss.com` which can change behaviour between deploys. The migration to a real build eliminates this, but during the in-between period both run, so we must ensure Phase A's tokens match CDN's defaults (especially `borderRadius.DEFAULT` = `0.25rem`).
- **Role-gate regressions.** Static HTML can't enforce a role gate — anyone can browse to `/admin` and see the design. The new pages *can* and *must* enforce it; this is a quiet security improvement, but the redirect behaviour needs to be tested explicitly in B.4, C.7, D.6, E.5.
- **Supabase cookie scoping.** The `middleware.ts` was written for the old route layout. Verify (in Phase A.3) that the new route groups are matched by the middleware's matcher — otherwise server components will see no session and fall back to anonymous reads.
- **Bundle size.** The 4 `next/font` families (Geist, Inter, Material Symbols) plus Recharts can blow past the 200 KB first-load budget if imported carelessly. Mitigation: dynamic-import chart components and the Material Symbols set; budget check in F.4.
