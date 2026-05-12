# Dev Phase 3 — *Bersinar* (Scale & Differentiation)

> **Codename:** Bersinar ("shine")
> **Phase scope:** PRD §9 — features scored 0.2–0.3
> **Goal:** Malaysian moat (CP58, KYC, partnerships, anti-piracy), advanced ops (A/B testing, forecasting), and reader/author depth features (co-author splits, page-flip, highlights, gift subs).

## Team

| Track | PIC |
|---|---|
| Backend / Infra | **Khairul** |
| Frontend (complex) | **Khairul** |
| Frontend (standard) | **Ajwad** |

---

## Backend Track — Khairul

### B3.1 — Co-Author Revenue Split
- [ ] `story_collaborators` (story_id, user_id, split_pct, role)
- [ ] Earnings distribution honours splits at every coin/sub/tip event
- [ ] Audit trail for split changes

### B3.2 — Import Pipelines
- [ ] Word (.docx) → markdown via Mammoth/Pandoc
- [ ] Google Docs (OAuth + Drive API export)
- [ ] Wattpad backup (HTML/ZIP parser)

### B3.3 — CP58 / LHDN Tax Generator
- [ ] Annual earnings rollup per author
- [ ] PDF generation matching LHDN CP58 format
- [ ] Bulk export for admin

### B3.4 — KYC / AML
- [ ] Triggered when author lifetime earnings cross threshold (e.g. RM10k)
- [ ] Document upload + identity verification flow
- [ ] Optional 3rd-party (Onfido / local equivalent) adapter

### B3.5 — Plagiarism Scanner
- [ ] Hash-based near-duplicate detection across platform
- [ ] Optional external API for cross-web check

### B3.6 — A/B Testing Framework
- [ ] Experiment config table; assignment via stable user-hash
- [ ] Event ingestion + statistical summary
- [ ] Server-side flagging (no client-side flicker)

### B3.7 — DMCA Case Management
- [ ] Case workflow with deadlines, evidence attachments, counter-notice handling

### B3.8 — App Version Control / Force-Update
- [ ] Minimum-supported-version endpoint
- [ ] Webapp + desktop honour it (force reload / blocking modal)

### B3.9 — Bot / Scraper Detection
- [ ] Request fingerprinting (UA, TLS, behavioural)
- [ ] Auto-challenge (Turnstile / hCaptcha) for suspicious traffic

### B3.10 — Revenue Forecasting
- [ ] Simple time-series projection (last 90 days → next 30)
- [ ] Per-author and platform-wide

### B3.11 — API Access Management
- [ ] API keys with scopes + rate limits
- [ ] Per-key analytics

### B3.12 — Affiliate Program
- [ ] Affiliate codes, attribution window, commission ledger

### B3.13 — Anti-Piracy Watermarking
- [ ] Per-reader invisible watermark on rendered chapter HTML/PDF
- [ ] Tracker resolves leaked content back to user

---

## Frontend Track — Khairul (Complex)

### F3.K1 — Co-Author Split Agreement UI *(Khairul)*
**Why Khairul:** multi-party state machine, legal-ish, all-parties-sign flow.

### F3.K2 — Import Wizard *(Khairul)*
**Why Khairul:** file parsing, field mapping, chapter-split heuristics, preview/edit before commit.

### F3.K3 — KYC Document Review Queue *(Khairul)*

### F3.K4 — Plagiarism Scanner Results UI *(Khairul)*
- Side-by-side diff of suspected passages

### F3.K5 — A/B Testing Dashboard *(Khairul)*
- Experiment config, live metrics, significance indicator

### F3.K6 — Heatmaps Display *(Khairul)*
- Page-level click/scroll heatmap viewer

### F3.K7 — Offline Writing — Desktop *(Khairul)*
**Why Khairul:** Tauri/Electron + local SQLite + sync engine + conflict resolution.

### F3.K8 — Revenue Forecasting Charts *(Khairul)*

