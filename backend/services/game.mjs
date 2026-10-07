import {
  newSession,
  applyAction,
  normalizeSession,
} from "../domain/session.mjs";
import { present, reportData } from "../presentation/views.mjs";
import { poster } from "../presentation/poster.mjs";
import { enhanceCopy } from "./narrative.mjs";
export class GameService {
  constructor(store, options = {}) {
    this.store = store;
    this.options = options;
    this.queues = new Map();
  }
  async handle(sid, request) {
    const last = this.queues.get(sid) ?? Promise.resolve();
    let release;
    const next = new Promise((resolve) => (release = resolve));
    this.queues.set(sid, next);
    await last;
    try {
      return await this.process(sid, request);
    } finally {
      release();
      if (this.queues.get(sid) === next) this.queues.delete(sid);
    }
  }
  async process(sid, request) {
    const json = (status, data) =>
      Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
    try {
      const url = new URL(request.url),
        publicUrl = this.options.publicUrl || url.origin;
      let s = normalizeSession((await this.store.get(sid)) || newSession());
      if (s.screen === "report" && !s.report)
        s.report = await enhanceCopy(reportData(s), this.options);
      if (url.pathname === "/api/game" && request.method === "GET") {
        if (s.screen === "play" && s.timing) {
          const id = s.timing.id;
          if (!s.revisited.includes(id)) s.revisited.push(id);
          s.timing.since = null;
          s.revision++;
        }
        await this.store.put(sid, s);
        return json(200, present(s, publicUrl, s.report));
      }
      if (url.pathname === "/api/poster.svg" && request.method === "GET") {
        if (s.screen !== "report")
          return json(409, { error: "请先完成这一局。" });
        return new Response(poster(s.report || reportData(s), publicUrl), {
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      }
      if (url.pathname !== "/api/action" || request.method !== "POST")
        return json(404, { error: "Not found" });
      if (request.headers.get("Origin") !== url.origin)
        return json(403, { error: "请从游戏页面操作。" });
      if (!request.headers.get("Content-Type")?.startsWith("application/json"))
        return json(415, { error: "JSON required" });
      const body = await request.text();
      if (body.length > 2048) return json(413, { error: "Too large" });
      const input = JSON.parse(body);
      if (
        typeof input.requestId !== "string" ||
        !/^[-\w]{8,80}$/.test(input.requestId)
      )
        return json(400, { error: "Invalid request id" });
      if (s.lastRequestId === input.requestId)
        return json(200, present(s, publicUrl, s.report));
      s = applyAction(s, input, this.options.now?.() ?? Date.now());
      if (["answer", "start", "back"].includes(input.action)) delete s.report;
      if (s.screen === "report" && !s.report) {
        s.report = await enhanceCopy(reportData(s), this.options);
      }
      s.lastRequestId = input.requestId;
      await this.store.put(sid, s);
      return json(200, present(s, publicUrl, s.report));
    } catch (e) {
      return json(e.status || 400, {
        error: e.status ? e.message : "操作未完成，请刷新重试。",
      });
    }
  }
}
