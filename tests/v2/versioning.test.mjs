import test from "node:test";
import assert from "node:assert/strict";
import { questionsFor, QUESTIONS } from "../../backend/content/bank.mjs";
import {
  assess,
  classify,
  RULE_VERSION,
} from "../../backend/domain/assessment.mjs";
import {
  newSession,
  applyAction,
  sessionQuestions,
} from "../../backend/domain/session.mjs";
import { GameService } from "../../backend/services/game.mjs";
import { reportData, present } from "../../backend/presentation/views.mjs";
import { poster } from "../../backend/presentation/poster.mjs";
import { enhanceCopy } from "../../backend/services/narrative.mjs";
const best = (q) =>
  q.benchmark.optionDistances.indexOf(Math.min(...q.benchmark.optionDistances));
function complete() {
  const s = newSession();
  applyAction(s, { action: "start", gender: "female", revision: 0 }, 0);
  for (const q of sessionQuestions(s))
    applyAction(
      s,
      {
        action: "answer",
        questionId: q.id,
        pick: best(q),
        revision: s.revision,
      },
      (s.index + 1) * 1000,
    );
  return s;
}
function serviceFor(s) {
  let saved = structuredClone(s);
  return {
    service: new GameService({
      get: async () => structuredClone(saved),
      put: async (_, v) => (saved = structuredClone(v)),
    }),
    get: () => saved,
  };
}
test("old answers without displayed reason provenance are never attributed new gender reasons", () => {
  const qs = questionsFor("female"),
    answers = qs.map((q) => ({ id: q.id, pick: best(q), activeMs: 10000 }));
  answers.find((a) => a.id === "M20").pick = 1;
  const a = assess(qs, answers);
  assert.equal(a.attributionTotal, 0);
  assert.equal(a.attributionCount, 0);
  assert.equal(a.overAttribution, null);
  assert.equal(a.stereotype, null);
  assert.equal(a.calibrationAbility, null);
  assert.notEqual(classify(a).id, "type-12");
  assert.notEqual(classify(a).id, "type-10");
  const s = {
    ...newSession(),
    screen: "report",
    playerGender: "female",
    questions: structuredClone(qs),
    answers,
  };
  const report = reportData(s),
    html = present(s, "http://localhost", report).html;
  assert(html.includes("未评估"));
  assert(html.includes("未记录可核验的判断依据"));
  assert(!html.includes("null/100"));
  assert(!report.bugs[2].includes("没有选中"));
  assert(poster(report, "http://localhost").includes("未评估"));
});
test("old sessions and cached reports restart safely while keeping historical answers", async () => {
  const old = {
    ...complete(),
    version: 2,
    ruleVersion: undefined,
    questions: undefined,
    report: { type: { id: "type-01" }, version: "v2-directional-1" },
  };
  const h = serviceFor(old);
  const r = await h.service.handle(
    "old",
    new Request("http://localhost/api/game"),
  );
  assert.equal(r.status, 200);
  const v = await r.json();
  assert.equal(v.screen, "entry");
  assert(v.html.includes("上次记录已保留"));
  assert.deepEqual(h.get().previousRun.answers, old.answers);
  assert.equal(h.get().report, undefined);
  const poster = await h.service.handle(
    "old",
    new Request("http://localhost/api/poster.svg"),
  );
  assert.equal(poster.status, 409);
});
test("same-version sessions regenerate incompatible report caches before rendering", async () => {
  const s = complete();
  s.report = { version: "old", type: { id: "type-01" } };
  const h = serviceFor(s);
  const r = await h.service.handle(
    "old",
    new Request("http://localhost/api/game"),
  );
  assert.equal(r.status, 200);
  assert.equal((await r.json()).screen, "report");
  assert.equal(h.get().report.version, RULE_VERSION);
  assert.equal(h.get().report.archive.length, 20);
});
test("a started run freezes contexts, options, scoring and actual reason evidence", () => {
  const s = newSession();
  applyAction(s, { action: "start", gender: "female", revision: 0 }, 0);
  const q = QUESTIONS.find((q) => q.id === "M01"),
    original = q.context;
  try {
    q.context = "新版情境，不应替换正在玩的这一局";
    assert.equal(sessionQuestions(s)[0].context, original);
    for (const current of sessionQuestions(s))
      applyAction(
        s,
        {
          action: "answer",
          questionId: current.id,
          pick: current.id === "M20" ? 1 : best(current),
          revision: s.revision,
        },
        (s.index + 1) * 1000,
      );
    const report = reportData(s);
    assert.equal(report.archive[0].context, original);
    const answer = s.answers.find((a) => a.id === "M20");
    assert.equal(answer.reason.version, 1);
    assert.equal(answer.ruleVersion, RULE_VERSION);
    assert.equal(
      report.archive.find((a) => a.id === "M20").reason,
      answer.reason.text,
    );
    assert.equal(report.attributionCount, 1);
  } finally {
    q.context = original;
  }
});
test("humorous report copy stays within PRD one to three sentences", async () => {
  const r = reportData(complete());
  assert(
    (r.copy.opening + r.copy.closing)
      .split(/[。！？!?]+/)
      .filter((x) => x.trim()).length <= 3,
  );
  const copy = {
    typeId: r.type.id,
    opening:
      r.strongest.selected +
      "。你猜得很有画面。可以留一点空间让本人来解释，这份报告是话题也是一次轻松的观察。",
    closing:
      "先看看另一种解释。再聊聊彼此的感受。给现实中的人留一个说话的位置，也许可以从一个简单的问题开始。",
  };
  const next = await enhanceCopy(r, {
    key: "mock",
    model: "mock",
    fetcher: async () =>
      Response.json({
        output: [
          { content: [{ type: "output_text", text: JSON.stringify(copy) }] },
        ],
      }),
  });
  assert.strictEqual(next, r);
});
