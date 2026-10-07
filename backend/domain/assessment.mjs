import { DIMENSIONS } from "../content/research.mjs";
export const TYPES = [
  [
    "情绪雷达型",
    "Emotional Radar",
    "细微变化，你总能先听见。",
    [1, 0, 0, 0, 0, 1],
  ],
  [
    "潜台词翻译官",
    "Subtext Translator",
    "别人听见一句话，你顺手翻译了下一句。",
    [1, 1, 0, 0, 0, 0],
  ],
  [
    "行为侦探",
    "Behavior Detective",
    "你先看TA做了什么，再听TA说了什么。",
    [0, 1, 0.5, 0, 0, 0],
  ],
  [
    "理性拆解者",
    "Rational Decoder",
    "关系刚开口，你的解决方案已经在排队。",
    [0.4, 1, 0, 0, 1, 0],
  ],
  [
    "共情型玩家",
    "Empathic Reader",
    "你愿意走进TA的心里，记得也问问门牌。",
    [1, 0, 1, 0, 0, 1],
  ],
  [
    "安全感侦测器",
    "Security Reader",
    "一个头像变化，你就开始研究天气。",
    [0, 0, 1, 0, 0, 0],
  ],
  [
    "恋爱现实主义者",
    "Relationship Realist",
    "心动之外，你还会算时间、距离和生活。",
    [0, 0, 0, 1, 1, 0],
  ],
  [
    "浪漫解码者",
    "Romantic Reader",
    "礼物里的小心思，你比包装先看见。",
    [1, 0, 0, 1, 0, 0],
  ],
  [
    "性别思维翻译器",
    "Gender Translator",
    "你知道“平均如此”，不等于“TA必须如此”。",
    [0.2, 0.2, 0.2, 0.2, 0.2, 1],
  ],
  [
    "性别刻板印象型",
    "Stereotype Thinker",
    "经验很有用，但别让“男人女人都这样”抢答。",
    null,
  ],
  [
    "直觉型读心者",
    "Intuitive Reader",
    "第一反应很快，给第二种解释留个位。",
    null,
  ],
  ["异性观察家", "Gender Observer", "会猜，也知道什么时候该直接问。", null],
].map(([name, english, quote, weights], i) => ({
  id: "type-" + String(i + 1).padStart(2, "0"),
  number: i + 1,
  name,
  english,
  quote,
  weights,
}));
export const RULE_VERSION = "v2-directional-2";
const mean = (rows, fn) =>
  rows.reduce((sum, r) => sum + fn(r) * r.q.weight, 0) /
  rows.reduce((s, r) => s + r.q.weight, 0);
export function assess(questions, answers) {
  const rows = questions.map((q) => {
    const a = answers.find((a) => a.id === q.id);
    if (!a) throw new Error("Complete run required");
    return { q, a, fit: 100 * (1 - q.benchmark.optionDistances[a.pick]) };
  });
  const score = Math.round(mean(rows, (r) => r.fit));
  const calibration = rows.filter((r) => r.q.calibration);
  const threat = rows.filter((r) => r.q.threatOptions.length);
  const calibrationDeviation = Math.round(
    mean(calibration, (r) => r.q.benchmark.optionDistances[r.a.pick] * 100),
  );
  const attributionRows = calibration.filter(
    (r) =>
      r.a.reason?.version === 1 &&
      r.a.reason.text === r.q.reasons?.[r.a.pick]?.text &&
      r.a.reason.generalization === r.q.reasons[r.a.pick].generalization,
  );
  const attributionEvidence = attributionRows.filter(
    (r) => r.a.reason.generalization,
  );
  const overAttribution = attributionRows.length
    ? Math.round((attributionEvidence.length / attributionRows.length) * 100)
    : null;
  const stereotype =
    overAttribution === null
      ? null
      : Math.round(0.4 * calibrationDeviation + 0.6 * overAttribution);
  const threatEvidence = threat.filter((r) =>
    r.q.threatOptions.includes(r.a.pick),
  );
  const imagination = threat.length
    ? Math.round((100 * threatEvidence.length) / threat.length)
    : 0;
  const values = DIMENSIONS.map((d) =>
    d.id === "D6"
      ? stereotype
      : Math.round(
          mean(
            rows.filter((r) => r.q.dimensions.includes(d.id)),
            (r) => r.fit,
          ),
        ),
  );
  const valid = rows.filter(
    (r) => !r.a.revisited && r.a.activeMs >= 800 && r.a.activeMs <= 180000,
  );
  const fast =
    valid.length >= 15 &&
    valid.filter((r) => r.a.activeMs <= 8000).length / valid.length >= 0.7;
  return {
    version: RULE_VERSION,
    score,
    metrics: DIMENSIONS.map((d, i) => ({ ...d, value: values[i] })),
    calibrationAbility: stereotype === null ? null : 100 - stereotype,
    stereotype,
    calibrationDeviation,
    overAttribution,
    attributionCount: attributionEvidence.length,
    attributionTotal: attributionRows.length,
    attributionEvidence,
    imagination,
    fast,
    timingSamples: valid.length,
    strongest: rows.slice().sort((a, b) => b.fit - a.fit)[0],
    misses: rows.filter((r) => r.fit < 75).sort((a, b) => a.fit - b.fit),
    calibrationEvidence: calibration.slice().sort((a, b) => a.fit - b.fit),
    threatEvidence,
    threatCount: threatEvidence.length,
    threatTotal: threat.length,
    rows,
  };
}
export function classify(a) {
  const v = a.metrics.map((m) =>
    m.value === null ? null : m.lowerIsBetter ? 100 - m.value : m.value,
  );
  if (
    a.attributionTotal >= 4 &&
    a.score >= 85 &&
    v.slice(0, 5).every((x) => x >= 70) &&
    a.calibrationAbility >= 85 &&
    a.imagination <= 25
  )
    return TYPES[11];
  if (a.attributionTotal >= 4 && a.attributionCount >= 3) return TYPES[9];
  if (
    a.fast &&
    a.score >= 55 &&
    a.calibrationAbility >= 40 &&
    a.calibrationAbility < 85
  )
    return TYPES[10];
  // A conjunction distinguishes empathy from the two single-channel profiles.
  if (v[0] >= 75 && v[2] >= 75 && v[5] >= 70 && v[1] < 75) return TYPES[4];
  const rank = TYPES.filter((t) => t.weights).map((t) => ({
    t,
    value:
      t.weights.reduce((s, w, i) => s + (v[i] === null ? 0 : w * v[i]), 0) /
      t.weights.reduce((s, w, i) => s + (v[i] === null ? 0 : w), 0),
  }));
  rank.sort((a, b) => b.value - a.value || a.t.number - b.t.number);
  return rank[0].t;
}
