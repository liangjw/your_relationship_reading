import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { QUESTIONS, questionsFor } from "../../backend/content/bank.mjs";
import raw from "../../backend/content/prd-questions.json" with { type: "json" };
import { SOURCES } from "../../backend/content/research.mjs";
import { newSession, applyAction } from "../../backend/domain/session.mjs";
import { assess, classify, TYPES } from "../../backend/domain/assessment.mjs";
import { GameService } from "../../backend/services/game.mjs";
import { reportData } from "../../backend/presentation/views.mjs";
import { enhanceCopy } from "../../backend/services/narrative.mjs";
import fixtures from "./type-fixtures.json" with { type: "json" };
const best = (q) =>
  q.benchmark.optionDistances.indexOf(Math.min(...q.benchmark.optionDistances));
function complete(g = "male", pick = best) {
  const s = newSession();
  applyAction(s, { action: "start", gender: g, revision: s.revision }, 0);
  for (const q of questionsFor(g))
    applyAction(
      s,
      {
        action: "answer",
        questionId: q.id,
        pick: pick(q),
        revision: s.revision,
      },
      (s.index + 1) * 10000,
    );
  return s;
}
test("40 exact PRD questions, opposite-sex-only routes, >=20% calibration", () => {
  assert.equal(QUESTIONS.length, 40);
  for (const g of ["male", "female"]) {
    const qs = questionsFor(g);
    assert.equal(qs.length, 20);
    assert(qs.every((q) => q.targetGender !== g));
    assert(qs.filter((q) => q.calibration).length / 20 >= 0.2);
  }
  for (const q of QUESTIONS) {
    const r = raw.find((r) => r.id === q.id);
    assert.equal(q.context, r.context);
    assert.deepEqual(q.choices, r.choices);
    assert.equal(q.choices.length, 4);
    assert(q.sourceRefs.every((k) => SOURCES[k]));
    assert.equal(q.benchmark.pilot, null);
    assert.equal(q.benchmark.optionDistances.length, 4);
    assert(q.benchmark.optionDistances.every((n) => n >= 0 && n <= 1));
  }
});
test("server progression, answer revision and unchanged option order", () => {
  const s = complete();
  assert.equal(s.screen, "report");
  assert.equal(s.answers.length, 20);
  const orders = JSON.stringify(s.orders);
  applyAction(s, { action: "back", revision: s.revision }, 210000);
  assert.equal(s.index, 19);
  const q = questionsFor(s.playerGender)[19];
  applyAction(
    s,
    { action: "answer", questionId: q.id, pick: 3, revision: s.revision },
    211000,
  );
  assert.equal(s.answers.length, 20);
  assert.equal(s.answers.find((a) => a.id === q.id).pick, 3);
  assert.equal(s.screen, "report");
  assert.equal(JSON.stringify(s.orders), orders);
});
test("entry return continues same route and changed gender starts opposite route", () => {
  const s = newSession();
  applyAction(s, { action: "start", gender: "female", revision: 0 }, 0);
  const orders = JSON.stringify(s.orders);
  applyAction(s, { action: "back", revision: s.revision }, 1000);
  assert.equal(s.screen, "entry");
  applyAction(
    s,
    { action: "start", gender: "female", revision: s.revision },
    2000,
  );
  assert.equal(JSON.stringify(s.orders), orders);
  applyAction(s, { action: "back", revision: s.revision }, 3000);
  applyAction(
    s,
    { action: "start", gender: "male", revision: s.revision },
    4000,
  );
  assert.equal(s.answers.length, 0);
  assert(Object.keys(s.orders).every((k) => k.startsWith("F")));
});
test("unknown action, gender, out of range pick, stale revision and wrong question rejected", () => {
  const s = newSession();
  assert.throws(() =>
    applyAction(s, { action: "start", gender: "x", revision: 0 }),
  );
  applyAction(s, { action: "start", gender: "male", revision: 0 });
  for (const x of [
    { action: "bogus" },
    { action: "answer", questionId: "F02", pick: 0 },
    { action: "answer", questionId: "F01", pick: 4 },
    { action: "answer", questionId: "F01", pick: 0, revision: 0 },
  ])
    assert.throws(() => applyAction(s, { revision: s.revision, ...x }));
  assert.equal(s.answers.length, 0);
});
test("directional distance scoring is weighted, nonbinary and D6 uses inverse polarity", () => {
  const qs = questionsFor("female"),
    answers = qs.map((q) => ({ id: q.id, pick: 1, activeMs: 10000 })),
    a = assess(qs, answers);
  const expected = Math.round(
    qs.reduce(
      (s, q) => s + (1 - q.benchmark.optionDistances[1]) * 100 * q.weight,
      0,
    ) / qs.reduce((s, q) => s + q.weight, 0),
  );
  assert.equal(a.score, expected);
  assert.equal(a.metrics.length, 6);
  assert.equal(a.calibrationAbility, null);
  assert(a.rows.some((r) => r.fit > 0 && r.fit < 100));
  assert(a.metrics.slice(0, 5).every((m) => m.value >= 0 && m.value <= 100));
  assert.equal(a.metrics[5].value, null);
});
test("hidden time and revisited questions are excluded from fast classification", () => {
  const s = newSession();
  applyAction(s, { action: "start", gender: "male", revision: 0 }, 0);
  applyAction(s, { action: "pause", revision: s.revision }, 1000);
  applyAction(s, { action: "resume", revision: s.revision }, 600000);
  applyAction(
    s,
    { action: "answer", revision: s.revision, questionId: "F01", pick: 0 },
    601000,
  );
  assert.equal(s.answers[0].activeMs, 1500);
  assert.equal(s.answers[0].revisited, true);
  const a = assess(
    questionsFor("male"),
    complete("male").answers.map((x) => ({
      ...x,
      activeMs: 100,
      revisited: true,
    })),
  );
  assert.equal(a.fast, false);
  assert.equal(a.timingSamples, 0);
});
function harness() {
  const db = new Map();
  let clock = 0;
  const service = new GameService(
    {
      get: async (k) => structuredClone(db.get(k)),
      put: async (k, v) => db.set(k, structuredClone(v)),
    },
    { now: () => (clock += 1000) },
  );
  let rev = 0,
    counter = 0;
  const id = "test";
  return {
    db,
    service,
    call: async (action, extras = {}) => {
      const r = await service.handle(
        id,
        new Request("http://localhost/api/" + (action ? "action" : "game"), {
          method: action ? "POST" : "GET",
          headers: action
            ? { Origin: "http://localhost", "Content-Type": "application/json" }
            : {},
          ...(action
            ? {
                body: JSON.stringify({
                  action,
                  revision: rev,
                  requestId: "request-" + ++counter,
                  ...extras,
                }),
              }
            : {}),
        }),
      );
      const body = await r.json();
      if (r.ok) rev = body.revision;
      return { status: r.status, body };
    },
  };
}
test("API reveals only current view, all interpretations withheld until final answer", async () => {
  const h = harness();
  assert.equal((await h.call()).body.screen, "entry");
  const start = await h.call("start", { gender: "male" });
  assert(!JSON.stringify(start.body).includes("optionDistances"));
  assert(!start.body.share);
  for (let i = 0; i < 20; i++) {
    const q = questionsFor("male")[i],
      state = h.db.get("test");
    assert.equal(state.index, i);
    const v = await h.call("answer", {
      questionId: q.id,
      pick: best(q),
      score: 100,
      typeId: "forged",
    });
    assert.equal(v.status, 200);
    if (i < 19) {
      assert.equal(v.body.screen, "play");
      assert(!v.body.share);
      assert(!v.body.html.includes("研究方向"));
      assert(!v.body.html.includes("心理锚点"));
    } else {
      assert.equal(v.body.screen, "report");
      assert(v.body.share.url.endsWith("/?from=report"));
      assert.equal(
        (v.body.html.match(/class="scene-review"/g) || []).length,
        20,
      );
      assert(!/超过[0-9]+%/.test(v.body.html));
      assert(v.body.html.includes("异性使用说明书"));
      assert(v.body.html.includes("脑补指数"));
    }
  }
  const persisted = h.db.get("test");
  assert.notEqual(persisted.report.type.id, "forged");
  assert.equal(persisted.answers.length, 20);
});
test("API duplicate request id is idempotent and concurrent taps cannot skip a scene", async () => {
  const h = harness();
  await h.call();
  await h.call("start", { gender: "female" });
  const rev = h.db.get("test").revision;
  const request = () =>
    new Request("http://localhost/api/action", {
      method: "POST",
      headers: {
        Origin: "http://localhost",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "answer",
        questionId: "M01",
        pick: 0,
        revision: rev,
        requestId: "same-request",
      }),
    });
  const results = await Promise.all([
    h.service.handle("test", request()),
    h.service.handle("test", request()),
  ]);
  assert(results.every((r) => r.status === 200));
  assert.equal(h.db.get("test").index, 1);
  assert.equal(h.db.get("test").answers.length, 1);
});
test("API rejects cross-origin, premature poster and oversized body", async () => {
  const h = harness();
  assert.equal(
    (
      await h.service.handle(
        "test",
        new Request("http://localhost/api/poster.svg"),
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await h.service.handle(
        "test",
        new Request("http://localhost/api/action", {
          method: "POST",
          headers: {
            Origin: "https://evil.example",
            "Content-Type": "application/json",
          },
          body: "{}",
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await h.service.handle(
        "test",
        new Request("http://localhost/api/action", {
          method: "POST",
          headers: {
            Origin: "http://localhost",
            "Content-Type": "application/json",
          },
          body: "x".repeat(2050),
        }),
      )
    ).status,
    413,
  );
});
test("report evidence only uses actual choices, no fabricated misses", () => {
  const s = complete(),
    r = reportData(s);
  assert.equal(r.misses.length, 0);
  assert.equal(r.archive.length, 20);
  for (const e of r.archive)
    assert.equal(
      e.selected,
      questionsFor("male").find((q) => q.id === e.id).choices[
        s.answers.find((a) => a.id === e.id).pick
      ],
    );
  assert.equal(TYPES.length, 12);
  assert.equal(r.metrics[5].lowerIsBetter, true);
});
test("AI cannot alter classification and unsafe or unavailable copy falls back", async () => {
  const r = reportData(complete()),
    fake = (copy) => async () =>
      Response.json({
        output: [
          { content: [{ type: "output_text", text: JSON.stringify(copy) }] },
        ],
      });
  assert.strictEqual(await enhanceCopy(r), r);
  assert.strictEqual(
    await enhanceCopy(r, {
      key: "mock",
      model: "mock",
      fetcher: fake({
        typeId: "wrong",
        opening: "x".repeat(50),
        closing: "y".repeat(50),
      }),
    }),
    r,
  );
  assert.strictEqual(
    await enhanceCopy(r, {
      key: "mock",
      model: "mock",
      fetcher: async () => {
        throw Error("offline");
      },
    }),
    r,
  );
  const opening =
    r.strongest.selected +
    "，你听见了这一次的线索，也给另一个人的解释留了空间，这个观察可以带进下一次聊天。";
  const next = await enhanceCopy(r, {
    key: "mock",
    model: "mock",
    fetcher: fake({
      typeId: r.type.id,
      opening,
      closing:
        "别急着把报告当作答案，先把它当作一个话题，猜得准的时候也可以问问对方，给真实的关系留一点自由。",
    }),
  });
  assert.equal(next.copy.kind, "ai");
  assert.equal(next.type, r.type);
  assert.equal(next.score, r.score);
});
test("public frontend contains no domain logic, bank, persisted answers or classifiers", async () => {
  const code = await fs.readFile("frontend/client/app.mjs", "utf8");
  assert(
    !/questionsFor|assess\(|classify\(|optionDistances|localStorage|commitAnswer|makeReport|benchmark/.test(
      code,
    ),
  );
  const build = await fs.readFile("scripts/build-v2.mjs", "utf8");
  assert(!build.includes("cpSync('backend'"));
});
test("all twelve fixed V2 personalities reachable from complete opposite-sex answers", () => {
  assert.equal(Object.keys(fixtures).length, 12);
  for (const [id, fixture] of Object.entries(fixtures)) {
    const qs = questionsFor(fixture.gender);
    assert.equal(fixture.answers.length, 20);
    assert.equal(classify(assess(qs, fixture.answers)).id, id);
    const reversed = fixture.answers.slice().reverse();
    assert.equal(classify(assess(qs, reversed)).id, id);
  }
});
