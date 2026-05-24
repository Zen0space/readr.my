---
name: desktop
description: Conventions for the @auror/desktop package — Tauri v2, Jotai state, typed IPC, no `as any`, minimal capabilities.
---

# desktop skill

Rules for working inside `packages/desktop`. The desktop app is the author-focused wrapper: writing canvas, drafts, offline-first authoring. **Tauri v2, not Electron** — decision is final for this project.

## Why Tauri (not Electron)

- Bundle size: ~10MB vs Electron's ~150MB.
- Memory: uses the OS webview, not a bundled Chromium.
- Security: capability-based permissions, not "everything by default."
- Native side is Rust — small, fast, type-checked.

If you ever find yourself wanting an Electron API, find the Tauri equivalent first. Don't try to make Tauri behave like Electron.

## Workspace

- This is a **pnpm monorepo** package. Use `pnpm add <pkg> --filter @auror/desktop`.
- Cross-package deps use `workspace:*` (e.g. `"@auror/shared": "workspace:*"`).
- Frontend code in `src/`, Rust code in `src-tauri/`.
- `src-tauri/target/` and `src-tauri/gen/` are git-ignored.

## Project structure

```
packages/desktop/
├── src/                    # React + Jotai frontend (reuses webapp components where practical)
│   ├── atoms/              # Jotai atoms live close to features
│   ├── ipc/                # Typed wrappers around `invoke`
│   └── App.tsx
├── src-tauri/
│   ├── src/                # Rust commands
│   ├── capabilities/       # Permission JSON files
│   ├── tauri.conf.json
│   └── Cargo.toml
└── package.json
```

## State management

- **Use Jotai.** Same conventions as the webapp skill — atoms live next to the feature, not in a global store dump.
- For data crossing the IPC boundary (Rust ↔ frontend), wrap the `invoke` call in a typed function in `src/ipc/` and feed the result into an atom. Components read the atom, never call `invoke` directly.
- **`useEffect` is a last resort.** Same rules as webapp:
  - Derivable state → compute during render.
  - User events → put the logic in the handler.
  - Subscribe to Tauri events → use `useSyncExternalStore` or a Jotai atom with `onMount`.
  - Reset on prop change → `key`.
  - Sync with the Rust side → typed IPC wrapper + atom, not a manual `useEffect` chain.

## IPC: typing rule (the big one)

`invoke()` returns `Promise<unknown>` by default. Casting that with `as any` is the easiest way to break everything silently when Rust changes.

**Rules:**
1. Every Tauri command has a typed TS wrapper in `src/ipc/<feature>.ts`.
2. The wrapper uses `invoke<T>()` with an explicit return generic.
3. The argument and return types live in `@auror/shared` if they cross other packages; otherwise local to `src/ipc/`.
4. Prefer `tauri-specta` to auto-generate bindings from Rust — eliminates drift by construction.
5. **Never** use `as any`, `as unknown as T`, or `@ts-ignore` to silence IPC type errors. If the type is wrong, fix it at the Rust side or in the binding.

Example (manual binding):

```ts
// src/ipc/drafts.ts
import { invoke } from '@tauri-apps/api/core'
import type { Draft, DraftId } from '@auror/shared'

export const loadDraft = (id: DraftId): Promise<Draft> =>
  invoke<Draft>('load_draft', { id })

export const saveDraft = (draft: Draft): Promise<void> =>
  invoke<void>('save_draft', { draft })
```

Then a Jotai atom layers on top:

```ts
// src/atoms/draft.ts
import { atom } from 'jotai'
import { atomWithDefault } from 'jotai/utils'
import { loadDraft } from '../ipc/drafts'
import type { DraftId } from '@auror/shared'

export const currentDraftIdAtom = atom<DraftId | null>(null)
export const currentDraftAtom = atomWithDefault(async (get) => {
  const id = get(currentDraftIdAtom)
  return id ? await loadDraft(id) : null
})
```

## Capabilities (security)

Tauri v2 uses **capabilities** — JSON files that declare which Tauri APIs the frontend can call. Default is *deny*.

- Only enable the capabilities you actually use. No `"core:default"` blanket grants in production builds.
- Each capability file in `src-tauri/capabilities/` should be scoped to a window and a feature.
- File system access: enumerate exact paths. Never grant `fs:default` or `**` glob unless the feature genuinely needs it.
- Don't enable `shell:execute` unless you've justified it in writing (PR description).

## Plugins vs custom commands

- For common needs (fs, dialog, store, notification, updater, window-state, deep-link, autostart), **use the official Tauri plugin** — don't reimplement.
- Write a custom Rust `#[command]` only when no plugin fits, or when business logic must run with system privileges.

## Offline-first authoring (the main use case)

The desktop app is the offline-writing surface (PRD §9, P3). The model:

- Local store of drafts (SQLite via `tauri-plugin-sql` or a single Rust-side store).
- Sync engine: typed commands `sync_pull`, `sync_push`, with last-write-wins for v1 (document the limitation).
- Background sync timer lives in Rust (not a JS `setInterval`).
- Frontend reads/writes via Jotai atoms wired to typed IPC.

## TypeScript

- **No `as any`.** Same rule as the webapp skill — see `[[webapp]]`.
- `// @ts-ignore` / `// @ts-expect-error` are banned unless paired with a comment explaining the upstream issue and a link.
- Tauri's own types are good — if something is missing, augment the module, don't cast.

## Rust

- Keep commands small. Heavy logic belongs in plain Rust modules; `#[command]` functions are thin wrappers.
- Errors: return `Result<T, String>` for v1 simplicity — graduate to a typed error enum when surface area grows.
- Don't `unwrap()` in commands. Propagate with `?`.
- `cargo fmt` + `cargo clippy -- -D warnings` clean before PR.

## Solution shape

- **Simplest solution that meets industry standards.** Same rule as webapp.
- Don't build a plugin system, theming engine, or mod loader because "the desktop app might want one." It won't. Not in this product.
- Three similar Rust commands beats a generic command-dispatcher abstraction.
- Reuse webapp components via `@auror/shared` or by importing from `@auror/webapp`. Don't fork UI.

## Build & release

- `pnpm --filter @auror/desktop tauri dev` for local dev.
- `pnpm --filter @auror/desktop tauri build` for prod bundles.
- Code signing: macOS notarization + Windows code signing required before any public release. Track signing keys outside the repo.
- Auto-updater: use `tauri-plugin-updater` with signed manifests. Don't roll your own.

## Quick checklist before opening a PR

- [ ] No `as any`, no `@ts-ignore`, no `as unknown as T` on IPC.
- [ ] Every `invoke()` call goes through a typed wrapper in `src/ipc/`.
- [ ] State lives in Jotai atoms; components don't call `invoke` directly.
- [ ] No new `useEffect` for derivable state, event responses, or sync-with-Rust.
- [ ] Capabilities are scoped — no blanket `*` or default grants added.
- [ ] Used an official Tauri plugin if one exists for the need.
- [ ] `cargo clippy -- -D warnings` clean.
- [ ] `pnpm --filter @auror/desktop typecheck` passes.

## Related

- `[[webapp]]` — frontend conventions (Jotai, no `as any`, useEffect last resort) all apply here too.
