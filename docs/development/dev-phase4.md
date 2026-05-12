# Dev Phase 4 — *Warisan* (Future / Optional)

> **Codename:** Warisan ("legacy")
> **Phase scope:** PRD §10 — features scored 0.0–0.1
> **Rule:** *nothing* in this phase is built until a Phase 0–3 metric earns it. Listed here so the team has a backlog, not a roadmap.

## Team

Same team. Engagement model is **opportunistic** — pick one item per quarter, spike it, measure, kill or keep.

| Track | PIC |
|---|---|
| Backend / Infra | **Khairul** |
| Frontend (complex) | **Khairul** |
| Frontend (standard) | **Ajwad** |

---

## Backlog (sorted by likely-pull-forward order)

### AI Writing Assistant *(brainstorm/grammar only — never auto-write)*
- **Trigger:** author churn surveys cite "stuck writing" as top reason
- **Backend (Khairul):** Claude API integration (per `claude-api` skill), strict prompt-caching, no full-draft generation, user opt-in
- **Frontend (Khairul):** inline suggestion UI inside editor

### Audiobook AI Malay Narration
- **Trigger:** TTS reader usage > 10% of sessions
- **Backend (Khairul):** TTS pipeline (ElevenLabs MY voice or local model), per-chapter audio cache
- **Frontend (Khairul):** audio player + sync to reading position

### Text-to-Speech (Bahasa Melayu Voice) — Reader-side
- Subset of audiobook above; in-browser SpeechSynthesis fallback first
- **Frontend (Ajwad):** play/pause/speed controls

### Family Plan (3–5 Users)
- **Trigger:** subscriber ARPU plateaus
- **Backend (Khairul):** group subscription model, invite flow, seat management
- **Frontend (Ajwad):** plan management UI; invites

### Reading Clubs / Book Communities
- **Trigger:** comment engagement saturates; readers ask
- **Backend (Khairul):** group entity, membership, threaded discussion
- **Frontend (Khairul):** community feed UI (complex due to threading + moderation)

### Auto-Scroll Mode
- **Trigger:** session length > 30 min average
- **Frontend (Ajwad):** speed slider, pause-on-tap

### Translation Hover (Malay ↔ English)
- **Trigger:** English-learner segment shows in demographics
- **Backend (Khairul):** translation API proxy + cache
- **Frontend (Ajwad):** hover/tap word → tooltip

### Reading Speed Tracker
- **Trigger:** users ask
- **Backend:** existing read events suffice
- **Frontend (Ajwad):** WPM stat on reader dashboard

### Author Forum / Discord-Like Space
- **Trigger:** author Discord grows organically
- **Decision:** likely *don't build* — point at existing Discord with bot-bridged announcements instead

### Writing Courses & Masterclasses
- **Trigger:** top-100 authors exist
- **Backend (Khairul):** course entity, enrollment, payment
- **Frontend (Ajwad):** course list, lesson player

### Mentor Matching
- **Trigger:** after verified-author tier critical mass
- **Frontend (Ajwad):** opt-in form, matching admin queue

### Monthly Writing Challenges + Prizes
- **Trigger:** cheap marketing — can pull forward to P2/P3 if growth team asks
- **Backend (Khairul):** challenge entity, submissions, judging
- **Frontend (Ajwad):** challenge page, leaderboard

### Editorial Team Line (Invited Authors)
- **Trigger:** verified-author tier exists
- **Frontend (Ajwad):** dedicated inbox UI for editorial channel

### Publisher Pipeline (Karangkraf, Fixi, Lejen)
- **Trigger:** B2B sales motion exists
- **Backend (Khairul):** publisher portal entity + access scopes
- **Frontend (Khairul):** publisher dashboard with author/story drill-down

### Pirate URL Monitoring
- **Trigger:** piracy reports > N/month
- **Backend (Khairul):** scraper crawling Telegram/Google Drive/known pirate sites; outside scope of basic ops

### Watermark Tracker
- **Trigger:** leaked content traced (covered in P3 B3.13)
- This entry = the *user-facing* leak-trace UI if pulled forward

### Discovery Fund Management
- **Trigger:** platform break-even
- **Backend (Khairul):** rule engine for distributing a fund pool to under-discovered authors
- **Frontend (Khairul):** transparency report UI

### Brand Partnership Management
- **Trigger:** verified-author tier exists
- **Backend (Khairul):** sponsored-story entity + disclosure UI
- **Frontend (Ajwad):** brand dashboard, author opt-in

### Publisher Partner Portal
- See Publisher Pipeline above (same project)

---

## Working Model for Phase 4

1. Pick one item per quarter based on a clear metric trigger.
2. Spike for 1 sprint: prototype + measure.
3. Decision gate: kill, ship behind feature flag, or promote to P2/P3 backlog.
4. No item gets built "because it would be cool" — every build needs a metric tied to PRD goals.

## Risks

- **Scope creep magnet.** This file's purpose is to *prevent* P4 items from being smuggled into P0–P3 sprints. Discipline > completeness.
- **AI features in particular** need a written editorial policy before any user-facing build, given the "never auto-write" stance.
