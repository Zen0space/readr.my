import { test, expect } from "@playwright/test";

// Smoke test for the admin subdomain. Phase D.3 expands this into the full
// admin-login → suspend-user → verify-on-apex loop.
test.describe("admin (local)", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Auror/i })).toBeVisible();
  });

  test("unauthenticated /admin redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("CSP header is set on responses", async ({ request }) => {
    const res = await request.get("/login");
    const csp = res.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
  });
});