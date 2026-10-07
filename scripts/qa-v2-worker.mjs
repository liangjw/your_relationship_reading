import assert from "node:assert/strict";
import fs from "node:fs";
const base = process.env.QA_WORKER_URL || "http://127.0.0.1:4175";
const results = [];
for (const gender of ["male", "female"]) {
  let cookie = "",
    revision = 0,
    counter = 0;
  async function call(path = "game", data) {
    const response = await fetch(base + "/api/" + path, {
      method: data ? "POST" : "GET",
      headers: {
        Cookie: cookie,
        ...(data ? { Origin: base, "Content-Type": "application/json" } : {}),
      },
      ...(data
        ? {
            body: JSON.stringify({
              ...data,
              revision,
              requestId: "worker-qa-" + ++counter,
            }),
          }
        : {}),
    });
    if (response.headers.has("set-cookie")) {
      const set = response.headers.get("set-cookie");
      assert(
        /HttpOnly/.test(set) && /SameSite=Lax/.test(set) && /Secure/.test(set),
      );
      cookie = set.split(";")[0];
    }
    assert.equal(response.status, 200);
    const view = await response.json();
    revision = view.revision;
    return view;
  }
  let view = await call();
  assert.equal(view.screen, "entry");
  view = await call("action", { action: "start", gender });
  for (let i = 0; i < 20; i++) {
    assert.equal(view.screen, "play");
    assert(!view.html.includes("方向吻合度"));
    const choice = /data-question-id="([MF]\d+)" data-pick="(\d)"/.exec(
      view.html,
    );
    assert(choice);
    assert(choice[1].startsWith(gender === "male" ? "F" : "M"));
    await new Promise((resolve) => setTimeout(resolve, 520));
    view = await call("action", {
      action: "answer",
      questionId: choice[1],
      pick: Number(choice[2]),
    });
  }
  assert.equal(view.screen, "report");
  assert.equal((view.html.match(/class="scene-review"/g) || []).length, 20);
  const html = view.html;
  view = await call();
  assert.equal(view.html, html);
  const response = await fetch(base + "/api/poster.svg", {
    headers: { Cookie: cookie },
  });
  assert.equal(response.status, 200);
  const svg = await response.text();
  assert(svg.includes('width="750"') && svg.includes('height="1360"'));
  const friend = await fetch(base + "/api/game");
  assert.equal((await friend.json()).screen, "entry");
  results.push({
    gender,
    questions: 20,
    oppositeSexOnly: true,
    report: true,
    persistedReport: true,
    poster: true,
    freshFriend: true,
  });
  console.log("PASS Cloudflare runtime", gender);
}
const asset = await fetch(base + "/client/app.mjs");
assert.equal(asset.status, 200);
const output = {
  passed: true,
  url: base,
  runs: results,
  verifiedAt: new Date().toISOString(),
  runtime: "Cloudflare workerd + SQLite Durable Objects",
};
fs.writeFileSync(
  "artifacts/v2-review/worker-runtime.json",
  JSON.stringify(output, null, 2),
);
