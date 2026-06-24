# HTML → Next.js (TypeScript) Migration Plan

> **Scope:** Convert the 14 Stitch-generated HTML mockups in
> `packages/webapp/public/stitch_auror_modern_reading_platform/` into typed React
> components and App Router pages inside `packages/webapp/app/`, **preserving the
> design system 1:1** (colors, typography, spacing, layout, interactions).
>
> **Branch:** `devkiro`
> **Status:** planning only — no code yet.
>
> ### Frontend-only constraint
>
> This migration touches **only the webapp's UI layer**. Specifically:
>
> - ✅ **In scope:** `packages/webapp/app/**` *page routes and components*,
>   `packages/webapp/tailwind.config.ts`, `packages/webapp/app/globals.css`,
>   `packages/webapp/app/layout.tsx`, and any new `_components/` / `_state/`
>   folders we create under `app/`.
> - ❌ **Out of scope — do not edit:**
>   - `packages/webapp/app/api/**` (existing API route handlers — consumed
>     as-is, never modified by this migration)
>   - `packages/webapp/middleware.ts`, `packages/webapp/supabase/**`
>   - `packages/backend/**` (Fastify API)
>   - `packages/desktop/**` (Tauri shell)
>   - `packages/shared/**` (cross-package types — read-only for type imports)
>   - Anything outside `packages/webapp/` (root configs, docker-compose, etc.)
>
> If a UI screen needs an API endpoint that doesn't exist or returns the wrong
> shape, **stop and file a separate issue** — do not edit the backend or the
> route handler under this plan. The fix lands in a different PR owned by the
> backend track.

---

## 1. Current state

### 1.1 Source mockups (`public/stitch_auror_modern_reading_platform/`)

| Area | File | Lines | Persona |
|---|---|---:|---|
| Auth – Sign in | `auth/login.html` | 186 | Public |
| Auth – Register | `auth/register.html` | 197 | Public |
| Reader – Browse | `reader_browse_dashboard/code.html` | 341 | Reader |
| Reader – Library / history | `library_history_progress/code.html` | 322 | Reader |
| Reader – Immersive reading | `immersive_reading_experience/code.html` | 551 | Reader |
| Reader – Subscription | `reader_subscription_dashboard/code.html` | 432 | Reader |
| Reader – Wallet & rewards | `reader_wallet_rewards/code.html` | 723 | Reader |
| Author – Writing studio | `author_writing_studio/code.html` | 807 | Author |
| Author – Analytics | `author_analytics_dashboard/code.html` | 486 | Author |
| Author – Earnings & wallet | `author_earnings_wallet/code.html` | 608 | Author |
| Author – Profile settings | `author_profile_settings/code.html` | 448 | Author |
| Admin – Command center | `admin_command_center/code.html` | 429 | Admin |
| Admin – Users | `admin_user_management/code.html` | 535 | Admin |
| Admin – Content moderation | `admin_content_moderation/code.html` | 626 | Admin |
| Shared API stub | `assets/js/api.js` | 370 | — |
| Design tokens reference | `lumina_reading_system/DESIGN.md` | — | — |

Total: ~7k lines of HTML/JS to migrate. Each file embeds:

- Tailwind via CDN (`cdn.tailwindcss.com?plugins=forms,container-queries`).
- A full Material-Design-3 color palette in an inline `tailwind.config` block.
- Google Fonts: **Inter** (body) + **Geist** (display) + **Material Symbols Outlined**.
- Inline `<script>` blocks for interactivity (form validation, tab switching, modal toggles).
- Mocked API calls via the shared `assets/js/api.js`.

### 1.2 Target webapp (`packages/webapp/`)

Already in place and **must remain authoritative**:

- Next.js 14 (App Router), React 18, TypeScript 5, Tailwind 3.
- Supabase SSR + JS clients wired.
- 24 API routes under `app/api/**` (auth, writings, chapters, wallet, admin, …).
- Conventions: Jotai for shared state, no `as any`, `useEffect` last resort
  (see `.claude/skills/webapp/SKILLS.md`).

The migration is **additive into existing routes** — we don't fork the webapp.

---

## 2. Migration strategy

### 2.1 Guiding principles

1. **Design is the contract.** Pixel parity with the HTML mockups across colors,
   spacing, font weights, and rounded corners. If the mockup looks wrong, file an
   issue — don't "improve" silently.
