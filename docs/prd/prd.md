# Auror — Product Requirements Document

**Status:** Draft v2 (phased)
**Last updated:** 2026-05-12
**Owner:** TBD

---

## 1. Overview

**Auror** is a self-hosted, Malaysia-first Wattpad alternative for authors and novelists. It pairs a markdown-native, chapter-by-chapter writing experience with a transparent monetization stack (coins + subscriptions + tips) and gives admins full visibility into platform health and payouts.

Three user roles: **admin**, **author**, **reader**. Self-hosted via Docker (webapp, backend, Supabase, Redis, reverse proxy).

## 2. Goals & Non-Goals

### Goals
- Frictionless, chapter-by-chapter writing + publishing for serialized fiction.
- Transparent, Malaysia-compliant earnings (FPX/DuitNow/TnG payouts, CP58 down the line).
- Reader experience optimized for long-form Malay/English reading.
- Operator-friendly: one `docker compose up` brings the whole platform up.

### Non-Goals (lifetime, not just MVP)
- Ad-based monetization as a revenue line.
- Native mobile apps (responsive web + desktop wrapper only).
- General-purpose social network features.

## 3. Roles

| Role | Primary job-to-be-done |
|------|------------------------|
| **Author** | Write → publish chapter-by-chapter → get paid |
| **Reader** | Discover → read → support favourite authors |
| **Admin** | Moderate → payout → understand revenue |

## 4. Tech Stack

- **Backend** (`packages/backend`): Node.js + REST API + Redis (cache, queues, rate limits).
- **Auth + DB**: Supabase (self-hosted) — Postgres, Auth, Storage.
- **Webapp** (`packages/webapp`): Next.js App Router, Supabase Auth, Jotai state (no `as any`, `useEffect` last resort).
- **Desktop** (`packages/desktop`): Electron or Tauri (decision pending) — author-focused wrapper.
- **Shared** (`packages/shared`): DTOs and domain types consumed by all clients.
- **Deploy**: Docker Compose for everything. No external SaaS required.

---

## 5. Priority Framework

Every feature is scored **0.0 – 1.0** on MVP importance:

| Score | Band | Meaning |
|-------|------|---------|
| **0.9 – 1.0** | **Phase 0 — MVP** | Without this, the product doesn't function. Ship to first users. |
| **0.7 – 0.8** | **Phase 1 — Core Platform** | Required to be production-grade and trustworthy. |
| **0.4 – 0.6** | **Phase 2 — Engagement & Growth** | Drives retention, monetization expansion, content quality. |
| **0.2 – 0.3** | **Phase 3 — Scale & Differentiation** | Local moat, B2B, advanced ops. |
| **0.0 – 0.1** | **Phase 4 — Future / Optional** | Nice-to-have; defer until validated demand. |

Rule of thumb: **Phase 0 must answer "can a writer write+earn and a reader read+pay?" end-to-end.** Everything else is sequenced behind that loop.

---

## 6. Phase 0 — MVP (Score 0.9 – 1.0)

**Definition of done:** an author can sign up, write a chapter in markdown, publish it (free or coin-locked), and earn. A reader can sign up, find that story, read free chapters, top up coins, unlock locked chapters, follow the author, and pay. An admin can suspend bad actors, approve payouts, and see gross/net/seller revenue.

### Author — MVP

| Feature | Score | Notes |
|---|---|---|
| Markdown editor with autosave (10s debounce) | 1.0 | Core authoring surface |
| Chapter-by-chapter publishing model | 1.0 | The defining content unit |
| Draft state per chapter | 1.0 | Save without publishing |
| Story metadata (genre, tags, language, age rating, status) | 1.0 | Required for discovery |
| Author profile page (bio, story list) | 1.0 | Public surface for followers |
| Cover image upload (custom only, no templates yet) | 0.9 | Templates deferred to P2 |
| Word count + reading time per chapter | 0.9 | Trivial, ship with editor |
| Earnings dashboard (daily/weekly/monthly) | 0.9 | Authors won't trust the platform without this |
| Premium chapters (free vs coin-locked toggle) | 1.0 | Core monetization primitive |
| Bank / e-wallet payout setup (FPX, DuitNow, TnG) | 0.9 | Can't pay authors otherwise |
| Payout history + statement download | 0.9 | Audit trail |
| Multi-device sync of drafts | 0.9 | Free with DB-backed drafts |

### Reader — MVP

