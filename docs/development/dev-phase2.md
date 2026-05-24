# Dev Phase 2 — *Tumbuh* (Engagement & Growth)

> **Codename:** Tumbuh ("grow")
> **Phase scope:** PRD §8 — features scored 0.4–0.6
> **Goal:** retention compounds. Discovery is personalized, monetization expands (tips, promo codes, free trials, bookmarks), and ops gets leverage (push, newsletters, fraud detection, churn).

## Team

| Track | PIC |
|---|---|
| Backend / Infra | **Khairul** |
| Frontend (complex) | **Khairul** |
| Desktop / Tauri | **Khairul** |
| Frontend (standard) | **Ajwad** |

---

## Backend Track — Khairul

### B2.1 — Scheduled Publishing
- [ ] Chapter `publish_at` field + cron worker (BullMQ delayed jobs)
- [ ] Reschedule + cancel endpoints

### B2.2 — Tip Jar
- [ ] `tips` table; one-shot coin send → author wallet
- [ ] Optional custom thank-you message

### B2.3 — Spell-Check / Grammar (Bahasa)
- [ ] Evaluate options: LanguageTool self-hosted, or commercial API
- [ ] Backend proxy with rate limits

### B2.4 — Reader Demographics
- [ ] Aggregate per-author: age buckets (from DOB), country (from IP, fuzzed), device class
- [ ] Privacy-respecting; never expose individual readers

### B2.5 — Reading Retention Analytics
- [ ] Track chapter read events with progress %
- [ ] Drop-off curve per story

### B2.6 — Personalized Homepage
- [ ] Start simple: content-based (genre + tag affinity from history)
- [ ] Cache per-user feed in Redis; refresh on read events
- [ ] Defer collaborative filtering to P3

### B2.7 — Push Notifications
- [ ] Web Push (VAPID); FCM-compatible payload for future mobile
- [ ] Subscription management + per-event preferences

### B2.8 — Email Newsletter
- [ ] Transactional + broadcast send via Postmark / Resend / self-hosted SMTP
- [ ] Unsubscribe handling + suppression list

### B2.9 — Fraud Detection
- [ ] Rule engine: anomalous read velocity (bot reads inflating earnings), payment fraud signals
- [ ] Flag → admin review (no auto-action in P2)

### B2.10 — SST / Tax Reporting
- [ ] SST calc on platform fees
- [ ] Monthly export for accountant

### B2.11 — Churn & Cohort Analytics
- [ ] Subscription churn rate, gross/net MRR
- [ ] Cohort retention table (signup-month × month-N retention)
- [ ] Funnel: signup → first read → first purchase

### B2.12 — Promo Codes
- [ ] `promo_codes` (code, type, value, redemption_limit, expires_at)
- [ ] Apply at coin top-up or sub checkout

### B2.13 — Free Trial Subscriptions
- [ ] 7-day trial state on subscription record
- [ ] Auto-convert or expire; reminder email before charge

### B2.14 — Bookmarks
- [ ] `bookmarks` (user_id, chapter_id, position, created_at)

---

## Frontend Track — Khairul (Complex)

### F2.K1 — Cover Designer with Templates *(Khairul)*
**Why Khairul:** canvas/SVG compositing, font rendering, export to PNG.

### F2.K2 — Personalized Homepage Renderer *(Khairul)*
**Why Khairul:** dynamic rails, click-through feedback loop into atom-driven preferences, lazy-load.

### F2.K3 — Reading Retention Chart *(Khairul)*
- Line/area chart per story showing % readers remaining per chapter

### F2.K4 — Reader Demographics Dashboard *(Khairul)*
- Stacked bars + pie; charting + privacy-safe rendering

### F2.K5 — Offline Reading *(Khairul)*
**Why Khairul:** Service Worker + IndexedDB + cache invalidation. Genuinely hard.
- Download chapter → cache HTML+assets → read offline → sync progress on reconnect

### F2.K6 — Fraud Detection Ops UI *(Khairul)*
- Suspicious-activity list, drill-down, action buttons (suspend, refund, dismiss)

### F2.K7 — Funnel / Cohort Analytics UI *(Khairul)*
- Cohort grid heatmap, funnel waterfall

### F2.K8 — Push Notification Scheduler *(Khairul)*
- Compose, segment (by role/genre/cohort), schedule, preview

---

## Desktop Track — Khairul