### F3.K9 — Trailer / Teaser Creator *(Khairul)*
**Why Khairul:** canvas compositing, video/GIF export. Bumped up from Ajwad.

### F3.K10 — Per-Paragraph Inline Comments *(Khairul)*
**Why Khairul:** text-range anchoring, comment positioning, scroll-sync. Hard.

### F3.K11 — Highlights *(Khairul)*
**Why Khairul:** text-selection anchors that survive content edits.

### F3.K12 — DMCA Case Workflow UI *(Khairul)*

### F3.K13 — Bot Detection Ops UI *(Khairul)*

---

## Frontend Track — Ajwad (Standard)

### F3.A1 — Goal Tracker (Author)
- Monthly earning goal input + progress bar

### F3.A2 — Peak Reading Hours Display
- Read-only heatmap consuming backend aggregate (chart lib)

### F3.A3 — Story Performance Comparison
- Side-by-side table of two stories' metrics

### F3.A4 — Follower Management + DM Top Fans
- Followers list with sort by engagement
- 1-to-1 DM UI (uses backend messaging primitive)

### F3.A5 — Milestone Notifications Inbox
- "10 fans completed your book today" feed

### F3.A6 — Predicted Earnings Calculator (Author)
- Form: posting cadence → projected RM/month (from B3.10)

### F3.A7 — Cross-Promote Collab Badges
- Display badge on story card if collab with another author

### F3.A8 — Featured Author Placement Workflow (Admin)
- Drag-and-drop ordering of featured slots

### F3.A9 — Banner / Ad Management (Admin)
- CRUD for promotional banners with date range

### F3.A10 — Seasonal Campaign Templates
- Ramadan / Merdeka / Hari Raya themed page templates

### F3.A11 — Page-Flip Reading Mode
- CSS transform animation; Jotai atom toggle between scroll/flip

### F3.A12 — Personal Notes per Chapter
- Private notes panel; chapter-anchored

### F3.A13 — Gift Subscription Form
- Recipient (email/username) + tier + message

### F3.A14 — Share Quotes as Image Cards
- Lib-rendered template; Ajwad supplies copy + CSS (export logic shared from F3.K9)

### F3.A15 — Friend / Follow Other Readers
- Same pattern as follow-author; new entity table mostly backend

### F3.A16 — Badges Display
- Grid on profile; tooltip with criteria

### F3.A17 — Reading Challenges
- "Read 5 Malay novels this month" tracker

### F3.A18 — Affiliate Program UI
- Affiliate dashboard: code, clicks, conversions, payout

### F3.A19 — API Access Management UI
- Create key, set scopes, view usage

### F3.A20 — Live Chat for Premium Authors
- Integrate with chosen chat widget (Crisp / self-hosted Chatwoot)

### F3.A21 — Feature Request Voting
- List + upvote; one vote per user

### F3.A22 — Account Recovery / Merge Duplicates (Admin)
- Simple two-account picker + confirm

### F3.A23 — Screenshot Blocker (Android) / Alert (iOS)
- Webview-level flag in desktop/mobile wrapper; web tooling is best-effort

### F3.A24 — Original Ownership Certificate
- PDF download from server-generated timestamped attestation (UI = button + status)

---

## Definition of Done — Phase 3

1. Two co-authors co-publish a story; earnings split correctly across coins, subs, tips.
2. Author imports a Wattpad backup → chapters land as drafts → reviews → publishes.
3. High-earning author hits RM10k → KYC modal blocks further payouts until verified.
4. Admin runs an A/B test on homepage layout → significance reported within UI.
5. Author downloads CP58 PDF for the previous tax year.
6. Leaked chapter is watermark-traced back to the originating reader account.

## Risks

- **CP58 format compliance** is regulator-driven; budget rework if LHDN changes templates.
- **KYC vendor selection** has procurement + cost implications — start vendor evaluation in P2.
- **Watermarking + bot detection** are arms races. Ship as deterrents; don't promise unbreakable.
- Ajwad's task list is long but mostly CRUD/list patterns — bundle into sprint themes (creator depth → admin curation → reader social).
