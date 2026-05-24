---
name: error-handling
description: Unified error + logging contract — single source of truth in @auror/shared/errors. Consumers (backend, webapp, desktop) only provide thin adapters; no duplicated message tables, no duplicated clients.
---

# error-handling skill

One contract, one implementation, three thin wires.

**Single source of truth:** `packages/shared/src/errors/` exports everything error-related — types, codes, message tables, formatters, the API client factory, the toaster factory, the dev-logger interface. Backend, webapp, and desktop import from there. Nothing is duplicated.

## The three rules (unchanged)

1. **Users see human language.** Toasts and inline errors say what the user can do — never HTTP codes, never stack traces.
2. **Devs read the terminal, not F12.** Dev API logs pipe to the dev server's stdout. Browser DevTools console stays clean.
3. **Production browsers log nothing.** No `console.*` in shipped code; all telemetry posts to the server.

---

## 1. The shared package surface

This is the **only** place errors are defined. Everything else imports.

```
packages/shared/src/errors/
├── index.ts                # public exports
├── codes.ts                # ErrorCode union (single source of truth for codes)
├── envelope.ts             # wire-format types + serializer
├── classes.ts              # AppError, ApiError, NetworkError
├── messages.ts             # user-facing strings, all locales
├── format.ts               # getUserMessage, formatDevLogLine
├── api-client.ts           # createApiClient({ adapters }) factory
└── toaster.ts              # createToaster({ adapter }) factory
```

Exports (the entire public surface):

```ts
// AppError — thrown on the server, becomes a 4xx response.
export class AppError { code: ErrorCode; status: number; message: string; details?: unknown }

// ApiError — thrown on the client when the server returns an error envelope.
export class ApiError { status: number; code: ErrorCode; devMessage: string; details?: unknown }

// NetworkError — thrown on the client when the request never reached the server.
export class NetworkError { cause?: unknown }

// The wire format.
export type ErrorEnvelope = { error: { code: ErrorCode; message: string; details?: unknown } }
export const serializeError: (err: unknown) => { status: number; body: ErrorEnvelope }

// All known error codes — adding one here is the only way to introduce a new code.
export type ErrorCode =
  | 'story_not_found'
  | 'insufficient_coins'
  | 'chapter_locked'
  | 'rate_limited'
  | 'payment_failed'
  | 'network_unreachable'
  | 'validation_failed'
  | 'unauthorized'
  | 'internal'

// User messaging — pure function, lives here so every consumer renders identically.
export type Locale = 'ms' | 'en'
export const getUserMessage: (err: unknown, locale?: Locale) => string

// Dev log line formatter — shared output format across web + desktop.
export const formatDevLogLine: (info: { method: string; path: string; status: number | 'NET'; ms: number | null; code?: string }) => string

// The API client factory — used by webapp AND desktop. One implementation.
export const createApiClient: (cfg: ApiClientConfig) => ApiClient

// The toaster factory — used by webapp AND desktop. One implementation.
export const createToaster: (adapter: ToastAdapter) => Toaster
```

**Rule:** any error-related code outside `packages/shared/src/errors/` is a bug. If you find yourself writing a second message map, a second error class, a second client wrapper, or a second toast helper — stop and put it here.

---

## 2. Wire format (the only contract that crosses processes)

```json
{ "error": { "code": "story_not_found", "message": "Story 42 not found.", "details": {} } }
```

- `code` — `ErrorCode` from `codes.ts`. Stable. Client keys off this.
- `message` — developer-facing English, with technical context. Never shown to users.
- `details` — optional structured context (e.g. `{ fields: { title: 'too_long' } }` for 422).
- HTTP status reflects class (400 / 401 / 403 / 404 / 409 / 422 / 429 / 5xx).

`AppError` → `serializeError(err)` is the **only** path to a non-500 response. Any other throw becomes a 500 with `code: 'internal'` and a generic message; stack goes to Pino.

---

## 3. The API client factory (one impl, two consumers)

