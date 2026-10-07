import { questionsFor } from "../content/bank.mjs";
import { sessionQuestions } from "../domain/session.mjs";
import { SOURCES, DISCLAIMER } from "../content/research.mjs";
import { assess, classify, TYPES } from "../domain/assessment.mjs";
export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const logo =
  '<div class="game-logo"><b>心动译码<span>。</span></b><small>THE RELATIONSHIP ISSUE / V2</small></div>';
const boardFor = (q) =>
  [
    "risk",
    "status",
    "ambition",
    "competition",
    "resources",
    "disclosure-work",
  ].includes(q.scenarioFamily)
    ? "city"
    : [
          "date",
          "preference",
          "resource-preference",
          "long-term-preference",
          "care-investment",
          "social-support",
          "social-comparison",
          "social-competition",
          "relationship-tradeoff",
        ].includes(q.scenarioFamily)
      ? "cafe"
      : "home";
const art = (board, alt) =>
  `<img class="manga-board" src="/assets/v2-${board}.webp" alt="${alt}" width="1536" height="1024">`;
const t = (g) => (g === "male" ? "他" : "她");
function sceneContext(q) {
  return q.context
    .split(/(“[^”]+”[，。！？]?)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("“")
        ? '<div class="phone-message">' + esc(part) + "</div>"
        : '<p class="scene-caption">' + esc(part) + "</p>",
    )
    .join("");
}

