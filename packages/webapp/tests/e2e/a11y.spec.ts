import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const publicPages = [
  { path: "/", name: "browse-dashboard" },
  { path: "/login", name: "login" },
  { path: "/register", name: "register" },
];

const AUTH = process.env.E2E_AUTH_COOKIE || "";

for (const page of publicPages) {
  test.describe(`a11y: ${page.name}`, () => {
    test("no serious violations", async ({ page }) => {
      await page.goto(page.path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const violations = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );
      expect(violations, `${violations.length} serious/critical a11y violations found`).toHaveLength(0);
    });
  });
}