Webapp and desktop **do not write their own fetch wrappers**. They call `createApiClient` with adapters:

```ts
// shared/src/errors/api-client.ts
export type ApiClientConfig = {
  baseUrl: string
  getToken: () => Promise<string | null>        // adapter: where the JWT comes from
  devLog?: (line: string) => void                // adapter: dev sink; undefined in prod builds
  onUnauthorized?: () => void                    // adapter: sign-out trigger for 401s
}

export const createApiClient = (cfg: ApiClientConfig) => ({
  get:  <T>(path: string)                 => request<T>('GET',    path),
  post: <T>(path: string, body?: unknown) => request<T>('POST',   path, body),
  // …patch, put, del
})
```

The factory handles, in one place: building the request, attaching the token, parsing the envelope, throwing `ApiError` on 4xx/5xx, throwing `NetworkError` on fetch failure, calling `onUnauthorized` on 401, and emitting `formatDevLogLine` to `devLog` when defined.

### Wiring — webapp

```ts
// webapp/src/lib/api.ts  (the ONLY api file in webapp)
import { createApiClient } from '@auror/shared/errors'
import { supabase } from './supabase'

export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL!,
  getToken: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null,
  devLog: process.env.NODE_ENV === 'development'
    ? (line) => { void fetch('/__dev/log', { method: 'POST', body: line }).catch(() => {}) }
    : undefined,
  onUnauthorized: () => supabase.auth.signOut(),
})
```

### Wiring — desktop

```ts
// desktop/src/lib/api.ts  (the ONLY api file in desktop)
import { createApiClient } from '@auror/shared/errors'
import { invoke } from '@tauri-apps/api/core'
import { getToken } from './auth'

export const api = createApiClient({
  baseUrl: __API_URL__,
  getToken,
  devLog: import.meta.env.DEV
    ? (line) => { void invoke('dev_log', { line }).catch(() => {}) }
    : undefined,
  onUnauthorized: () => invoke('sign_out'),
})
```

**That's the entire client setup.** No `as any`, no duplicated parsing, no per-package fetch wrapper.

### IPC errors (desktop only)

Tauri commands fail with `Err(String)`. The `src/ipc/` wrappers normalize that string into an `ApiError` using a shared helper:

```ts
// shared/src/errors/api-client.ts (also exported)
export const ipcErrorToApiError = (raw: unknown): ApiError => { /* parses 'code:message' */ }
```

After that, the toaster doesn't care whether the failure came from HTTP or IPC — same `ApiError` shape, same message lookup.

---

## 4. The toaster factory (one impl, two consumers)

Same pattern as the API client. The shared factory owns the logic; consumers provide a toast adapter.

```ts
// shared/src/errors/toaster.ts
export type ToastAdapter = {
  error: (msg: string) => void
  success: (msg: string) => void
}

export const createToaster = (adapter: ToastAdapter, locale: Locale = 'ms') => ({
  error:   (err: unknown)  => adapter.error(getUserMessage(err, locale)),
  success: (msg: string)   => adapter.success(msg),
})
```

### Wiring — webapp

```ts
// webapp/src/lib/toast.ts
import { toast } from 'sonner'
import { createToaster } from '@auror/shared/errors'
export const t = createToaster({ error: toast.error, success: toast.success })
```

### Wiring — desktop

```ts
// desktop/src/lib/toast.ts
import { toast } from 'sonner'
import { createToaster } from '@auror/shared/errors'
export const t = createToaster({ error: toast.error, success: toast.success })
```

(If desktop uses a different toast lib later, only this file changes.)

Components everywhere call `t.error(err)` / `t.success('Saved')`. They never look up messages themselves.

---

## 5. Backend wiring (one global hook)

Fastify's error handler is the only place that converts thrown errors into envelopes:

```ts
// backend/src/plugins/error-handler.ts
import { serializeError } from '@auror/shared/errors'

app.setErrorHandler((err, req, reply) => {
  const { status, body } = serializeError(err)
  req.log[status >= 500 ? 'error' : 'info']({ err, code: body.error.code }, 'request.error')
  reply.code(status).send(body)
})
```

