import fs from "node:fs";
import { questionsFor } from "../backend/content/bank.mjs";
import { assess, classify, TYPES } from "../backend/domain/assessment.mjs";
const fixtures = {};
let seed = 39171;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
for (let i = 0; i < 250000 && Object.keys(fixtures).length < 12; i++) {
  const gender = i % 2 ? "male" : "female",
    qs = questionsFor(gender),
    accuracy = random();
  const answers = qs.map((q) => ({
    id: q.id,
    pick:
      random() < accuracy
        ? q.benchmark.optionDistances.indexOf(
            Math.min(...q.benchmark.optionDistances),
          )
        : Math.floor(random() * 4),
    activeMs: i % 3 === 0 ? 3000 : 10000,
    revisited: false,
  }));
  for (const a of answers) {
    const q = qs.find((q) => q.id === a.id);
    a.reason = q.reasons ? { ...q.reasons[a.pick], version: 1 } : null;
  }
  const a = assess(qs, answers),
    type = classify(a);
  fixtures[type.id] ??= { gender, answers, score: a.score, version: a.version };
}
if (Object.keys(fixtures).length !== 12)
  throw new Error(
    "Unreachable types: " +
      TYPES.filter((t) => !fixtures[t.id])
        .map((t) => t.id)
        .join(","),
  );
fs.writeFileSync(
  "tests/v2/type-fixtures.json",
  JSON.stringify(fixtures, null, 2),
);
console.log("12 fixed types reached from complete 20-answer runs.");
