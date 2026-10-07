import fs from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  {
    chromium,
  } = require("C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({ headless: true, channel: "msedge" }),
  runs = [];
try {
  for (const delay of [40, 100, 160, 200, 250, 350, 500])
    for (const pick of [0, 3]) {
      const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
        }),
        page = await context.newPage();
      await page.goto("http://localhost:4174");
      await page.locator('[data-gender="male"]').click();
      await page.locator(".choice").first().waitFor();
      await page.waitForTimeout(650);
      await page.evaluate(() => {
        window.clickLog = [];
        document.addEventListener("click", (event) => {
          if (event.target.closest("[data-action]"))
            window.clickLog.push({
              count: event.detail,
              time: performance.now(),
            });
        });
      });
      await page.locator(".choice").nth(pick).dblclick({ delay });
      await page.waitForTimeout(700);
      const round = await page.locator(".round-number b").innerText();
      const clicks = await page.evaluate(() => window.clickLog);
      await page.locator(".choice").first().click();
      await page.waitForFunction(
        () => document.querySelector(".round-number b")?.textContent === "03",
      );
      await page.waitForTimeout(650);
      await page.locator(".back-button").dblclick({ delay });
      await page.waitForTimeout(700);
      const backRound = await page.locator(".round-number b").innerText();
      runs.push({
        delay,
        pick,
        round,
        backRound,
        clicks,
        passed: round === "02" && backRound === "02",
      });
      await context.close();
    }
  fs.writeFileSync(
    "artifacts/v2-review/double-tap.json",
    JSON.stringify(
      {
        passed: runs.every((r) => r.passed),
        runs,
        verifiedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  assert(
    runs.every((r) => r.passed),
    JSON.stringify(runs.filter((r) => !r.passed)),
  );
  console.log("PASS 14 answer and 14 back native double-click delay cases");
} finally {
  await browser.close();
}
