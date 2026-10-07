import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, questionsFor } from "../../backend/content/bank.mjs";
import { assess, classify } from "../../backend/domain/assessment.mjs";
import { newSession, applyAction } from "../../backend/domain/session.mjs";
import {
  generateScenarioDraft,
  validateDraft,
  findScenarioFamily,
} from "../../backend/services/scenario-drafts.mjs";
const best = (q) =>
  q.benchmark.optionDistances.indexOf(Math.min(...q.benchmark.optionDistances));
const answerSet = (qs) =>
  qs.map((q) => ({
    id: q.id,
    pick: best(q),
    activeMs: 10000,
    revisited: false,
  }));

test("correct directional prediction can use gender generalization while deviation can use contextual reasons", () => {
  const qs = questionsFor("female"),
    a = answerSet(qs),
    b = answerSet(qs);
  a.find((x) => x.id === "M20").pick = 1;
  b.find((x) => x.id === "M12").pick = 3;
  for (const set of [a, b])
    for (const answer of set) {
      const q = qs.find((q) => q.id === answer.id);
      answer.reason = q.reasons
        ? { ...q.reasons[answer.pick], version: 1 }
        : null;
    }
  const first = assess(qs, a),
    second = assess(qs, b);
  assert.equal(first.attributionCount, 1);
  assert.equal(first.rows.find((x) => x.q.id === "M20").fit, 80);
  assert.equal(second.attributionCount, 0);
  assert(second.calibrationDeviation > first.calibrationDeviation);
  assert.notEqual(classify(second).id, "type-10");
  const c = answerSet(qs);
  for (const id of ["M08", "M09", "M12"])
    c.find((x) => x.id === id).pick = { M08: 2, M09: 0, M12: 0 }[id];
  for (const answer of c) {
    const q = qs.find((q) => q.id === answer.id);
    answer.reason = q.reasons
      ? { ...q.reasons[answer.pick], version: 1 }
      : null;
  }
  assert.equal(classify(assess(qs, c)).id, "type-10");
});
test("negative or emotional options are not automatically relationship threats", () => {
  for (const [id, pick] of [
    ["M01", 2],
    ["M02", 3],
    ["M06", 3],
    ["M07", 3],
    ["F01", 3],
    ["F10", 3],
  ])
    assert(
      !QUESTIONS.find((q) => q.id === id).threatOptions.includes(pick),
      id,
    );
  const qs = questionsFor("female"),
    answers = answerSet(qs);
  answers.find((x) => x.id === "M01").pick = 2;
  assert.equal(assess(qs, answers).threatCount, 0);
  answers.find((x) => x.id === "M05").pick = 3;
  const a = assess(qs, answers);
  assert.equal(a.threatCount, 1);
  assert.equal(a.threatEvidence[0].q.id, "M05");
});
test("every scenario has its own transfer limitation; unsupported single preferences are tied", () => {
  for (const q of QUESTIONS) {
    assert(q.transferNote.length > 15);
    assert(["B", "C"].includes(q.transferGrade));
    assert(q.weight <= { A: 1, B: 0.65, C: 0.3 }[q.evidenceGrade]);
    assert(q.explanation.includes(q.transferNote));
  }
  assert.deepEqual(
    QUESTIONS.find((q) => q.id === "M14").benchmark.optionDistances.slice(0, 3),
    [0.15, 0.15, 0.15],
  );
  assert.equal(
    new Set(QUESTIONS.find((q) => q.id === "M20").benchmark.optionDistances)
      .size,
    1,
  );
  assert.equal(
    QUESTIONS.find((q) => q.id === "F08").scenarioFamily,
    "social-media-jealousy",
  );
  assert.equal(
    QUESTIONS.find((q) => q.id === "F13").scenarioFamily,
    "care-investment",
  );
});
test("server rejects tail click even with the next valid question and fresh revision", () => {
  const s = newSession();
  applyAction(s, { action: "start", gender: "male", revision: 0 }, 0);
  applyAction(
    s,
    { action: "answer", questionId: "F01", pick: 0, revision: s.revision },
    1000,
  );
  assert.throws(
    () =>
      applyAction(
        s,
        { action: "answer", questionId: "F02", pick: 0, revision: s.revision },
        1100,
      ),
    (e) => e.status === 425,
  );
  assert.equal(s.index, 1);
  assert.equal(s.answers.length, 1);
  applyAction(
    s,
    { action: "answer", questionId: "F02", pick: 0, revision: s.revision },
    1500,
  );
  assert.equal(s.index, 2);
});
test("AI draft generation locks scientific fields, remains unapproved and supports tag retrieval", async () => {
  const q = QUESTIONS.find((q) => q.id === "M05");
  const draft = {
    questionId: q.id,
    targetGender: q.targetGender,
    scenarioFamily: q.scenarioFamily,
    dimensions: q.dimensions,
    sourceRefs: q.sourceRefs,
    context:
      "下班后两人为了周末安排争执。他把工牌放到桌边，说：“我们先歇一会，明晚再把事情聊清楚。”你猜他此刻更可能在想什么？",
  };
  let payload;
  const result = await generateScenarioDraft(q.id, {
    key: "mock",
    fetcher: async (_, input) => {
      payload = JSON.parse(input.body);
      return Response.json({
        output: [
          { content: [{ type: "output_text", text: JSON.stringify(draft) }] },
        ],
      });
    },
  });
  assert.equal(result.status, "draft");
  assert.equal(result.reviewRequired, true);
  assert.equal(result.pilotBenchmark, null);
  assert.equal(payload.store, false);
  assert(validateDraft(draft, q));
  assert(!validateDraft({ ...draft, sourceRefs: ["S1"] }, q));
  assert(
    !validateDraft(
      { ...draft, context: draft.context + "研究表明90%的人如此。" },
      q,
    ),
  );
  assert(
    findScenarioFamily({
      family: "withdrawal",
      gender: "male",
      dimension: "D2",
    }).some((x) => x.id === "M05"),
  );
  await assert.rejects(
    generateScenarioDraft(q.id, {
      key: "mock",
      fetcher: async () =>
        Response.json(
          { error: { code: "credit_balance_exhausted" } },
          { status: 429 },
        ),
    }),
    (e) =>
      e.providerStatus === 429 && e.providerCode === "credit_balance_exhausted",
  );
});
