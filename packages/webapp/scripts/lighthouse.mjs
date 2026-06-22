import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const URLs = [
  { url: "http://localhost:3000/", label: "/" },
  { url: "http://localhost:3000/login", label: "/login" },
];

const THRESHOLDS = { performance: 90, accessibility: 95 };

async function run() {
  const chrome = await launch({ chromeFlags: ["--headless", "--no-sandbox"] });
  const results = [];

  for (const entry of URLs) {
    const { lhr } = await lighthouse(entry.url, {
      port: chrome.port,
      output: "json",
      onlyCategories: ["performance", "accessibility"],
    });
    const perf = Math.round(lhr.categories.performance.score * 100);
    const a11y = Math.round(lhr.categories.accessibility.score * 100);
    const pass = perf >= THRESHOLDS.performance && a11y >= THRESHOLDS.accessibility;
    results.push({ ...entry, perf, a11y, pass });
    console.log(`${entry.label}: perf=${perf} a11y=${a11y} ${pass ? "PASS" : "FAIL"}`);
  }

  await chrome.kill();

  const failed = results.filter((r) => !r.pass);
  if (failed.length > 0) {
    console.error(`\n${failed.length} page(s) below threshold:`);
    failed.forEach((f) => console.error(`  ${f.label}: perf=${f.perf} a11y=${f.a11y}`));
    process.exit(1);
  }

  console.log("\nAll pages meet Lighthouse thresholds.");
}

run();