2. **Tokens centralized, not inlined.** Move every color / radius / spacing token
   from the inline `tailwind.config` blocks into the single
   `packages/webapp/tailwind.config.ts`. No CDN Tailwind in production.
3. **Server components by default.** Only mark a file `"use client"` when it
   needs interactivity (form state, modals, charts, editor). Most page shells stay
   server-rendered.
4. **Consume real API routes; never modify them.** Each migrated screen replaces
   the `assets/js/api.js` mock by calling the matching `app/api/**` endpoint
   **as it exists today**. If the endpoint is missing, returns the wrong shape,
   or needs new fields, file a separate issue against the backend track — do
   not edit route handlers under this plan.
5. **No new abstractions until the third caller.** Three near-identical card
   components beats a premature `<Card variant=…>` API. Extract only when the
   third usage proves the shape.
6. **Delete as we migrate.** When a screen is live in `app/`, remove the
   corresponding `public/.../code.html`. The mockups should not survive merge.

### 2.2 Out of scope (intentional)

- New features, copy changes, or UX "improvements" outside the mockups.
- Internationalization wiring (Phase 1+ concern).
- Theming/dark-mode toggle (the `darkMode: "class"` config is preserved, but no
  toggle UI is built unless the mockup contains one).
- Mobile-first rework — the mockups are already responsive; we keep their
  breakpoints as-is.

---

## 3. Phasing

Six phases. Each lands as one or more PRs against `devkiro`. Phase N+1 cannot
start until Phase N is merged.

### Phase A — Design system foundation

> Establishes the shared primitives every screen will consume.

**Tailwind config** (`packages/webapp/tailwind.config.ts`):

- [ ] Port the full M3 color palette from `lumina_reading_system/DESIGN.md`
      (`surface`, `surface-container-*`, `primary`, `on-primary`, `tertiary`,
      `outline-variant`, `error-container`, etc.).
- [ ] Port `borderRadius`, `fontFamily`, and the custom `spacing` scale
      (`sidebar-width: 280px`, `gutter: 24px`, `container-max: 1440px`).
- [ ] Enable `@tailwindcss/forms` and `@tailwindcss/container-queries` plugins
      (replaces the CDN `?plugins=` query).
- [ ] Add `darkMode: "class"`.

**Fonts** (`packages/webapp/app/layout.tsx`):

- [ ] Replace Google Fonts `<link>` with `next/font/google` for Inter + Geist
      (or `next/font/local` if we want to self-host).
- [ ] Decision needed: keep Material Symbols Outlined as a Google Fonts link,
      or replace with `lucide-react`. Mockups use ~40 unique symbols — listing
      and decision happens before Phase B starts.

**Global CSS** (`packages/webapp/app/globals.css`):

- [ ] Move the radial-gradient background used by auth + several dashboards into
      a utility class (`.bg-aurora` or similar) — declared once, applied where
      mockups request it.

**Shared primitives** (`packages/webapp/app/_components/`):

- [ ] `<Icon name="mail" />` — single component wrapping Material Symbols (or
      Lucide, per decision above), so swapping icon libraries is one PR.
- [ ] `<AlertBox kind="error|success|info" />` — used on every auth and form
      screen.
- [ ] `<AppShell sidebar={…} topbar={…}>` — the dashboard chrome shared by
      reader, author, and admin screens. **Defer extraction until Phase C** when
      we have three concrete callers.

**Exit criteria:** `pnpm --filter @auror/webapp typecheck` passes, no CDN
Tailwind reference remains in any file we ship.

### Phase B — Auth

> Smallest blast radius, two pages, exercises Phase A's primitives.

- [ ] `app/(auth)/login/page.tsx` ← `auth/login.html`
- [ ] `app/(auth)/register/page.tsx` ← `auth/register.html`
- [ ] Forms wired to existing `app/api/auth/login/route.ts` and
      `app/api/auth/register/route.ts`. Use Server Actions or a thin
      `fetch` from a client component — pick one and document the choice.
- [ ] Replace inline JS error/success toggles with React state (`useState` for
      purely local form state — no Jotai needed here).
- [ ] Delete `public/stitch_auror_modern_reading_platform/auth/`.

