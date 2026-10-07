import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  {
    chromium,
  } = require("C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({ headless: true, channel: "msedge" }),
  out = {};
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }),
    held = [];
  await page.route("**/api/game", (route) => {
    held.push(route);
  });
  await page.goto("http://localhost:4174");
  await page.getByText("这一期还没翻开").waitFor({ timeout: 18000 });
  out.initialTimeout = true;
  for (const route of held.splice(0)) await route.abort().catch(() => {});
  await page.unroute("**/api/game");
  await page.getByText("重新连接 →").click();
  await page.locator('[data-gender="male"]').click();
  await page.locator(".choice").first().waitFor();
  await page.waitForTimeout(550);
  await page.route("**/api/action", (route) =>
    route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ error: "review conflict" }),
    }),
  );
  await page.route("**/api/game", (route) => {
    held.push(route);
  });
  await page.locator(".choice").first().click();
  await page.waitForFunction(
    () => !document.querySelector("#app").hasAttribute("aria-busy"),
    {},
    { timeout: 18000 },
  );
  assert.equal(await page.locator(".choice:disabled").count(), 0);
  assert((await page.locator("#toast").innerText()).includes("无法同步"));
  assert.equal(await page.locator(".round-number b").innerText(), "01");
  out.conflictSyncTimeoutRecovery = true;
  for (const route of held.splice(0)) await route.abort().catch(() => {});
  await page.unroute("**/api/game");
  await page.unroute("**/api/action");
  await page.evaluate(async () => {
    let view = await (await fetch("/api/game")).json();
    for (let i = 0; i < 20; i++) {
      const choice = /data-question-id="([MF]\d+)" data-pick="(\d)"/.exec(
        view.html,
      );
      await new Promise((r) => setTimeout(r, 550));
      const response = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          questionId: choice[1],
          pick: Number(choice[2]),
          revision: view.revision,
          requestId: crypto.randomUUID(),
        }),
      });
      if (!response.ok) throw Error("Failed setup");
      view = await response.json();
    }
  });
  await page.reload();
  await page.locator('[data-ui="poster"]').waitFor();
  await page.route("**/api/poster.svg", (route) => {
    held.push(route);
  });
  await page.locator('[data-ui="poster"]').click();
  await page.waitForFunction(
    () =>
      document.querySelector("#toast").textContent.includes("分享卡加载超时"),
    {},
    { timeout: 18000 },
  );
  out.posterTimeout = true;
  for (const route of held.splice(0)) await route.abort().catch(() => {});
  await page.unroute("**/api/poster.svg");
  await page.locator('[data-ui="poster"]').click();
  await page.locator("#poster-dialog[open]").waitFor();
  out.posterRetry = true;
  fs.writeFileSync(
    "artifacts/v2-review/timeout.json",
    JSON.stringify(
      { passed: true, ...out, verifiedAt: new Date().toISOString() },
      null,
      2,
    ),
  );
  console.log("PASS initial GET, 409 sync GET, poster timeout and retry");
} finally {
  await browser.close();
}
