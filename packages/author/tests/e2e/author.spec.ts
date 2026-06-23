import { test, expect } from "@playwright/test";

// Smoke test for the author subdomain. Phase C.3 expands this into the full
// login → write chapter → autosave loop against the deployed environment.
test.describe("author (local)", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Auror/i })).toBeVisible();
  });

  test("unauthenticated /author/studio redirects to /login", async ({ page }) => {
    await page.goto("/author/studio");
    await expect(page).toHaveURL(/\/login/);
  });

  test("reader account gets bounced from /author/studio with error param", async ({ page, context }) => {
    // Stub a reader session by setting a Supabase-shape cookie. The middleware
    // checks role from the `users` table; in a real environment this would
    // require a full login flow. Skip for local smoke until we wire a
    // session-mocking helper.
    test.skip(true, "requires live Supabase + signed-in reader account");
  });
});