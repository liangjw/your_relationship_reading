import { RULE_VERSION } from "../domain/assessment.mjs";
import { QUESTIONS } from "../content/bank.mjs";
import { SOURCES } from "../content/research.mjs";
export function validateDraft(draft, q) {
  return (
    draft &&
    draft.questionId === q.id &&
    draft.targetGender === q.targetGender &&
    draft.scenarioFamily === q.scenarioFamily &&
    JSON.stringify(draft.dimensions) === JSON.stringify(q.dimensions) &&
    JSON.stringify(draft.sourceRefs) === JSON.stringify(q.sourceRefs) &&
    typeof draft.context === "string" &&
    draft.context.length >= 30 &&
    draft.context.length <= 220 &&
    draft.context !== q.context &&
    !/[<>]|研究表明|心理学证明|所有男|所有女|天生|\d\s*%/.test(draft.context)
  );
}
export async function generateScenarioDraft(
  questionId,
  { key, model = "gpt-4.1-mini", fetcher = fetch } = {},
) {
  const q = QUESTIONS.find((q) => q.id === questionId);
  if (!q) throw Object.assign(new Error("未知题目。"), { status: 400 });
  if (!key)
    throw Object.assign(new Error("AI 服务尚未配置。"), { status: 503 });
  const constants = {
    questionId: q.id,
    targetGender: q.targetGender,
    scenarioFamily: q.scenarioFamily,
    dimensions: q.dimensions,
    sourceRefs: q.sourceRefs,
  };
  const input = {
    ...constants,
    originalContext: q.context,
    choices: q.choices,
    anchor: q.anchor,
    research: q.sourceRefs.map((k) => ({ id: k, ...SOURCES[k] })),
    direction: q.direction,
    confidence: q.confidence,
  };
  const r = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      model,
      store: false,
      input: [
        {
          role: "system",
          content:
            "为中国22到35岁日常关系观察游戏生成一个同题族的新情境草稿。仅改时间、职业、生活物件与对话措辞，保留原核心事实、关系阶段、目标性别、线索强度和四个原选项的可用性。不得添加心理解释、暗示结论、学术或群体规律、人群概率，不能改来源、维度、基准。写成一段自然的生活瞬间和最后的预测问题，30至180个汉字。结构字段按输入原样返回。该草稿必须经产品内容审核，不能宣称已验证。",
        },
        { role: "user", content: JSON.stringify(input) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "scenario_draft",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [...Object.keys(constants), "context"],
            properties: {
              questionId: { type: "string", enum: [q.id] },
              targetGender: { type: "string", enum: [q.targetGender] },
              scenarioFamily: { type: "string", enum: [q.scenarioFamily] },
              dimensions: {
                type: "array",
                items: { type: "string", enum: q.dimensions },
              },
              sourceRefs: {
                type: "array",
                items: { type: "string", enum: q.sourceRefs },
              },
              context: { type: "string" },
            },
          },
        },
      },
      max_output_tokens: 700,
    }),
  });
  if (!r.ok) {
    const error = await r.json().catch(() => ({}));
    throw Object.assign(new Error("新情境生成暂不可用。"), {
      status: 502,
      providerStatus: r.status,
      providerCode: error.error?.code || null,
    });
  }
  const data = await r.json(),
    draft = JSON.parse(
      data.output
        ?.flatMap((x) => x.content || [])
        .filter((x) => x.type === "output_text")
        .map((x) => x.text)
        .join(""),
    );
  if (!validateDraft(draft, q))
    throw Object.assign(new Error("生成草稿未通过结构与内容校验。"), {
      status: 422,
    });
  return {
    ...draft,
    status: "draft",
    generatedAt: new Date().toISOString(),
    reviewRequired: true,
    benchmarkVersion: RULE_VERSION,
    pilotBenchmark: null,
  };
}
export function findScenarioFamily({ family, gender, dimension }) {
  return QUESTIONS.filter(
    (q) =>
      (!family || q.scenarioFamily === family) &&
      (!gender || q.targetGender === gender) &&
      (!dimension || q.dimensions.includes(dimension)),
  ).map((q) => ({
    id: q.id,
    targetGender: q.targetGender,
    scenarioFamily: q.scenarioFamily,
    dimensions: q.dimensions,
    sourceRefs: q.sourceRefs,
  }));
}
