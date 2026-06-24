---
name: frontend
description: Conventions shared by the @auror/reader, @auror/author, and @auror/admin Next.js packages — workspace, typing, state management, and solution simplicity.
---

# frontend skill

Rules for working inside any of the per-role frontend packages:
- `packages/reader` (apex, `auror.my`)
- `packages/author` (`author.auror.my`)
- `packages/admin` (`admin.auror.my`)

These packages are siblings under the per-role split (Phase B–D of
`docs/development/dev-frontend-split.md`). The pre-split monolith was
deleted in Phase E. Each frontend package:

- Ships its own `app/(role)/` pages + `app/(auth)/{login,register}` + `app/api/auth/*`
- Carries the same apex-cookie config (`Domain=.auror.my` via `NEXT_PUBLIC_COOKIE_DOMAIN`)
- Mirrors the `/api/v1/:path*` → `http://backend:4000/v1/:path*` rewrite in `next.config.mjs`
- Gates its own role via `middleware.ts` (reader: any authed; author: `author|admin`; admin: `admin` only)

## Workspace

- This is a **pnpm monorepo**. Always use `pnpm` — never `npm` or `yarn`.
- Add deps with `pnpm add <pkg> --filter @auror/<role>` (where `<role>` is `reader|author|admin`).
- Cross-package deps use `workspace:*` (e.g. `"@auror/shared": "workspace:*"`).
- Run scripts from repo root with `pnpm --filter @auror/<role> <script>` or `pnpm -r <script>` for all packages.
- **Cross-package imports are forbidden.** A frontend package can only import from `@auror/shared`. Never `import ... from '@auror/reader'` in `@auror/author`, and so on. If two packages need the same component, lift it into `@auror/shared` first.

## TypeScript

- **Never use `as any`.** Not in production code, not in tests, not "temporarily."
  - If a type is wrong, fix the type at its source.
  - If a value is genuinely unknown, use `unknown` and narrow with a type guard.
  - If an external lib has bad types, augment its module declaration or write a typed wrapper — don't paper over with `any`.
- Prefer `as const`, generics, and discriminated unions over casts.
- `// @ts-ignore` / `// @ts-expect-error` are also banned unless paired with a comment explaining the upstream bug and a link.

## State management

- **Use Jotai** for shared/component state. Atoms live in `lib/session/atoms.ts` (already shared across all three packages).
- **`useEffect` is a last resort.** Most of the time it's the wrong tool. Before reaching for it, check:
  - Deriving state from props/state? → compute during render.
  - Reacting to a user event? → put the logic in the event handler.
  - Resetting state when a prop changes? → use a `key`.
  - Syncing with an external store? → `useSyncExternalStore` or a Jotai atom.
  - Fetching data? → use the shared `@auror/shared/api` wrappers + `useApiCall`, not raw `useEffect`.
  - Only reach for `useEffect` for true synchronization with non-React systems (DOM APIs, subscriptions, timers). Document why in a one-line comment.

## Solution shape

- **Simplest solution that meets industry standards.** No clever abstractions, no speculative generality, no "we might need this later" hooks.
- Three similar lines beats a premature abstraction. Extract only when the third use case actually appears and the shape is clear.
- Prefer the boring, well-trodden library/pattern over the novel one. If React docs or the library's own docs show the pattern, that's the default.
- Don't add error handling, fallbacks, or validation for scenarios that can't happen. Validate only at system boundaries.
- Don't add feature flags or back-compat shims when you can just change the code.

## Quick checklist before opening a PR

- [ ] No `as any`, no `@ts-ignore`.
- [ ] State lives in Jotai atoms (or local `useState` for purely local UI state).
- [ ] No `useEffect` for derivable state, event responses, or data fetching.
- [ ] No new abstraction without ≥3 concrete callers.
- [ ] No cross-package imports (`rg "from '@auror/(reader|author|admin)"` returns zero matches in your changed files).
- [ ] `pnpm --filter @auror/<role> typecheck` passes.
- [ ] `pnpm --filter @auror/<role> build` passes.