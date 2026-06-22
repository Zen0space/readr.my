import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  { path: "/", name: "browse-dashboard" },
  { path: "/login", name: "login" },
  { path: "/register", name: "register" },
  { path: "/library", name: "library" },
  { path: "/wallet", name: "wallet" },
  { path: "/subscription", name: "subscription" },
];

for (const route of routes) {
  test.describe(`visual: ${route.name}`, () => {
    test(`matches snapshot on desktop`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${route.name}-desktop.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    });

    test(`matches snapshot on mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${route.name}-mobile.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    });

    test(`has no critical a11y violations`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .disableRules(["color-contrast"])
        .analyze();
      expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
    });
  });
}
