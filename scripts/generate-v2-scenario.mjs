import fs from "node:fs";
import { generateScenarioDraft } from "../backend/services/scenario-drafts.mjs";
const id = process.argv[2];
if (!/^[MF](0[1-9]|1[0-9]|20)$/.test(id || ""))
  throw Error("Usage: node scripts/generate-v2-scenario.mjs M05");
try {
  const draft = await generateScenarioDraft(id, {
    key: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_REPORT_MODEL || "gpt-4.1-mini",
  });
  fs.mkdirSync("artifacts/v2-drafts", { recursive: true });
  const file = `artifacts/v2-drafts/${id}-${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify(draft, null, 2));
  console.log(
    JSON.stringify({
      created: file,
      status: draft.status,
      reviewRequired: true,
    }),
  );
} catch (e) {
  console.error(
    JSON.stringify({
      error: e.status ? e.message : "草稿生成失败。",
      providerStatus: e.providerStatus,
      providerCode: e.providerCode,
    }),
  );
  process.exitCode = 1;
}
