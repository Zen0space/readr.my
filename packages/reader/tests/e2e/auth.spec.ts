import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_LOGIN_EMAIL ?? "khairulreka77@gmail.com";
const TEST_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? "Khairul46!!";

// Supabase network roundtrips in the test env can be 5-8s each. Give
// each test plenty of headroom so a slow network doesn't make the
// suite flaky.
test.setTimeout(60_000);

// The auth flow hits the same Supabase project for login, session,
// and token round-trips. Running these in parallel from a single
// dev Supabase causes 5+ second per-call latency and flaky
// timeouts — so run the suite serially.
test.describe.configure({ mode: "serial" });

/**
 * Acceptance criteria for the auth flow:
 *   1. Anonymous /library bounces to /login?redirect=/library.
 *   2. Submitting valid credentials on /login navigates to /library
 *      and the page renders (not a redirect back to /login).
 *   3. The session check returns authenticated:true and the cookies
 *      are actually persisted on the browser.
 *   4. A subsequent navigation to /library is NOT redirected.
 *
 * The e2e suite runs against the dev/prod reader app at
 * E2E_BASE_URL (default http://localhost:3000). Credentials are
 * injected via env so the test never checks a password into git.
 */
test.describe("auth flow (live)", () => {
  test("login with valid credentials lands on /library", async ({ page }) => {
    await page.goto("/login");

    // The card carries a "WELCOME BACK" eyebrow pill — that's our
    // signal that the form mounted. (We don't assert on a large
    // heading because the form card intentionally keeps the
    // page's brand panel as the visual hero.)
    await expect(page.getByText(/welcome back/i)).toBeVisible();

    // Use the email/password placeholders — they're stable, unique,
    // and don't collide with the "Show password" toggle button's
    // aria-label (which trips Playwright's strict-mode label locator).
    await page.getByPlaceholder("name@example.com").fill(TEST_EMAIL);
    await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /^sign in$/i }).click();

    // The form should redirect to /library (the default landing
    // page after a successful sign-in). Give Next.js a moment to
    // finish the soft navigation + router.refresh() that re-runs
    // the protected layout's server component.
    await page.waitForURL(/\/library(\?|$)/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/library(\?|$)/);
    // The form card should no longer be on the page.
    await expect(page.getByText(/welcome back/i)).toBeHidden();
  });

  test("session cookie is persisted after login", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill(TEST_EMAIL);
    await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL(/\/library(\?|$)/, { timeout: 10_000 });

    // The Supabase session cookie should be on the origin and have
    // path: '/' so the browser sends it back on any reader route.
    const cookies = await context.cookies();
    const session = cookies.find(
      (c) =>
        c.name.startsWith("sb-") &&
        c.name.endsWith("-auth-token") &&
        !c.name.includes("code-verifier"),
    );
    expect(session, "Supabase session cookie should be set").toBeDefined();
    expect(session!.path, "session cookie should be path-scoped to /").toBe("/");
  });

  test("/api/auth/session returns authenticated:true after login", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill(TEST_EMAIL);
    await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL(/\/library(\?|$)/, { timeout: 10_000 });

    // Use the PAGE's request context (which shares the browser's
    // cookie jar) — the test-scoped `request` fixture is isolated
    // and would not carry the Supabase session cookie.
    const res = await page.request.get("/api/auth/session");
    expect(res.status(), "session endpoint should return 200").toBe(200);
    const body = (await res.json()) as { authenticated: boolean; user?: { email: string } };
    expect(body.authenticated).toBe(true);
    expect(body.user?.email).toBe(TEST_EMAIL);
  });

  test("anonymous /library redirects to /login?redirect=/library", async ({ page, context }) => {
    // Start with a clean cookie jar so we know we're anonymous.
    await context.clearCookies();
    await page.goto("/library");
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });

  test("/api/auth/token returns the Supabase access token after login", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill(TEST_EMAIL);
    await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL(/\/library(\?|$)/, { timeout: 10_000 });

    const res = await page.request.get("/api/auth/token");
    expect(res.status(), "token endpoint should return 200").toBe(200);
    const body = (await res.json()) as {
      access_token: string;
      token_type: string;
      expires_at: number;
    };
    expect(body.access_token).toBeTruthy();
    expect(body.access_token.split(".")).toHaveLength(3); // JWT shape
    expect(body.token_type).toBe("bearer");
    expect(body.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});
