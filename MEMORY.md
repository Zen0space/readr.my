# auror.my (Auror Reading Platform) Memory

## Project Overview
Three per-role Next.js frontends (`@auror/reader` at `auror.my`, `@auror/author` at `author.auror.my`, `@auror/admin` at `admin.auror.my`) sharing one Fastify backend (`@auror/backend`) and one Supabase project. A single Supabase login authenticates the user across all three subdomains via a `Domain=.auror.my` apex cookie. The desktop app (`@auror/desktop`, Tauri v2) imports from `@auror/shared` and `@auror/shared/api` directly.

The previous monolithic webapp package was removed in the Phase E (Pangkas) cutover of `docs/development/dev-frontend-split.md`.

## Technical Conventions
- **Routing**: Next.js App Router per package; backend uses Fastify with route groups under `src/modules/<name>/routes.ts`.
- **Frontend → backend**: Each frontend's `next.config.mjs` rewrites `/api/v1/:path*` → `http://backend:4000/v1/:path*` so the browser sees same-origin and the bearer token (when wired) flows without CORS hassle.
- **Auth BFF**: Each frontend package ships `app/api/auth/{login,register,logout,session,callback}/route.ts`. These use Supabase SSR cookies and write the session with `Domain=.auror.my` (gated by `NEXT_PUBLIC_COOKIE_DOMAIN`) so a single login covers all three subdomains.
- **Shared API client**: `@auror/shared/api-client` exports a typed `ApiClient` (cookie + optional bearer), the error classes, and the response zod schemas. `@auror/shared/api` exports the per-resource wrappers (`authApi`, `writingsApi`, `walletApi`, `libraryApi`, `analyticsApi`, `uploadApi`, `adminApi`, `socialApi`, `subscriptionApi`).
- **Shared domain**: `@auror/shared/domain` exports enums (`UserRole`, `UserStatus`, `StoryStatus`, etc.) and zod schemas (`LoginSchema`, `RegisterSchema`, `WritingSchema`, `ChapterSchema`, etc.) — single source of truth for request/response shapes.
- **Import Rules**: Frontend code uses path-aliased imports (`@/lib/api`, `@/components/...`). Cross-package imports are forbidden: reader/author/admin must only import from `@auror/shared`.
- **TypeScript**: Strict. Don't use `as any` — if the type is truly unknown, use `unknown` and narrow properly.

## Key Learnings & Gotchas
- **Apex cookie trick**: `Domain=.auror.my` on a `localhost` cookie is silently ignored. The split plan's DoD verifies this on a real staging subdomain, not localhost.
- **Wildcard TLS for `*.auror.my`**: requires DNS-01 challenge; confirm Coolify / hosting provider supports this before Phase B's DNS cutover.
- **Fastify schema validation**: Forgetting `setValidatorCompiler` / `setSerializerCompiler` (from `fastify-type-provider-zod`) in test apps makes every Zod-bearing route fail to boot with `data/required must be array`. The test helper in `packages/backend/test/helpers.ts` mirrors the prod `app.ts` for this reason.
- **Supabase Local Service**: Requires Docker. If offline, mock/dummy flows are used locally.
- **Tailwind/Styles**: Each frontend package keeps its own `tailwind.config.ts` + `postcss.config.mjs` + `app/globals.css` (copy-paste at split time; consolidation is Phase 4 work).
- **Next.js Route Handlers & Cookies**: Returning a custom `NextResponse` (like `NextResponse.json(...)`) does not merge cookies set via `cookies()` (from `next/headers`). To solve this, pass `NextResponse.next()` to `createServerClient(response)` and copy cookies from `response.cookies.getAll()` to the returned response. (This still applies in each frontend's `/api/auth/*` BFF.)