| Feature | Score | Notes |
|---|---|---|
| Browse by genre, language, popularity, status | 1.0 | Primary discovery surface |
| Search with filters (length, language, genre, tags, rating) | 0.9 | Secondary discovery |
| Reading view: vertical scroll | 1.0 | Page-flip mode deferred |
| Day/night/sepia mode | 0.9 | Reader expectation |
| Reading progress sync across devices | 1.0 | Free with DB |
| Customizable reader (font size, family, line spacing) | 0.8 | Bumped into P1 if needed |
| Coin top-up packs (RM5/10/20/50) | 0.9 | Drives monetization |
| Payments: FPX, DuitNow QR, TnG, Boost, card | 1.0 | Local payment parity is non-negotiable |
| Subscription tiers (basic / premium per author) | 0.8 | Sub vs coin both supported at launch |
| Auto-renew control (clear cancel UX) | 0.9 | Trust + regulatory |
| Follow authors + new-chapter notifications | 1.0 | Retention loop |
| Vote / heart chapters | 0.9 | Cheapest engagement signal |
| Report inappropriate content | 0.9 | Required for moderation |

### Admin — MVP

| Feature | Score | Notes |
|---|---|---|
| User search / filter / suspend / ban | 1.0 | Floor for any UGC platform |
| Role management (reader, author, mod, admin) | 0.9 | Wire in early |
| Account recovery & password reset | 0.8 | Supabase Auth covers most |
| Flagged content queue (human review) | 0.9 | Pair with reader reports |
| Real-time revenue dashboard (gross / profit / seller income) | 1.0 | The only number that matters to operator |
| Payout management (approve / reject / schedule) | 1.0 | Authors can't get paid otherwise |
| Coin economy management (price packs, rates) | 0.8 | Tunable knob from day 1 |
| Error logging & alerting (Sentry-style) | 0.9 | Self-host: Sentry OSS or GlitchTip |
| Server / DB monitoring | 0.9 | Self-host: Uptime Kuma + Postgres exporter |
| Backup & disaster recovery | 0.9 | Daily DB snapshot + restore drill |

---

## 7. Phase 1 — Core Platform (Score 0.7 – 0.8)

**Definition of done:** the platform is *production-grade*. Moderation scales, reviews exist, engagement compounds, and ops can be trusted by paying users.

### Author — Phase 1

| Feature | Score |
|---|---|
| Revenue source breakdown (subs / coins / tips) | 0.8 |
| Engagement metrics (votes, comments, shares, time spent) | 0.8 |
| Comment moderation tools on own stories | 0.7 |
| Author verification badge | 0.7 |
| Story SEO tools (auto hashtags, descriptions) | 0.7 *(0.5 borderline)* |

### Reader — Phase 1

| Feature | Score |
|---|---|
| Trending / new releases / staff picks rails | 0.7 |
| Customizable reader (font, spacing — if not shipped in P0) | 0.8 |
| Per-chapter comments | 0.8 |
| Star ratings + written reviews | 0.8 |
| Content warnings (violence, religious, mature) | 0.8 |
| Age-gating 18+ with verification | 0.7 |
| Block / mute users | 0.7 |
| Receipt history for accounting | 0.7 |
| Privacy settings (hidden library/history) | 0.7 |

### Admin — Phase 1

| Feature | Score |
|---|---|
| Author verification workflow (ID, manuscript review) | 0.7 |
| Religious sensitivity filter (Malaysian Islamic guidelines) | 0.7 |
| NSFW filter + age-gating system | 0.8 |
| Comment moderation + word filters | 0.7 |
| Refund processing | 0.7 |
| Coin economy tuning (bonus campaigns) | 0.8 |
| Platform KPI dashboard (MAU, DAU, ARPU) | 0.7 |
| Top stories / authors / genres reports | 0.7 |
| DDoS protection (reverse proxy + Cloudflare-equivalent) | 0.7 |
| DB performance monitoring | 0.7 |
| Customer support ticketing (Bahasa Melayu) | 0.7 |
| FAQ / Help Center CMS | 0.6 *(borderline)* |
| Compliance dashboard (PDPA, SST) | 0.6 *(borderline, push if regulator pressure)* |

---

## 8. Phase 2 — Engagement & Growth (Score 0.4 – 0.6)

**Definition of done:** discovery is personalized, social loops compound, ops gets leverage tooling.

### Author — Phase 2