**Decision point:** form library. Options: `react-hook-form` + `zod`, or hand-
rolled with the existing `zod` dep. **Recommendation:** hand-rolled for two
fields per form; revisit if a future screen needs 5+ fields.

### Phase C — Reader (standard screens)

> All Ajwad-track screens. CRUD, lists, theming — no editor or charts.

- [ ] `app/browse/page.tsx` ← `reader_browse_dashboard/code.html`
- [ ] `app/library/page.tsx` ← `library_history_progress/code.html`
- [ ] `app/subscription/page.tsx` ← `reader_subscription_dashboard/code.html`
- [ ] `app/wallet/page.tsx` ← `reader_wallet_rewards/code.html`
- [ ] Extract `<AppShell>` here (third caller proves the shape).
- [ ] Wire to `/api/library`, `/api/subscription`, `/api/wallet/*` endpoints.
- [ ] Jotai atom for cart-style coin-pack selection on the wallet screen.

**Exit criteria:** the four screens render with real data when signed in;
loading and empty states match the mockups.

### Phase D — Reader (immersive reading)

> Khairul-track: pulled out of Phase C because of complexity (chapter renderer,
> reading prefs, keyboard nav, font-size controls).

- [ ] `app/read/[storyId]/[chapterId]/page.tsx` ← `immersive_reading_experience/code.html`
- [ ] Reading-preference state (font size, line height, theme) in Jotai with
      `localStorage` persistence via `atomWithStorage`.
- [ ] Wire chapter unlock flow to `/api/chapters/[chapterId]/unlock`.

### Phase E — Author

> Mix of Ajwad-track (profile, simple lists) and Khairul-track (studio editor,
> charts).

- [ ] `app/author/profile/page.tsx` ← `author_profile_settings/code.html` — Ajwad.
- [ ] `app/author/earnings/page.tsx` ← `author_earnings_wallet/code.html` — Ajwad.
- [ ] `app/author/analytics/page.tsx` ← `author_analytics_dashboard/code.html`
      — Khairul (charts).
- [ ] `app/author/studio/page.tsx` ← `author_writing_studio/code.html`
      — Khairul (markdown editor, chapter list, draft state). This is the
      largest single mockup (807 lines) — likely splits across multiple PRs.

**Decision points:**

- Charting library for analytics — `recharts` vs `visx` vs `tremor`. The mockup
  shows line + bar combos; pick the smallest lib that covers both.
- Editor — likely a Phase 0 deliverable already owned by Khairul (see
  `docs/development/dev-phase0.md`). Coordinate so we don't ship two editors.

### Phase F — Admin

> Lowest-traffic surface but highest stakes (moderation actions).

- [ ] `app/admin/page.tsx` ← `admin_command_center/code.html` (overview).
- [ ] `app/admin/users/page.tsx` ← `admin_user_management/code.html`.
- [ ] `app/admin/moderation/page.tsx` ← `admin_content_moderation/code.html`.
- [ ] Wire to `/api/admin/users` and `/api/admin/reports`.
- [ ] Confirm RLS / role gating on every admin route (middleware-level check
      against `users.role`).

**Exit criteria:** non-admin users see a 403 on every `/admin/*` route, verified
by a manual run-through with both roles.

---

## 4. Cross-cutting concerns

### 4.1 Interactive JS in the mockups

Every mockup has inline `<script>` blocks doing things like tab switching, modal
toggles, dropdown menus, password-visibility eyes. The migration rule:

- **Tabs / accordions / dropdowns** → React state in a client component.
  Prefer the lift: if all tab content fits in one component file, no state
  library needed.
- **Modals** → a single shared `<Modal>` primitive (Phase A or first time it
  appears in Phase B).
- **Form interactivity** → controlled inputs + local `useState`. No `useEffect`
  for derived state (see SKILLS.md).
- **Cross-screen state** (e.g. wallet balance shown in topbar) → Jotai atom.

### 4.2 `assets/js/api.js`

This is a mock API used by the static HTML. We do **not** port it. Every fetch
in the mockups is replaced by either:

1. A direct call to the matching `app/api/**` route **using its current
   request/response shape**, or
2. A `TODO(backend)` comment with a link to a filed issue, plus a temporary
   typed stub in the component that returns hardcoded data so the UI still
   renders. **Never edit the route handler to fit the UI** — flag the gap and
   move on.

After all phases ship, `assets/js/` is deleted.

