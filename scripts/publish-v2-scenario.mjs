import fs from "node:fs";
import path from "node:path";
import { QUESTIONS } from "../backend/content/bank.mjs";
import { validateDraft } from "../backend/services/scenario-drafts.mjs";
const file = process.argv[2],
  reviewer = process.argv[3];
if (!file || !reviewer)
  throw Error(
    "Usage: node scripts/publish-v2-scenario.mjs artifacts/v2-drafts/file.json reviewer-name",
  );
const resolved = path.resolve(file);
if (!resolved.startsWith(path.resolve("artifacts/v2-drafts") + path.sep))
  throw Error("Only local scenario drafts may be published.");
const draft = JSON.parse(fs.readFileSync(resolved, "utf8")),
  q = QUESTIONS.find((q) => q.id === draft.questionId);
if (
  !q ||
  !validateDraft(draft, q) ||
  draft.status !== "draft" ||
  draft.pilotBenchmark !== null
)
  throw Error("Invalid immutable-KB draft.");
const dest = "backend/content/approved-scenarios.json",
  rows = JSON.parse(fs.readFileSync(dest));
if (
  rows.some(
    (v) => v.questionId === draft.questionId && v.context === draft.context,
  )
)
  throw Error("Already published.");
rows.push({
  ...draft,
  status: "approved",
  reviewRequired: false,
  reviewedBy: reviewer,
  reviewedAt: new Date().toISOString(),
});
fs.writeFileSync(dest, JSON.stringify(rows, null, 2));
console.log(
  "Approved variant added. Rebuild and deploy to activate for replay.",
);
