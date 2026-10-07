import test from "node:test";
import assert from "node:assert/strict";
import { newSession, applyAction } from "../../backend/domain/session.mjs";
test("native double-click tail cannot answer a new scene or navigate back twice", () => {
  const s = newSession();
  applyAction(
    s,
    { action: "start", gender: "male", revision: 0, clickCount: 1 },
    0,
  );
  applyAction(
    s,
    {
      action: "answer",
      questionId: "F01",
      pick: 0,
      revision: s.revision,
      clickCount: 1,
    },
    1000,
  );
  assert.throws(
    () =>
      applyAction(
        s,
        {
          action: "answer",
          questionId: "F02",
          pick: 1,
          revision: s.revision,
          clickCount: 2,
        },
        2200,
      ),
    (e) => e.status === 425,
  );
  assert.equal(s.index, 1);
  assert.equal(s.answers.length, 1);
  applyAction(
    s,
    {
      action: "answer",
      questionId: "F02",
      pick: 1,
      revision: s.revision,
      clickCount: 1,
    },
    2300,
  );
  applyAction(s, { action: "back", revision: s.revision, clickCount: 1 }, 3300);
  assert.throws(
    () =>
      applyAction(
        s,
        { action: "back", revision: s.revision, clickCount: 2 },
        4300,
      ),
    (e) => e.status === 425,
  );
  assert.equal(s.index, 1);
  assert.throws(
    () =>
      applyAction(
        s,
        { action: "back", revision: s.revision, clickCount: "2" },
        4300,
      ),
    (e) => e.status === 400,
  );
});