| Feature | Score |
|---|---|
| Scheduled publishing (weekly/daily release) | 0.5 |
| Cover designer templates | 0.4 |
| Series / book grouping (sequels, prequels) | 0.4 |
| Bahasa Melayu spell-check + grammar | 0.5 |
| Tip jar with custom thank-you | 0.5 |
| Reader demographics (age, location, device) | 0.6 |
| Reading retention chart (drop-off per chapter) | 0.4 |
| Share-to-social tools (TikTok/IG/Threads/FB) | 0.6 |
| DMCA takedown helper | 0.4 |
| Per-reader watermarked content | 0.4 |
| Curated lists / Featured Author application | 0.4 |

### Reader — Phase 2

| Feature | Score |
|---|---|
| Personalized homepage (algorithmic) | 0.6 |
| Curated lists ("Top 10 Cinta Islami this month") | 0.5 |
| Follow specific genres / tags | 0.4 |
| Offline reading (download chapters) | 0.4 |
| Bookmarks | 0.5 |
| Free trial for new subscribers (7-day) | 0.5 |
| Promo codes / vouchers | 0.4 |
| Tip favourite authors | 0.5 |
| Reader profile (public reading list, reviews) | 0.5 |
| Reading streaks + daily reminders | 0.4 |
| Review helpfulness voting | 0.4 |
| Parental control mode | 0.4 |
| Hide spoilers in comments (collapsible) | 0.4 |

### Admin — Phase 2

| Feature | Score |
|---|---|
| Manual promotion tools (boost, featured slots) | 0.6 |
| Push notification scheduler | 0.5 |
| Email newsletter management | 0.4 |
| Editorial calendar | 0.4 |
| Bulk messaging (email, in-app, push) | 0.4 |
| Fraud detection (fake reads, bots, payment) | 0.6 |
| SST / tax calculation & reporting | 0.6 |
| Subscription churn analysis | 0.4 |
| Funnel analysis (signup → first read → first purchase) | 0.4 |
| Cohort analysis | 0.4 |
| Reading behaviour analytics | 0.4 |
| Author growth metrics | 0.4 |
| Strike system + appeal process | 0.5 |
| Chargeback management | 0.5 |
| Bug report tracker | 0.5 |
| Feature flag system | 0.5 |
| In-app chat support | 0.4 |
| Geo-IP analytics | 0.4 |

---

## 9. Phase 3 — Scale & Differentiation (Score 0.2 – 0.3)

**Definition of done:** local moat is real, B2B revenue lines exist, advanced ops/automation in place.

### Author — Phase 3

| Feature | Score |
|---|---|
| Offline writing mode (desktop) | 0.3 |
| Co-author support with revenue split agreements | 0.2 |
| Import from Word / Google Docs / Wattpad backup | 0.3 |
| Tax document generator (CP58 / LHDN) | 0.3 |
| Goal tracker | 0.2 |
| Peak reading hours heatmap | 0.2 |
| Story performance comparison | 0.3 |
| Follower management + DM top fans | 0.3 |
| Milestone notifications | 0.3 |
| Predicted earnings calculator | 0.2 |
| Trailer / teaser creator | 0.1 *(borderline P4)* |
| Cross-promote with other authors | 0.2 |
| Featured Author placement workflow | 0.3 |
| Plagiarism scanner | 0.2 |
| Original ownership certificate | 0.3 |
| Screenshot blocker (Android) / alert (iOS) | 0.2 |

### Reader — Phase 3

| Feature | Score |
|---|---|
| "Other readers like you" recommendations | 0.3 |
| Random discovery ("Surprise me") | 0.2 |
| Page-flip reading mode | 0.3 |
| Personal notes per chapter | 0.3 |
| Highlights | 0.3 |
| Gift subscriptions | 0.3 |
| Per-paragraph inline comments | 0.3 |
| Share quotes as image cards | 0.3 |
| Friend / follow other readers | 0.3 |
| Badges and achievements | 0.2 |
| Reading challenges | 0.2 |

### Admin — Phase 3

| Feature | Score |
|---|---|
| KYC / AML for high-earning authors | 0.3 *(could escalate if LHDN pressure)* |
| Auto-detection (plagiarism, AI-generated, spam) | 0.3 |
| Content categorization tools | 0.3 |
| DMCA / copyright takedown management | 0.3 |
| Banner / ad management | 0.3 |
| Seasonal campaigns (Ramadan, Merdeka) | 0.3 |
| App version control + force-update | 0.3 |
| Suspicious activity alerts | 0.3 |
| Bot / scraper detection | 0.3 |
| Revenue forecasting | 0.3 |
| Heatmaps for app usage | 0.2 |
| A/B testing framework | 0.2 |
| Merge duplicate accounts | 0.2 |
| Affiliate program management | 0.2 |
| API access management | 0.3 |
| Live chat for premium authors | 0.2 |
| Feature request voting | 0.3 |

