# Dev Phase 1 — *Teguh* (Production-Grade)

> **Codename:** Teguh ("solid / firm")
> **Phase scope:** PRD §7 — features scored 0.7–0.8
> **Goal:** trust layer. Reviews, content warnings, age-gating, religious sensitivity filter, verification, KPI dashboard, support in Bahasa. The platform is now defensibly safe for paying users.

## Team

| Track | PIC |
|---|---|
| Backend / Infra | **Khairul** |
| Frontend (complex) | **Khairul** |
| Frontend (standard) | **Ajwad** |

---

## Backend Track — Khairul

### B1.1 — Reviews & Ratings
- [ ] `reviews` (user_id, story_id, rating 1–5, body, helpfulness_score)
- [ ] One review per user per story; edit allowed
- [ ] Aggregated rating on `stories`

### B1.2 — Comments (per chapter)
- [ ] `comments` (chapter_id, user_id, body, parent_id for 1-level reply)
- [ ] Word-filter pipeline (config table of banned terms; soft-hide vs hard-block)

### B1.3 — Content Warnings & Age-Gating
- [ ] `content_warnings` enum on stories (violence, religious, mature, etc.)
- [ ] Reader-side preference filter
- [ ] Age verification record (DOB attestation + optional ID upload for 18+)

### B1.4 — Religious Sensitivity Filter (MY context)
- [ ] Rule engine: keyword + category lists, versioned
- [ ] Apply at publish-time: flag → reviewer queue (not auto-block)
- [ ] Admin UI to edit ruleset (frontend B1.4 below)

### B1.5 — Author Verification Workflow
- [ ] `author_verifications` (user_id, doc_url, status, reviewer_id, notes)
- [ ] State machine: submitted → in_review → approved/rejected
- [ ] Badge on author profile when approved

### B1.6 — KPI Aggregation
- [ ] Nightly jobs: DAU, MAU, ARPU, retention cohorts (basic)
- [ ] Materialized views or Redis-cached rollups

### B1.7 — Refunds & Coin Adjustments
- [ ] Admin-initiated refund with audit trail
- [ ] Coin bonus campaigns (config: rate multiplier, date range)

### B1.8 — Support Ticketing
- [ ] `tickets`, `ticket_messages` tables
- [ ] Email ingestion (optional v1; in-app submission is enough)
- [ ] Bahasa Melayu canned responses table

### B1.9 — Hardening
- [ ] Rate limiting per route (Redis token bucket)
- [ ] DDoS posture: Caddy/Traefik in front, plus app-level limits
- [ ] DB performance monitoring dashboard (pg_stat_statements)

---

## Frontend Track — Khairul (Complex)

### F1.K1 — Age Verification Flow *(Khairul)*
**Why Khairul:** ID upload, doc review, sensitive state, photo capture optional.

### F1.K2 — Religious Sensitivity Ruleset Admin *(Khairul)*
**Why Khairul:** rule editor, versioning, diff view, dangerous if misused.

### F1.K3 — Author Verification Reviewer UI *(Khairul)*
- Document viewer + side-by-side decision panel
- Reject reasons, audit trail

### F1.K4 — KPI Dashboard *(Khairul)*
- DAU / MAU / ARPU / retention cohort grid
- Time-range filters, segment slicers
- Recharts or Tremor

### F1.K5 — Top Stories / Authors Reports *(Khairul)*
- Sortable tables backed by materialized views
- Drill-down to story/author detail

### F1.K6 — Coin Bonus Campaign Manager *(Khairul)*
- Rate-multiplier scheduler with preview of expected lift

---

## Frontend Track — Ajwad (Standard)

### F1.A1 — Reviews + Star Rating UI
- Submit / edit / delete own review
- Story page: aggregate rating + paginated review list

### F1.A2 — Per-Chapter Comments
- Threaded one level deep
- Optimistic post; show pending state
- Soft-hidden (word filter) comments collapsed with "Show"

### F1.A3 — Content Warning Badges
- Render badges on story cards + detail page
- Reader-side filter chips (Jotai atom synced to URL)

### F1.A4 — NSFW Age-Gate Prompt
- Modal: DOB confirm or sign-in-and-verify
- Persist verification token in user record (not localStorage)

### F1.A5 — Block / Mute User
- Action on user profile + comment menu
- Read-side filtering of muted users

### F1.A6 — Receipt History
- Paginated list of payments + invoice download (PDF generated server-side; UI is just a button)

### F1.A7 — Privacy Settings Page
- Toggle: private library, hidden reading history, hide from search
- Simple form; persists to user settings

### F1.A8 — Reader Customization (Font, Spacing)
- Slider for size, dropdown for family, slider for line-height
- Jotai atom + localStorage persistence

### F1.A9 — Trending / New Releases / Staff Picks Rails
- Display-only carousels on homepage
- Data from B1.6 aggregates

### F1.A10 — Author Verification Badge
- Render badge component wherever author shows up

### F1.A11 — Support Ticketing UI
- Submit form (subject, category, body, attachments)
- List my tickets + reply thread

### F1.A12 — FAQ / Help Center
- Static markdown pages rendered from a `help_articles` table
- Admin edit via simple textarea form

### F1.A13 — Word Filter Config (Admin)
- Table + add/remove banned terms
- (Simple — flag for promotion if becomes regex-heavy)

---

## Definition of Done — Phase 1

1. Author submits ID → admin reviews → badge appears on profile.
2. Author publishes a chapter flagged by sensitivity filter → enters reviewer queue → admin approves → goes live.
3. Reader leaves 5-star review with body → other readers see aggregate rating.
4. Reader under 18 cannot read an 18+ story without DOB confirmation.
5. Admin dashboard shows DAU/MAU/ARPU updated nightly.
6. Reader can mute a user; that user's comments disappear from their view.
7. Bahasa support ticket submitted, replied to, resolved in-app.

## Risks

- **Religious filter is high-stakes** — false positives anger authors, false negatives create PR risk. Plan a soft-launch where filter *suggests* not *blocks* for first 30 days.
- **Verification doc storage** — must comply with PDPA. Decide on retention window before B1.5.
- Ajwad workload heavier in P1; pair on F1.A1 (reviews) and F1.A2 (comments) for first week.
