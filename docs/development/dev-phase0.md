# Dev Phase 0 — *Mula* (MVP Foundations)

> **Codename:** Mula ("start")
> **Phase scope:** PRD §6 — features scored 0.9–1.0
> **Goal:** end-to-end loop works. Author writes → publishes (free or coin-locked). Reader signs up → tops up coins → reads → unlocks → follows. Admin suspends bad actors, approves payouts, sees revenue.

## Team

| Track | PIC | Notes |
|---|---|---|
| Backend / Infra | **Khairul** | Node.js, Supabase, Redis, payments, Docker |
| Frontend (complex) | **Khairul** | Editor, payment flows, charts, multi-device sync |
| Frontend (standard) | **Ajwad** | Auth, profile pages, lists, simple forms, theming |

**Rule:** if a frontend task involves a stateful editor, payment SDK, charting library, service worker, or non-trivial real-time sync — it goes to Khairul, not Ajwad.

---

## Backend Track — Khairul

### B0.1 — Infra & Foundations
- [ ] `docker-compose.yml`: webapp, backend, Supabase (Postgres + Auth + Storage), Redis, reverse proxy (Caddy or Traefik)
- [ ] `.env.example` for every service; secrets via env, not in repo
- [ ] Postgres migrations runner (Supabase CLI) + seed script
- [ ] Redis client wired (cache + BullMQ for jobs)
- [ ] Sentry-equivalent self-hosted (GlitchTip) wired into backend
- [ ] Uptime Kuma + Postgres exporter for monitoring
- [ ] Nightly DB backup cron + restore-drill doc

### B0.2 — Auth & Roles
- [ ] Supabase Auth: email/password + email verification
- [ ] Role column on `users` (`reader` | `author` | `admin`); RLS policies enforce per-role access
- [ ] JWT validation middleware on backend

### B0.3 — Domain Schema
- [ ] `users`, `author_profiles`, `reader_profiles`
- [ ] `stories` (title, blurb, cover_url, genre, tags, language, age_rating, status)
- [ ] `chapters` (story_id, order, title, content_md, gating: `free|coin|sub`, price_coins, published_at, draft_content_md)
- [ ] `follows`, `reads`, `wallets`, `coin_purchases`, `chapter_unlocks`, `subscriptions`, `payouts`, `reports`, `notifications`
- [ ] Materialized view: per-author earnings (daily/weekly/monthly rollup)

### B0.4 — API
- [ ] Author: story + chapter CRUD, publish, set gating
- [ ] Reader: discovery list, story detail, chapter read (enforces gating), follow, vote, report
- [ ] Wallet: balance, top-up intent, coin spend (atomic; Redis lock per user)
- [ ] Subscriptions: create / cancel / list
- [ ] Admin: user list/filter/suspend, flagged queue, payout queue, revenue summary

### B0.5 — Payments
- [ ] Pluggable payment adapter (start with **one** of Billplz / iPay88 / Curlec / Stripe)
- [ ] FPX, DuitNow QR, TnG, Boost, card via the chosen processor
- [ ] Webhook handler with idempotency keys
- [ ] Coin economy: fixed RM↔coin rate (config table); author cut % configurable

### B0.6 — Payout Pipeline
- [ ] Author payout method storage (encrypted at rest)
- [ ] Payout request → admin review → marked paid (state machine)
- [ ] Manual export (CSV) for bank batch upload in v1; no auto-disbursement yet

### B0.7 — Notifications
- [ ] In-app notifications table + WebSocket or Supabase Realtime channel
- [ ] Triggers: new chapter from followed author, payout state change

---

## Frontend Track — Khairul (Complex)

### F0.K1 — Markdown Editor + Autosave *(Khairul)*
**Why Khairul:** stateful editor, debounced autosave, draft/published divergence, multi-device conflict, image paste handling.
- Tiptap or CodeMirror 6 with markdown mode
- Autosave to `chapters.draft_content_md` every 10s (debounced) via Jotai atom
- "Saved X seconds ago" indicator
- Optimistic UI; conflict resolution = last-write-wins for v1 (document the limitation)

