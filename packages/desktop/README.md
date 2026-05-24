# @readr/desktop

Tauri v2 desktop app for **authors** — write, autosave, publish, track earnings. Talks to the existing `packages/backend` HTTP API (`/v1/...`) over `fetch`. No frontend for readers; that lives in `packages/webapp` (separate track).

## Prerequisites

- Rust toolchain (`rustup`) with `cargo` on PATH.
- Platform deps: see https://v2.tauri.app/start/prerequisites/
- Node ≥ 20, pnpm ≥ 9 (handled by the monorepo).
- The backend (`pnpm --filter @readr/backend dev`) and local Supabase running.

## Layout

```
src/                 # React + Jotai webview
  api/               # HTTP wrappers (reuse @readr/shared/errors)
  atoms/             # Jotai state (close to features)
  components/        # UI primitives
  ipc/               # Typed wrappers around Tauri `invoke` (empty in Phase 0)
  routes/            # @tanstack/react-router screens
src-tauri/           # Rust + tauri.conf.json + capabilities
```

## Dev

```bash
cp .env.example .env   # then fill VITE_SUPABASE_ANON_KEY from local supabase status
pnpm --filter @readr/desktop tauri dev
```

This launches Vite (port 1420) and the Tauri shell against it.

## Build (dev-only in Phase 0)

```bash
pnpm --filter @readr/desktop tauri build
```

> Code signing / notarization keys are **not** in scope for Phase 0. Public release builds are gated on D1.1 (auto-updater + signing pipeline).

## Conventions

See `.claude/skills/desktop/SKILLS.md`. Short version:

- **No** `as any`, `@ts-ignore`, or `as unknown as T` on IPC boundaries.
- Every `invoke()` call goes through a typed wrapper in `src/ipc/`.
- State lives in Jotai atoms; components don't call `invoke` directly.
- Capabilities are scoped per-window (`src-tauri/capabilities/main.json`). No blanket `**` grants.
- Custom Rust `#[command]`s only when no plugin fits — currently none (Phase 0 is HTTP-only).
