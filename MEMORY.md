# auror.my (Auror Reading Platform) Memory

## Project Overview
Next.js 14 App Router backend with Supabase integration, serving the existing static HTML frontend out of `public/stitch_auror_modern_reading_platform` via configuration rewrites.

## Technical Conventions
- **Routing**: Next.js App Router API routes under `app/api/...` returning JSON.
- **Client-side API Bridge**: Placed in `public/stitch_auror_modern_reading_platform/assets/js/api.js`.
- **Database/Auth client**: Constructed using `createServerClient` in `app/lib/supabase.ts` and `middleware.ts`.
- **Import Rules**: Use correct relative paths (e.g., `../../lib/supabase` for 2-level-deep API routes).
- **TypeScript**: Strict compilation rules are active. Explicitly annotate parameters like `cookiesToSet` as `any[]` in `setAll` methods to prevent implicit `any` type compilation failures.

## Key Learnings & Gotchas
- **Supabase Local Service**: Requires Docker. If offline, mock/dummy flows are used locally.
- **Tailwind/Styles**: Keep original frontend UI markup and CSS styles intact.
- **Next.js Route Handlers & Cookies**: Returning a custom `NextResponse` (like `NextResponse.json(...)`) does not merge cookies set via `cookies()` (from `next/headers`). To solve this, pass `NextResponse.next()` to `createServerClient(response)` and copy cookies from `response.cookies.getAll()` to the returned response.