### F0.K2 — Coin Top-up & Payment Flow *(Khairul)*
**Why Khairul:** payment SDK, webhook reconciliation UX, error states.
- Top-up packs (RM5/10/20/50)
- Redirect/embed of payment processor's checkout
- Polling/webhook-driven status page

### F0.K3 — Earnings Dashboard *(Khairul)*
**Why Khairul:** charts + range filters + aggregated queries.
- Daily / weekly / monthly breakdown
- Source: subs vs coins (tips deferred to P2)
- Lib: Recharts or Tremor

### F0.K4 — Admin Revenue Dashboard *(Khairul)*
- Gross, profit, seller income; per-period
- Author drill-down

### F0.K5 — Payout Approval Queue *(Khairul)*
- State transitions (requested → approved → paid / rejected)
- CSV export for bank batch

### F0.K6 — Cover Image Upload *(Khairul)*
**Why Khairul:** Supabase Storage signed URLs, image preview, aspect-ratio crop.

### F0.K7 — Reading Progress Sync *(Khairul)*
- Persist chapter + scroll position
- Resume across devices on next load

---

## Frontend Track — Ajwad (Standard)

> **Ajwad's guardrails:** Jotai for state. No `as any`. `useEffect` is a last resort — prefer event handlers, derived state, `key` resets. Ping Khairul when blocked > 30 min.

### F0.A1 — Auth Pages
- Sign up, sign in, email verify, forgot password
- Use Supabase Auth helpers; no custom token handling

### F0.A2 — Author Profile Page
- Public: bio + story list
- Owner edit: bio, links, pen name

### F0.A3 — Story Metadata Form
- Title, blurb, genre (select), tags (input chips), language, age rating, status

### F0.A4 — Browse + Search
- Genre/language/popularity/status filters (URL-synced via Jotai atoms)
- Search input with debounced query
- Paginated list

### F0.A5 — Reading View
- Render markdown to styled HTML
- Day / night / sepia theme toggle (Jotai atom; persists to localStorage)
- Vertical scroll only (no page-flip)

### F0.A6 — Follow / Vote / Report
- Follow author button (optimistic toggle)
- Heart/vote per chapter
- Report content modal (reason dropdown + free text)

### F0.A7 — Admin User List
- Table with search + filter (role, status)
- Suspend / reinstate action
- Role assignment (reader / author / admin)

### F0.A8 — Admin Flagged Queue
- List of reports
- Approve / dismiss action
- Reads from same `reports` table as F0.A6

### F0.A9 — Wallet Summary (Reader)
- Coin balance display
- Transaction history list (read-only; top-up flow itself is F0.K2)

---

## Shared / `packages/shared`

- DTOs for every API endpoint
- Domain enums: `UserRole`, `ChapterGating`, `PayoutStatus`, `SubscriptionStatus`
- Zod schemas mirroring DTOs (validated on both sides)

---

## Definition of Done — Phase 0

1. New user → author signup → write chapter → publish (free + coin-locked) → see entry in earnings.
2. New user → reader signup → discover that story → top up RM10 → unlock coin chapter → read.
3. Reader follows author → author publishes new chapter → reader gets in-app notification.
4. Admin suspends a flagged user; suspended user cannot publish or comment.
5. Admin approves a payout; CSV export downloads cleanly.
6. `docker compose up` from a fresh clone brings the stack to a working state with one `.env` file.

## Dependencies / Risks

- **Payment processor choice** (open question in PRD §13) blocks B0.5. Decide before sprint 1.
- **Coin↔RM rate + author cut %** blocks revenue math. Default: RM1 = 10 coins, author 70% (revisit in P1).
- **Religious sensitivity / NSFW filter** is *not* in P0 — must communicate to early authors that moderation is manual.
- Ajwad's onboarding: pair-program F0.A1 (auth) before solo work to set conventions.