---

## 10. Phase 4 — Future / Optional (Score 0.0 – 0.1)

These earn a slot only after a Phase 0–3 metric demands it. Don't pre-build.

| Feature | Score | Trigger to revisit |
|---|---|---|
| AI writing assistant (brainstorm/grammar only) | 0.2 | If author churn cites "stuck writing" |
| Audiobook AI Malay narration | 0.1 | If TTS reading > 10% of sessions |
| Family plan (3–5 users) | 0.2 | If subscriber ARPU plateaus |
| Reading clubs / book communities | 0.2 | If comments engagement saturates |
| Auto-scroll mode | 0.2 | If session length > 30 min average |
| Text-to-speech (Bahasa Melayu voice) | 0.2 | Same as audiobook |
| Translation hover (Malay ↔ English) | 0.2 | If English-learner segment shows up |
| Reading speed tracker | 0.2 | If users ask |
| Author forum / Discord-like space | 0.2 | If author Discord grows organic |
| Writing courses & masterclasses | 0.1 | After top-100 authors exist |
| Mentor matching | 0.1 | Same |
| Monthly writing challenges | 0.2 | Cheap marketing — can pull forward |
| Editorial team line (invited authors) | 0.2 | After verified-author tier |
| Publisher pipeline (Karangkraf, Fixi, Lejen) | 0.2 | B2B sales motion |
| Pirate URL monitoring | 0.2 | If piracy reports > N/month |
| Watermark tracker | 0.2 | If leaked content traced |
| Discovery Fund management | 0.2 | After break-even |
| Brand partnership management | 0.2 | After verified-author tier |
| Publisher partner portal | 0.2 | B2B sales motion |

---

## 11. Phase Milestones

| Milestone | Phase | Definition of done |
|---|---|---|
| **M0 — Foundations** | infra | Monorepo, Docker compose, Supabase + Redis up, auth wired, shared types |
| **M1 — Author MVP** | P0 | Author signup → write → publish chapter (free + locked) → see earnings stub |
| **M2 — Reader MVP** | P0 | Reader signup → discover → read free → coin top-up → unlock locked → follow author |
| **M3 — Monetization MVP** | P0 | Payments live (FPX/DuitNow/TnG/card), subs, payouts |
| **M4 — Admin MVP** | P0 | Suspend, flag queue, revenue dashboard, payout approvals |
| **M5 — Trust & Moderation** | P1 | Reviews, content warnings, age-gating, religious filter, verification |
| **M6 — Engagement** | P1/P2 | Comments per chapter, personalized homepage, push, retention rails |
| **M7 — Local Compliance** | P2/P3 | SST reporting, CP58 generator, KYC for high-earners |
| **M8 — Differentiation** | P3 | Co-author splits, anti-piracy, B2B publisher portal |

---

## 12. Data Model (initial sketch)

`users`, `author_profiles`, `reader_profiles`, `stories`, `chapters` (was `pages`), `reads`, `follows`, `subscriptions`, `coin_purchases`, `chapter_unlocks`, `wallets`, `payouts`, `reviews`, `votes`, `comments`, `reports`, `notifications`. Final schema lives in Supabase migrations.

## 13. Open Questions

- **Coin economics:** fixed RM↔coin rate or dynamic? Author cut percentage? (Wattpad-style: 70/30 author/platform? Tip 100% to author less fees?)
- **Subscription model:** per-author tiers (creator-set) vs platform-wide flat sub?
- **Desktop:** Electron vs Tauri? (Tauri = smaller bundle, Rust toolchain; Electron = team familiarity.)
- **Payment processor for self-hosters:** Stripe-first, or pluggable adapter for Billplz / iPay88 / Curlec from day 1?
- **Religious sensitivity filter:** rule-based (keyword + category lists) or ML-assisted? Who owns the ruleset?
- **Self-hosted Sentry / monitoring:** GlitchTip vs Sentry OSS vs Highlight?
- **PDPA / data residency:** is Supabase storage in MY required, or is SG/SEA acceptable?
