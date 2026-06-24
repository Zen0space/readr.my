import { test, expect } from "@playwright/test";

// Smoke test for the reader apex. Phase B.3 expands this into the full
// browse → login → read → top-up loop against the deployed environment.
test.describe("reader (local)", () => {
  test("browse page renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Auror/);
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Auror/i })).toBeVisible();
  });

  test("unauthenticated /wallet redirects to /login", async ({ page }) => {
    await page.goto("/wallet");
    await expect(page).toHaveURL(/\/login/);
  });
});