### D2.1 — Cover Designer with Templates
**Mirrors:** F2.K1.
- [ ] Canvas/SVG compositing inside the webview
- [ ] Export to PNG; upload to Supabase Storage signed URL
- [ ] Template gallery + colour/text overrides

### D2.2 — Scheduled Publishing UI
**Mirrors:** F2.A1.
- [ ] Datetime picker on the publish action
- [ ] "Scheduled" badge in the chapter list with cancel/reschedule

### D2.3 — Tip Jar Setup
**Mirrors:** F2.A2.
- [ ] Author profile toggle + custom thank-you message field

### D2.4 — Inline Spell-Check
**Mirrors:** F2.A3.
- [ ] Native OS webview spell-check enabled on the editor surface
- [ ] Custom dictionary in `tauri-plugin-store` for author-specific terms

### D2.5 — Share-to-Social
**Mirrors:** F2.A4.
- [ ] `tauri-plugin-shell` opens share URLs in external browser (TikTok, IG, Threads, FB)
- [ ] Pre-fill OG-tag URLs from backend

### D2.6 — DMCA Takedown Form
**Mirrors:** F2.A5.
- [ ] Author-side report form → backend ticket pipeline (B1.8)

### D2.7 — Native Desktop Notifications
- [ ] `tauri-plugin-notification` for new reviews, payout state, scheduled-publish success
- [ ] Mirrors the *subscriber side* of F2.K8 only — desktop receives, never schedules sends

### F2.A1 — Scheduled Publishing UI
- Datetime picker on publish; "Scheduled" badge on chapter list
- Cancel/reschedule actions

### F2.A2 — Tip Jar Setup
- Toggle on author profile; thank-you message field
- Reader-side "Tip Author" button (opens coin spend confirm)

### F2.A3 — Spell-Check Inline
- Library-provided UI; integrate with editor at hook points provided by Khairul

### F2.A4 — Share-to-Social Buttons
- TikTok, Instagram, Threads, Facebook
- Generate shareable URL + OG tags

### F2.A5 — DMCA Takedown Form
- Author-side form to report pirated copy
- Generates ticket via B1.8 pipeline

### F2.A6 — Curated Lists (Admin + Public)
- Admin: create list, add stories, schedule
- Reader: render list as rail or detail page

### F2.A7 — Featured Author Application
- Simple form + status display

### F2.A8 — Free Trial UX
- Trial countdown banner
- Pre-charge reminder UI

### F2.A9 — Promo Code Redemption
- Input at checkout
- Show applied discount; clear error messaging

### F2.A10 — Bookmarks UI
- Bookmark icon on reading view
- "My Bookmarks" page

### F2.A11 — Reader Profile (Public)
- Reading list, reviews, badges (badges land in P3)

### F2.A12 — Reading Streaks Display
- Daily streak counter on dashboard
- "Don't break the chain" reminder banner

### F2.A13 — Review Helpfulness Voting
- 👍/👎 on each review; aggregate score

### F2.A14 — Parental Control Toggles
- Settings page section; locks behind PIN

### F2.A15 — Spoiler-Hide UI
- "Mark as spoiler" on comments; collapsible

### F2.A16 — Email Newsletter Compose (Admin)
- Template selector + variable preview
- Send test → send broadcast

### F2.A17 — Editorial Calendar (Admin)
- Month/week grid of scheduled promotions

### F2.A18 — Bulk Messaging Compose (Admin)
- Segment selector + channel (email / in-app / push) + body

---

## Definition of Done — Phase 2

1. Author schedules a chapter for next Friday 8pm → publishes on schedule → followers get push.
2. Reader applies a 20% promo code → top-up checkout reflects discount.
3. Reader downloads a story → goes offline → reads → reconnects → progress synced.
4. Admin sees a cohort heatmap and identifies a leaky retention week.
5. Author sees a drop-off chart and identifies chapter 3 as a quit point.
6. Fraud rule flags a suspicious account → admin suspends from ops UI.

## Risks

- **Personalized feed quality** is a long tail. Ship "good enough" content-based and iterate; don't block P2 on perfect ranking.
- **Offline reading** is the single hardest task of P2. Timebox to 2 sprints; if not done, descope and revisit in P3.
- **Email deliverability** is a separate ops problem. Decide self-hosted SMTP vs Postmark/Resend in week 1.
