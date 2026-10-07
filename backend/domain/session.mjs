import { questionsFor } from "../content/bank.mjs";
import { RULE_VERSION } from "./assessment.mjs";
export const SESSION_VERSION = 3;
export function newSession() {
  return {
    version: SESSION_VERSION,
    ruleVersion: RULE_VERSION,
    questions: null,
    revision: 0,
    screen: "entry",
    playerGender: null,
    index: 0,
    answers: [],
    edition: 0,
    orders: {},
    seen: [],
    timing: null,
    revisited: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
export function sessionQuestions(s) {
  if (!Array.isArray(s.questions) || s.questions.length !== 20)
    throw new Error("Run question snapshot required");
  return s.questions;
}
export function normalizeSession(s) {
  if (
    s.version !== SESSION_VERSION ||
    s.ruleVersion !== RULE_VERSION ||
    (s.playerGender &&
      (!Array.isArray(s.questions) || s.questions.length !== 20))
  ) {
    const fresh = newSession();
    fresh.revision = (s.revision || 0) + 1;
    fresh.previousRun = {
      version: s.version,
      ruleVersion: s.ruleVersion || null,
      playerGender: s.playerGender,
      answers: s.answers || [],
      questions: s.questions || null,
    };
    fresh.migrationNotice =
      "题目和报告规则已更新，请重新开始；上次记录已保留，不会套用新的判断依据。";
    return fresh;
  }
  if (s.report && s.report.version !== RULE_VERSION) delete s.report;
  return s;
}
function shuffled() {
  const a = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const b = new Uint32Array(1);
    crypto.getRandomValues(b);
    const j = b[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function startTiming(s, now) {
  if (s.screen !== "play") return;
  s.answerableAt = now + 500;
  s.timing = {
    id: sessionQuestions(s)[s.index].id,
    activeMs: 0,
    since: now + 500,
  };
}
function pause(s, now) {
  if (s.timing?.since !== null && s.timing) {
    s.timing.activeMs += Math.max(0, Math.min(now - s.timing.since, 180001));
    s.timing.since = null;
  }
}
export function applyAction(s, input, now = Date.now()) {
  if (input.revision !== s.revision)
    throw Object.assign(new Error("页面已更新，请按当前页面操作。"), {
      status: 409,
    });
  const { action } = input;
  if (action === "start") {
    if (!["male", "female"].includes(input.gender))
      throw Object.assign(new Error("请选择路线。"), { status: 400 });
    if (s.playerGender !== input.gender || s.screen === "report") {
      const edition = s.edition + (s.playerGender ? 1 : 0);
      Object.assign(s, newSession(), { revision: input.revision, edition });
    }
    s.playerGender = input.gender;
    s.questions ??= structuredClone(questionsFor(s.playerGender, s.edition));
    s.screen = "play";
    delete s.migrationNotice;
    for (const q of sessionQuestions(s)) s.orders[q.id] ??= shuffled();
    startTiming(s, now);
  } else if (action === "answer") {
    if (s.screen !== "play")
      throw Object.assign(new Error("当前不能作答。"), { status: 409 });
    const q = sessionQuestions(s)[s.index];
    if (now < s.answerableAt)
      throw Object.assign(new Error("这一幕刚翻开，请稍后再选。"), {
        status: 425,
      });
    if (
      input.questionId !== q.id ||
      !Number.isInteger(input.pick) ||
      input.pick < 0 ||
      input.pick > 3
    )
      throw Object.assign(new Error("请使用当前题目的选项。"), { status: 400 });
    pause(s, now);
    const record = {
      id: q.id,
      pick: input.pick,
      ruleVersion: s.ruleVersion,
      reason: q.reasons ? { ...q.reasons[input.pick], version: 1 } : null,
      activeMs: s.timing?.id === q.id ? s.timing.activeMs : 0,
      revisited: s.revisited.includes(q.id),
    };
    const old = s.answers.findIndex((a) => a.id === q.id);
    if (old < 0) s.answers.push(record);
    else s.answers[old] = record;
    if (s.index === 19) {
      s.screen = "report";
      s.timing = null;
    } else {
      s.index++;
      startTiming(s, now);
    }
  } else if (action === "back") {
    if (s.screen === "entry") return s;
    pause(s, now);
    if (s.screen === "report") {
      s.screen = "play";
      s.index = 19;
    } else if (s.index === 0) {
      s.screen = "entry";
      s.timing = null;
    } else {
      s.index--;
    }
    if (s.screen === "play") {
      const id = sessionQuestions(s)[s.index].id;
      if (!s.revisited.includes(id)) s.revisited.push(id);
      startTiming(s, now);
    }
  } else if (action === "pause") {
    pause(s, now);
  } else if (action === "resume") {
    if (s.screen === "play") {
      const id = sessionQuestions(s)[s.index].id;
      if (!s.revisited.includes(id)) s.revisited.push(id);
      if (!s.timing) startTiming(s, now);
      else s.timing.since = now;
    }
  } else throw Object.assign(new Error("未知操作。"), { status: 400 });
  s.revision++;
  s.updatedAt = now;
  return s;
}
