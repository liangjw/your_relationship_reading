export const SOURCES = {
  S1: {
    title: "Hyde (2005) The Gender Similarities Hypothesis",
    url: "https://doi.org/10.1037/0003-066X.60.6.581",
    scope: "心理变量中的男女分布通常高度重叠，群体方向不能替代具体观察。",
  },
  S2: {
    title: "Woodin (2011) A two-dimensional approach to relationship conflict",
    url: "https://doi.org/10.1037/a0023791",
    scope: "冲突表现存在较小的平均差异，关系情境和改变现状的需要影响行为。",
  },
  S3: {
    title: "Del Giudice (2011) Sex differences in romantic attachment",
    url: "https://doi.org/10.1177/0146167210392789",
    scope: "依恋焦虑与回避的平均差异存在异质性，不推断某人的依恋类型。",
  },
  S4: {
    title: "Dindia & Allen (1992) Sex differences in self-disclosure",
    url: "https://doi.org/10.1037/0033-2909.112.1.106",
    scope: "披露差异较小，受披露对象、关系与测量影响。",
  },
  S5: {
    title:
      "Walter et al. (2020) Sex Differences in Mate Preferences Across 45 Countries · Psychological Science",
    url: "https://doi.org/10.1177/0956797620904154",
    scope: "自陈偏好中的平均差异不等于现实择偶结果。PRD原期刊及DOI信息已核正。",
  },
  S6: {
    title:
      "Eastwick & Finkel (2008) Sex Differences in Mate Preferences Revisited",
    url: "https://doi.org/10.1037/0022-3514.94.2.245",
    scope: "理想伴侣偏好与真实互动中的吸引并不完全一致。",
  },
  S7: {
    title: "Benenson & Abadzi (2020) Contest versus scramble competition",
    url: "https://doi.org/10.1016/j.copsyc.2019.07.013",
    scope: "竞争策略的总体讨论，不能直接证明朋友圈或闺蜜场景的选项。",
  },
  S8: {
    title: "Cross, Copping & Campbell (2011) Sex differences in impulsivity",
    url: "https://doi.org/10.1037/a0021591",
    scope:
      "不同冲动、风险与惩罚敏感指标方向不同。PRD中的 Cheung 作者条目已校正。",
  },
  S9: {
    title:
      "Muscanell et al. (2013) An Analysis of Facebook Use and Romantic Jealousy",
    url: "https://doi.org/10.1089/cyber.2012.0411",
    scope:
      "特定社交媒体情境证据，不能等同于中国微信用户的真实分布。PRD中的 Hudson 作者条目与研究描述不符，采用核验后的论文。",
  },
  S10: {
    title: "Hausfeld et al. (2026) Putting assumptions to the test",
    url: "https://doi.org/10.1037/emo0001733",
    scope: "部分他人导向情绪能力存在平均差异，受测量与情境影响。",
  },
  S11: {
    title: "Mallory (2022) Dimensions of couples sexual communication",
    url: "https://doi.org/10.1037/fam0000946",
    scope: "沟通质量与满意度相关；本局不含性或生育题，不作单题答案依据。",
  },
  S12: {
    title:
      "Braga Takayanagi et al. (2024) What Do Different People Look for in a Partner?",
    url: "https://doi.org/10.1007/s10508-023-02767-4",
    scope: "伴侣偏好的背景参考，个体、关系策略与文化影响大。",
  },
};
export const DIMENSIONS = [
  { id: "D1", label: "情绪雷达", description: "情绪线索读取" },
  { id: "D2", label: "冲突翻译", description: "冲突与修复" },
  { id: "D3", label: "关系安全感", description: "边界、嫉妒与不确定性" },
  { id: "D4", label: "伴侣偏好", description: "关系中的选择与投入" },
  { id: "D5", label: "地位 / 风险", description: "资源、竞争与冒险" },
  {
    id: "D6",
    label: "性别刻板指数",
    description: "性别刻板校准 · 越低越好",
    lowerIsBetter: true,
  },
];
export const DISCLAIMER =
  "本游戏仅用于娱乐与自我观察，不是心理诊断、医学判断、心理咨询或经过临床验证的标准化人格量表。题目与结果参考公开心理学研究，并结合产品自有题库规则生成，不代表所有男性或所有女性，更不能据此判断某一个具体的人。研究中的群体平均差异通常小于人与人之间的个体差异；同一个行为也可能有完全不同的动机。研究样本与中国年轻人的现实生活存在文化、年代与情境差异，因此结果请当作“好玩的观察”，不要当作“判决书”。";