### 4.3 Icons

Material Symbols Outlined is used heavily (`<span class="material-symbols-outlined">mail</span>`).
Two options:

| Option | Pros | Cons |
|---|---|---|
| Keep Material Symbols via Google Fonts | Zero design drift, mockups copy-paste cleanly | Extra font request, harder to tree-shake |
| Migrate to `lucide-react` | Tree-shakeable, typed icon names, no font-load | Manual mapping per icon, slight visual drift |

**Recommendation:** keep Material Symbols for Phase A–B (preserves the design
contract), revisit when bundle size becomes a measurable concern.

### 4.4 Testing strategy

- **Visual:** screenshot each migrated screen and diff against the source HTML
  rendered in the same viewport. Manual at first; consider Playwright snapshot
  tests once the design stabilizes.
- **Type safety:** `pnpm --filter @auror/webapp typecheck` is the gate on every
  PR.
- **Behavior:** every form / mutation flow gets at least one manual run-through
  recorded in the PR description.

### 4.5 Folder layout in `app/`

Proposed structure (route groups in parens are layout boundaries, not URL
segments):

```
packages/webapp/app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (reader)/
│   ├── browse/page.tsx
│   ├── library/page.tsx
│   ├── subscription/page.tsx
│   ├── wallet/page.tsx
│   └── read/[storyId]/[chapterId]/page.tsx
├── (author)/
│   └── author/
│       ├── profile/page.tsx
│       ├── earnings/page.tsx
│       ├── analytics/page.tsx
│       └── studio/page.tsx
├── (admin)/
│   └── admin/
│       ├── page.tsx
│       ├── users/page.tsx
│       └── moderation/page.tsx
├── _components/        # shared primitives (Icon, AlertBox, AppShell, Modal)
├── _state/             # cross-cutting Jotai atoms (wallet, user, prefs)
└── api/                # existing — untouched
```

Persona route groups let each section have its own `layout.tsx` (sidebar, topbar
variant) without affecting URLs.

---

## 5. Risks & open questions

| # | Risk / question | Owner | Resolution path |
|---|---|---|---|
| 1 | Tailwind palette in mockups may diverge slightly from `DESIGN.md` | Frontend lead | Diff every `tailwind.config` block against `DESIGN.md` in Phase A; treat `DESIGN.md` as truth |
| 2 | Material Symbols vs Lucide decision | Frontend lead | Decide before Phase A merges |
| 3 | Writing-studio editor scope overlap with Phase 0 plan | Khairul | Cross-link this doc and `dev-phase0.md` before Phase E |
| 4 | Charts library choice for author analytics | Khairul | Decide before Phase E starts |
| 5 | Form validation library (RHF + Zod vs hand-rolled) | Ajwad | Decide before Phase B starts |
| 6 | Where reading prefs persist (localStorage vs server profile) | Khairul | Decide before Phase D starts |
| 7 | What happens to `public/stitch_auror_modern_reading_platform/` on Phase F merge | Both | Delete folder entirely; mockups live in git history if needed |

---

## 6. Suggested PR sequence

1. **PR-1 (Phase A):** Tailwind config + fonts + globals.css. ~200 lines, no
   route changes. Reviewable in 15 min.
2. **PR-2 (Phase A):** Shared primitives (Icon, AlertBox). One PR per primitive
   if they bloat.
3. **PR-3 (Phase B):** Login.
4. **PR-4 (Phase B):** Register + delete `auth/` mockups.
5. **PR-5–8 (Phase C):** One per reader screen.
6. **PR-9 (Phase C):** Extract `<AppShell>` once all four readers are in.
7. **PR-10 (Phase D):** Immersive reading.
8. **PR-11–14 (Phase E):** One per author screen; studio may split into 2–3.
9. **PR-15–17 (Phase F):** Admin screens.
10. **PR-18:** Delete `public/stitch_auror_modern_reading_platform/` entirely.

Total: ~15–18 PRs, roughly two per week if both Ajwad and Khairul are on it.

---

## 7. What we are **not** deciding in this doc

- Whether to migrate at all (decision: yes, per this branch's existence).
- The release schedule (depends on PRD phase progress).
- Whether the desktop app (Tauri) consumes the same components (it should, but
  that's a follow-on doc).

Once §5 questions are resolved, Phase A can start.
