import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const authRoutes = [
  { path: "/author/studio", name: "author-studio" },
  { path: "/author/analytics", name: "author-analytics" },
  { path: "/author/earnings", name: "author-earnings" },
  { path: "/author/settings", name: "author-settings" },
  { path: "/admin", name: "admin-command-center" },
  { path: "/admin/moderation", name: "admin-moderation" },
  { path: "/admin/users", name: "admin-users" },
];

for (const route of authRoutes) {
  test.describe(`visual: ${route.name}`, () => {
    test(`redirects unauthenticated to /login`, async ({ page }) => {
      const resp = await page.goto(route.path);
      const destination = page.url();
      expect(destination).toContain("/login");
    });

    test(`has no critical a11y violations when gated`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .disableRules(["color-contrast"])
        .analyze();
      expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
    });
  });
}