Services throw `new AppError('insufficient_coins', 409, '...')`. That's it. No try/catch dance in route handlers.

---

## 6. Dev terminal logging — single format, two sinks

`formatDevLogLine` lives in shared. Output is identical across webapp and desktop:

```
API 200    GET    /v1/stories                123ms
API 201    POST   /v1/stories                 89ms
API ERR    409    POST   /v1/stories          42ms  code=duplicate_title
API ERR    NET    POST   /v1/wallet/topup     --    code=network_unreachable
```

Two sinks, both 404/no-op in production:

- **Webapp** — Next.js dev-only route at `/__dev/log` writes the line to its own `console.log`, which lands in the Next dev terminal. Route returns 404 in prod (smoke-tested).
- **Desktop** — Tauri command `dev_log` (registered only when `cfg!(debug_assertions)`) writes via the `tracing` crate to the `tauri dev` terminal. The command is not registered in release builds.

App code never calls `console.*` directly. The factory's `devLog` adapter is the only sink.

---

## 7. Production logging stance

**Browser / webview:** zero `console.*` in shipped code (ESLint `no-console` enforced; the only allowed callsite is the dev-only `__dev/log` route, behind a flag check). Unhandled errors are captured by a global handler and posted to `POST /v1/client-errors` on the backend.

**Server (Pino):** one structured line per request via Fastify's hook. Fields: `req_id`, `method`, `path`, `status`, `duration_ms`, `user_id?`, `code?`. 4xx at `info`, 5xx at `error`. Ships to GlitchTip / log aggregator. Pino redact paths configured for tokens, payment refs, emails.

---

## 8. Adding a new error — the only workflow

1. Add the code to `ErrorCode` in `shared/src/errors/codes.ts`.
2. Add the user-facing string for **every locale** (`ms`, `en`) in `messages.ts`. TypeScript will fail the build if either is missing — `messages` is `Record<Locale, Record<ErrorCode, string>>`.
3. Throw `new AppError('your_code', 409, '...')` from the relevant service.
4. Done. No client changes. No toast changes. No log changes.

This compile-time enforcement is the whole point of the unification — you cannot ship a code the frontend doesn't know how to translate.

---

## 9. What NOT to do

- Writing a second error class outside `shared/errors/`.
- Writing a second message lookup or hardcoding a user string in a component.
- Writing a per-package `fetch` wrapper — use `createApiClient`.
- `catch (e: any)` — leaks `devMessage` to users; also forbidden by the no-`any` rule.
- `console.log`/`console.error` in app code — pollutes F12 in prod.
- Throwing `new Error('Bad request')` in a route — bypasses the envelope and becomes a 500.
- Showing a toast for 422 validation errors — render them inline from `details.fields`.

---

## Quick checklist before opening a PR

- [ ] No new `fetch` wrapper, no new error class, no new message map outside `shared/errors/`.
- [ ] Any new `ErrorCode` added to `codes.ts` has matching `ms` + `en` strings in `messages.ts` (compile-enforced).
- [ ] Webapp and desktop import `api` and `t` from their single `lib/api.ts` and `lib/toast.ts`.
- [ ] Backend routes throw `AppError`; the global error handler does the rest.
- [ ] No `console.*` in app code. No `catch (e: any)`.
- [ ] Dev log routes/commands are 404/unregistered in production builds.
- [ ] 422 → inline field errors. 401 → `onUnauthorized` (sign-out) → toast. Else → toast.
- [ ] `pnpm -r typecheck` passes — locale × code coverage is a type check, not a runtime check.

## Related

- `[[backend]]` — throws `AppError`; the global Fastify error handler is the only wiring.
- `[[webapp]]` — single `lib/api.ts` + `lib/toast.ts` are the only wiring.
- `[[desktop]]` — same single-file wiring; IPC errors normalize via the shared helper.
