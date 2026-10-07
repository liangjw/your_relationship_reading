import test from "node:test";
import assert from "node:assert/strict";
import { newSession, applyAction } from "../../backend/domain/session.mjs";
import { present } from "../../backend/presentation/views.mjs";
test("scene music follows message and conflict context rather than chapter index", () => {
  for (const [gender, id, track] of [
    ["female", "M05", "tension"],
    ["female", "M09", "messages"],
    ["female", "M14", "ordinary"],
    ["male", "F05", "tension"],
    ["male", "F08", "tension"],
    ["male", "F11", "ordinary"],
    ["male", "F17", "messages"],
  ]) {
    const s = newSession();
    applyAction(s, { action: "start", gender, revision: 0 }, 0);
    s.index = s.questions.findIndex((q) => q.id === id);
    assert.equal(
      present(s, "http://localhost").audio.src,
      "/audio/" + track + ".wav",
      id,
    );
  }
});
