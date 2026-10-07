import raw from "./prd-questions.json" with { type: "json" };
import { CALIBRATION_REASONS } from "./calibration.mjs";
import { TRANSFER } from "./transfer.mjs";
import variants from "./approved-scenarios.json" with { type: "json" };
// Ordinal interpretation coordinates, not four-option population probabilities.
// All benchmark values below are product hypotheses pending Chinese pilot data.
// id : dimensions, evidence grade, option distances, sources, calibration, threat options
const CONFIG = {
  M01: ["21", "B", [0.55, 0, 0.8, 0.3], "24", false, []],
  M02: ["21", "B", [0, 0.15, 0.35, 0.9], "24", false, []],
  M03: ["1", "A", [0.15, 0.6, 0.15, 0.3], "4", false, []],
  M04: ["12", "B", [0, 0.25, 0.4, 0.55], "24", false, []],
  M05: ["23", "A", [0.9, 0, 0.95, 1], "23", false, [0, 2, 3]],
  M06: ["2", "B", [0, 0.65, 0.3, 0.85], "2", false, []],
  M07: ["21", "B", [0.6, 0, 0.2, 0.8], "24", false, []],
  M08: ["56", "C", [0.25, 0.15, 0.65, 0.25], "1", true, []],
  M09: ["36", "C", [0.8, 0.1, 0.25, 0.35], "19", true, [0]],
  M10: ["31", "B", [0.25, 0, 0.65, 0.35], "34", false, [2]],
  M11: ["23", "B", [0, 0.7, 0.2, 0.65], "23", false, [1]],
  M12: ["36", "C", [0.6, 0, 0.35, 0.85], "19", true, [3]],
  M13: ["56", "B", [0.35, 0, 0.9, 0.45], "15", true, [2]],
  M14: ["4", "A", [0.15, 0.15, 0.15, 0.8], "56", false, []],
  M15: ["45", "B", [0.15, 0.2, 0.15, 0.15], "56", false, []],
  M16: ["45", "B", [0.15, 0.15, 0.5, 0.65], "56", false, []],
  M17: ["5", "B", [0.25, 0, 0.2, 0.6], "78", false, []],
  M18: ["5", "A", [0.45, 0, 0.25, 0.15], "8", false, []],
  M19: ["5", "B", [0.2, 0, 0.7, 0.3], "7", false, []],
  M20: ["56", "B", [0.2, 0.2, 0.2, 0.2], "17", true, []],
  F01: ["1", "B", [0.4, 0, 0.25, 0.65], "4", false, []],
  F02: ["1", "B", [0.5, 0, 0.85, 0.65], "4", false, []],
  F03: ["15", "B", [0, 0.7, 0.75, 0.6], "14", false, []],
  F04: ["16", "B", [0.45, 0, 0.65, 0.15], "110", true, []],
  F05: ["2", "B", [0.9, 0, 1, 0.75], "2", false, [0, 2]],
  F06: ["2", "B", [0.6, 0, 0.7, 0.95], "2", false, [2, 3]],
  F07: ["23", "B", [0.35, 0, 0.8, 0.9], "23", false, [2, 3]],
  F08: ["36", "C", [0.7, 0.1, 0.25, 0.15], "19", true, [2]],
  F09: ["3", "B", [0.6, 0, 0.85, 0.2], "3", false, [2]],
  F10: ["5", "B", [0.55, 0, 0.45, 0.95], "7", false, []],
  F11: ["4", "A", [0.1, 0.4, 0.15, 0.1], "56", false, []],
  F12: ["4", "A", [0.85, 0, 0.45, 0.55], "56", false, []],
  F13: ["4", "B", [0.25, 0.1, 0.15, 0.6], "56", false, []],
  F14: ["43", "B", [0.2, 0, 0.45, 0.6], "35", false, []],
  F15: ["12", "B", [0.8, 0, 0.9, 0.85], "24", false, []],
  F16: ["3", "B", [0.25, 0, 0.85, 0.95], "3", false, [2, 3]],
  F17: ["36", "C", [0.45, 0.1, 0.95, 0.2], "19", true, [2]],
  F18: ["5", "B", [0.4, 0, 0.65, 0.6], "7", false, []],
  F19: ["456", "C", [0.55, 0.2, 0, 0.4], "156", true, []],
  F20: ["36", "C", [0.1, 0.5, 0.85, 0.7], "19", true, []],
};
const families = {
  male: [
    "pressure",
    "conflict",
    "disclosure",
    "support",
    "withdrawal",
    "repair",
    "repair",
    "problem-solving",
    "social-media",
    "boundary",
    "reply",
    "visibility",
    "resources",
    "preference",
    "date",
    "commitment",
    "competition",
    "risk",
    "status",
    "ambition",
  ],
  female: [
    "disclosure",
    "disclosure",
    "social-support",
    "emotional-cues",
    "conflict-demand",
    "conflict-evidence",
    "repair-security",
    "social-media-jealousy",
    "boundary",
    "social-competition",
    "resource-preference",
    "long-term-preference",
    "care-investment",
    "distance-tradeoff",
    "validation",
    "reassurance",
    "visibility",
    "social-comparison",
    "relationship-tradeoff",
    "relationship-monitoring",
  ],
};
export const QUESTIONS = raw.map((q, i) => {
  const [dims, grade, distances, refs, calibration, threat] = CONFIG[q.id];
  const [transferGrade, transferNote] = TRANSFER[q.id];
  // S10 is represented explicitly; avoid parsing '110' as S1,S1,S0.
  const sourceRefs =
    q.id === "F04" ? ["S1", "S10"] : [...refs].map((s) => "S" + s);
  return {
    ...q,
    dimensions: [...dims].map((n) => "D" + n),
    evidenceGrade: grade,
    transferGrade,
    transferNote,
    weight: Math.min(
      { A: 1, B: 0.65, C: 0.3 }[grade],
      { A: 1, B: 0.65, C: 0.3 }[transferGrade],
    ),
    confidence: transferGrade === "C" ? "low" : "medium",
    sourceRefs,
    scenarioFamily: families[q.targetGender][i % 20],
    calibration,
    reasons: CALIBRATION_REASONS[q.id] || null,
    threatOptions: threat,
    benchmark: {
      kind: "directional-hypothesis",
      targetGender: q.targetGender,
      optionDistances: distances,
      pilot: null,
    },
    direction:
      q.id === "M14"
        ? "外形和可靠均可能重要。男性相对更重外形，不等于长期二选一一定选外形；研究不提供本题唯一排序。"
        : q.id === "M20"
          ? "本题没有研究支持的唯一排序；生活、事业、关系、休息都可能重要。"
          : q.choices
              .filter((_, index) => distances[index] === Math.min(...distances))
              .join("；也可能："),
    explanation:
      transferNote +
      (calibration
        ? "研究没有给出这四个选项在中国男女中的真实比例；这里保留多个合理解释，避免把性别当成万能答案。"
        : "选项可能有多种动机，方向吻合不意味着现实中的TA一定这样想。"),
  };
});
export function questionsFor(playerGender, edition = 0) {
  if (!["male", "female"].includes(playerGender))
    throw new Error("Invalid gender");
  return QUESTIONS.filter((q) => q.targetGender !== playerGender).map((q) => {
    const approved = variants.filter(
      (v) =>
        v.status === "approved" &&
        !v.reviewRequired &&
        v.questionId === q.id &&
        v.targetGender === q.targetGender &&
        v.scenarioFamily === q.scenarioFamily &&
        JSON.stringify(v.dimensions) === JSON.stringify(q.dimensions) &&
        JSON.stringify(v.sourceRefs) === JSON.stringify(q.sourceRefs),
    );
    return edition > 0 && approved.length
      ? {
          ...q,
          context: approved[(edition - 1) % approved.length].context,
          variantKind: "approved",
          variantCount: approved.length,
        }
      : q;
  });
}