function entry(s) {
  return `${logo}<section class="intro-head"><span class="eyebrow">深夜关系观察 · VOL. 02</span><h1>你真的<br>懂<em>异性</em>吗<span class="question-mark">？</span></h1><p>你以为你很懂。<br>我们来看看。</p></section><div class="intro-comic">${art("cover", "中国都市男女的日常生活漫画")}</div><h2 class="entry-question">我是</h2><div class="gender-entry"><button data-action="start" data-gender="male"><b>男性</b><small>预测她的20个生活瞬间 →</small></button><button data-action="start" data-gender="female"><b>女性</b><small>预测他的20个生活瞬间 →</small></button></div><div class="mini-tags"><span>约 5–7 分钟</span><span>20题</span><span>最后一起揭晓</span></div><p class="tiny-note">无需登录 · 娱乐与自我观察<br>进度由服务器保存，清除浏览器标识后无法恢复。</p>${s.migrationNotice ? `<p class="tiny-note">${esc(s.migrationNotice)}</p>` : ""}${s.playerGender ? '<p class="tiny-note">选择原路线，可以接着上次玩。</p>' : ""}`;
}
function play(s) {
  const q = sessionQuestions(s)[s.index],
    prev = s.answers.find((a) => a.id === q.id),
    chapter =
      s.index < 5
        ? "一句话的距离"
        : s.index < 12
          ? "关系里的小风波"
          : s.index < 18
            ? "心动与生活"
            : "猜测之外";
  return `<header class="play-header"><button class="back-button" data-action="back">${s.index ? "← 上一题" : "← 返回入口"}</button><span class="chapter-tag">${chapter}</span><span class="round-number"><b>${String(s.index + 1).padStart(2, "0")}</b> / 20</span></header><div class="level-track" aria-label="第${s.index + 1}题，共20题">${Array.from({ length: 20 }, (_, i) => `<i class="${i < s.index ? "done" : i === s.index ? "current" : ""}"></i>`).join("")}</div><div class="route-label"><span>走进${t(q.targetGender)}的生活</span><span>只凭这一刻，你会怎么猜？</span></div><section class="story-panel">${art(boardFor(q), "普通成年人的都市生活片段")}<div class="scene-context">${sceneContext(q)}</div></section><section class="decision"><h2>你的第一反应是……</h2><div class="choices">${s.orders[q.id].map((pick) => `<button class="choice${prev?.pick === pick ? " previous-choice" : ""}" data-action="answer" data-question-id="${q.id}" data-pick="${pick}"><span class="choice-dot" aria-hidden="true"></span><span class="choice-copy">${esc(q.choices[pick])}${prev?.pick === pick ? '<i class="previous-label">上次选择</i>' : ""}${q.reasons ? `<small class="choice-reason">我这样猜，因为：${esc(q.reasons[pick].text)}</small>` : ""}</span><span class="choice-arrow" aria-hidden="true">↗</span></button>`).join("")}</div></section>`;
}
function calibrationMarkup(r) {
  if (r.stereotype === null)
    return "<p>本局未记录可核验的判断依据，性别刻板指数暂不可计算。</p><p>缺少记录不表示没有泛化倾向，也不据此授予需要完整校准依据的人格。</p>";
  return `<p>性别刻板指数 <b>${r.stereotype}/100</b>，越低越好。本局产品指数由方向校准偏离（${r.calibrationDeviation}/100，权重40%）与显式性别泛化依据（${r.overAttribution}/100，权重60%）组成，两者分别计算。</p><p>在${r.attributionTotal}个校准情境里，你选择了${r.attributionCount}次“男生/女生都必然如此”的判断依据。</p>${r.stereotypeEvidence ? `<p>${esc(r.stereotypeEvidence.context)}</p><p>你猜：${esc(r.stereotypeEvidence.selected)}</p><blockquote>你的依据：“${esc(r.stereotypeEvidence.reason)}”</blockquote><p>这里记录你这次实际认可的措辞；猜得准也可能使用泛化依据，猜偏也可能依据具体情境。</p>` : "<p>本局没有选择绝对性别泛化的依据。方向距离的高低不能证明你在现实中持有偏见。</p>"}<p class="micro-note">它描述本局选择，不诊断现实人格。刻板类型需至少4个有效依据场景且3次显式泛化，不会仅因预测偏离触发。</p>`;
}
export function reportData(s) {
  const a = assess(sessionQuestions(s), s.answers),
    type = classify(a),
    subject = t(s.playerGender === "male" ? "female" : "male"),
    misses = a.misses.slice(0, 3);
  const evidence = (r) => ({
    id: r.q.id,
    context: r.q.context,
    selected: r.q.choices[r.a.pick],
    reason: r.a.reason?.text || null,
    generalization: r.a.reason?.generalization || false,
    direction: r.q.direction,
    fit: Math.round(r.fit),
    sourceRefs: r.q.sourceRefs,
    grade: r.q.evidenceGrade,
    transferGrade: r.q.transferGrade,
    confidence: r.q.confidence,
    anchor: r.q.anchor,
    explanation: r.q.explanation,
    pilot: null,
  });
  return {
    type,
    score: a.score,
    metrics: a.metrics,
    imagination: a.imagination,
    threatCount: a.threatCount,
    threatTotal: a.threatTotal,
    threatEvidence: a.threatEvidence.map(evidence),
    stereotype: a.stereotype,
    calibrationDeviation: a.calibrationDeviation,
    overAttribution: a.overAttribution,
    attributionCount: a.attributionCount,
    attributionTotal: a.attributionTotal,
    subject,
    edition: s.edition,
    strongest: evidence(a.strongest),
    misses: misses.map(evidence),
    stereotypeEvidence: a.attributionEvidence[0]
      ? evidence(a.attributionEvidence[0])
      : null,
    archive: a.rows.map(evidence),
    bugs: [
      misses[0]
        ? `“${misses[0].q.choices[misses[0].a.pick]}”是你的一次预测；同一幕仍可能有另一种解释。`
        : "本局方向吻合度较高，别把它当成现实读心权限。",
      a.imagination >= 50
        ? "模糊情境里，你多次先选了关系威胁；可以先核对发生了什么。"
        : "线索不完整时，给关系威胁之外的解释留一点空间。",
      !a.attributionTotal
        ? "本局未记录可核验的判断依据，暂不评价性别泛化倾向。"
        : a.attributionCount
          ? `本局有${a.attributionCount}次选中了绝对性别泛化依据，可以把“都会”换成“这一次可能”。`
          : "本局没有选中绝对性别泛化依据；平均倾向作参考，具体的人仍要重新观察。",
    ],
    communication: [
      `先问“你现在想聊聊，还是想安静一下？”不要直接替${subject}选。`,
      "先复述感受，再确认要陪伴、解释还是一起找办法。",
    ],
    copy: {
      kind: "template",
      opening: `你最稳的一幕，是“${a.strongest.q.choices[a.strongest.a.pick]}”，观察力已经上线，读心权限还得找本人申请。`,
      closing: misses[0]
        ? `你在${misses[0].q.id}选了“${misses[0].q.choices[misses[0].a.pick]}”，猜得很有画面，下一步可以直接问问TA。`
        : "这一局你接住了不少研究方向，真人没有题库，下一句不妨交给TA自己说。",
    },
    benchmarkStatus: "待中国样本校准 · 研究方向试玩基准",
    version: a.version,
  };
}
function report(s, r) {
  const gender = r.subject === "他" ? "男性" : "女性";
  return `${logo}<button class="back-button report-back" data-action="back">← 返回最后一题，修改答案</button><header class="report-intro"><span class="eyebrow">YOUR RELATIONSHIP READING / V2</span><h1>你的异性<br><em>理解人格。</em></h1><p>20个预测，看看你听懂了多少。</p></header><section class="personality-card" data-type="${r.type.id}"><div class="card-code">NO. ${String(r.type.number).padStart(2, "0")} / 12</div><div class="personality-symbol" aria-hidden="true">${["◉", "↔", "⌕", "◇", "♡", "◎", "▥", "✧", "⇄", "▧", "ϟ", "◌"][r.type.number - 1]}</div><h2>${r.type.name}</h2><p class="type-english">${r.type.english}</p><blockquote class="personality-quote">“${r.type.quote}”</blockquote><div class="score-line"><span>异性理解力</span><b>${r.score}<small> / 100</small></b></div><p class="score-limit">${r.benchmarkStatus}<br>预测${gender} · 加权方向吻合度，非真实准确率</p></section><section class="report-section"><h2>你的观察地图</h2>${r.metrics.map((m) => `<div class="metric"><div><span>${m.label}</span><b>${m.value ?? "未评估"}<small> / 100${m.lowerIsBetter ? " · 越低越好" : ""}</small></b></div><div class="meter"><i style="width:${m.value ?? 0}%"></i></div></div>`).join("")}</section><section class="report-section"><span class="section-label">01 / YOU GOT THIS</span><h2>你最懂的</h2><p>${esc(r.strongest.context)}</p><blockquote>“${esc(r.strongest.selected)}”</blockquote><p>这一次，预测与本题待校准方向吻合度为${r.strongest.fit}/100。</p></section><section class="report-section"><span class="section-label">02 / THE PLOT TWIST</span><h2>你最容易误判的</h2>${r.misses.length ? r.misses.map((e) => `<article class="evidence-item"><h3>${e.id}</h3><p>${esc(e.context)}</p><p>你猜：${esc(e.selected)}</p><p>另一种方向参考（待校准）：${esc(e.direction)}</p></article>`).join("") : "<p>这局没有低于75分的方向吻合项。现实中的人仍可能有自己的解释。</p>"}</section><section class="report-section"><span class="section-label">03 / GENDER IS NOT A PASSWORD</span><h2>最大的性别刻板倾向</h2>${calibrationMarkup(r)}</section><section class="report-section"><span class="section-label">04 / YOUR IMAGINATION</span><h2>脑补指数 <em>${r.imagination}</em><small> / 100</small></h2><p>${r.imagination >= 50 ? "你的内心小剧场开播得比证据快了一点。" : "你给“也许只是别的原因”留了点位置。"}</p><p class="micro-note">${r.threatCount} / ${r.threatTotal}个可测情境里选择了关系威胁解释，不能诊断焦虑或依恋。${r.threatEvidence.length ? `<br>本局选项：${r.threatEvidence.map((e) => `${e.id} · ${esc(e.selected)}`).join("；")}` : ""}</p></section><section class="report-section"><span class="section-label">05 / RELATIONSHIP MANUAL</span><h2>异性使用说明书</h2><h3>3个已知 Bug</h3><ol>${r.bugs.map((b) => `<li>${esc(b)}</li>`).join("")}</ol><h3>2个最佳沟通方式</h3><ol>${r.communication.map((b) => `<li>${esc(b)}</li>`).join("")}</ol></section><section class="report-section"><span class="section-label">06 / YOUR FRIEND HAS A POINT</span><h2>${r.copy.kind === "ai" ? "AI 损友总结" : "损友总结"}</h2><p>${esc(r.copy.opening)}</p><p>${esc(r.copy.closing)}</p><p class="micro-note">${r.copy.kind === "ai" ? "AI 只润色经后端核定的答题事实。" : "当前使用题库模板；AI服务未启用或暂不可用。"}</p></section><div class="report-actions"><button class="primary" data-ui="poster">生成我的人格长卡 ↗</button><button class="secondary" data-ui="share">把这局发给TA</button><button class="text-button" data-action="start" data-gender="${s.playerGender}">再观察一局 →</button></div><p class="tiny-note">${questionsFor(s.playerGender, s.edition + 1).some((q) => q.variantKind === "approved") ? "下一局将加入经审核的同主题新情境，仍是20题。" : "当前为同一套20题。新情境需生成和内容审核后才加入。"}</p><details class="report-archive"><summary>一起揭晓这20幕</summary>${r.archive.map((e) => `<details class="scene-review"><summary>${e.id} · 方向吻合度 ${e.fit}/100</summary><p>${esc(e.context)}</p><p>你猜：${esc(e.selected)}</p><p>方向参考：${esc(e.direction)}</p><p>${esc(e.anchor)}</p><p>${esc(e.explanation)}</p><p>PRD证据等级 ${e.grade} · 情境迁移等级 ${e.transferGrade} · 置信度 ${e.confidence === "medium" ? "中" : "低"} · 中国四选项样本：待采集</p>${e.sourceRefs.map((k) => `<p><a href="${SOURCES[k].url}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[k].title)}</a><br>${esc(SOURCES[k].scope)}</p>`).join("")}</details>`).join("")}</details><details><summary>12种异性理解人格</summary>${TYPES.map((v) => `<p><b>${String(v.number).padStart(2, "0")} ${v.name}</b><br>${v.quote}</p>`).join("")}</details><details><summary>报告规则与娱乐声明</summary><p>逐题分数由预测选项与目标性别的方向基准距离计算，再按证据权重加权。A=1、B=0.65、C=0.3，实际取证据与情境迁移两者中的较低权重；不是单一正确答案。方向坐标和人格阈值是产品规则，尚未通过中国真实样本校准。D6刻板指数越低越好，方向校准偏离占40%，实际选中的显式性别泛化依据占60%；分类使用其反向能力值。偏离不等于偏见，刻板类型需至少4个依据场景且3次显式泛化。脑补指数独立计算。快型只用足够的首次可见作答计时，不把回看题算作速度。</p><p>只有20题全部答完才展示报告；报告中的误判引用本局实际选择。没有自有人群基准，不显示“超过X%玩家”。</p><p>${DISCLAIMER}</p><p>如有雷同，纯属巧合。如果你觉得“这也太像我对象了”——不是我们认识你对象，是题库终于写到了你们那种相处方式。如果你和对象因此吵起来……本游戏概不负责。😂</p><p>匿名会话保存在服务器，浏览器仅保存会话标识。分享不包含答卷或会话标识。</p></details>`;
}
export function present(s, publicUrl, r = null) {
  if (s.screen === "report") r ??= reportData(s);
  const mood =
    s.screen !== "play"
      ? "cream"
      : s.index < 5
        ? "cream"
        : s.index < 12
          ? "rose"
          : s.index < 18
            ? "plum"
            : "light";
  const current = s.screen === "play" ? sessionQuestions(s)[s.index] : null;
  const cue = current?.context.includes("朋友圈")
    ? {
        src: "/audio/notification.wav",
        id: s.edition + ":" + s.index,
        volume: 0.1,
      }
    : current?.context.includes("消息")
      ? {
          src: "/audio/typing.wav",
          id: s.edition + ":" + s.index,
          volume: 0.08,
        }
      : null;
  return {
    revision: s.revision,
    screen: s.screen,
    mood,
    html: `<main class="game-frame ${s.screen === "entry" ? "intro" : s.screen} fade-in">${s.screen === "entry" ? entry(s) : s.screen === "play" ? play(s) : report(s, r)}</main>`,
    audio: {
      src: `/audio/${s.screen === "report" ? r.type.id : s.screen === "entry" ? "entry" : mood === "rose" ? "messages" : mood === "plum" ? "tension" : "ordinary"}.wav`,
      cue,
      volume: s.screen === "report" ? 0.24 : 0.13,
      label:
        s.screen === "report"
          ? r.type.name + " · 人格主题曲"
          : "城市夜晚 · 阅读氛围",
    },
    ...(s.screen === "report"
      ? {
          share: {
            title: `我的异性理解人格：${r.type.name}`,
            text: r.type.quote,
            url: publicUrl + "/?from=report",
            poster: "/api/poster.svg",
            filename: "我的异性理解人格.png",
          },
        }
      : {}),
  };
}
