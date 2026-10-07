import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  {
    chromium,
  } = require("C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto("http://localhost:4174");
  await page.locator('[data-gender="male"]').click();
  await page.locator(".choice").first().waitFor();
  await page.waitForTimeout(550);
  await page.route("**/api/action", (route) => route.abort("failed"));
  await page.locator(".choice").first().click();
  await page.waitForFunction(
    () => !document.querySelector("#app").hasAttribute("aria-busy"),
  );
  assert.equal(await page.locator(".picked").count(), 0);
  assert.equal(await page.locator(".choice:disabled").count(), 0);
  assert.equal(await page.locator(".round-number b").innerText(), "01");
  await page.unroute("**/api/action");
  await page.locator(".choice").first().click();
  await page.waitForFunction(
    () => document.querySelector(".round-number b")?.textContent === "02",
  );
  fs.writeFileSync(
    "artifacts/v2-review/network.json",
    JSON.stringify(
      {
        passed: true,
        failureKeepsScene: true,
        clearsUnsubmittedHighlight: true,
        retryAdvancesOnce: true,
        verifiedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  console.log("PASS failed request recovery and retry");
} finally {
  await browser.close();
}
