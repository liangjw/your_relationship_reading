import { GameService } from "../services/game.mjs";
import { DurableObject } from "cloudflare:workers";
export class GameSession extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.service = new GameService(
      {
        get: () => ctx.storage.get("session"),
        put: (_, s) => ctx.storage.put("session", s),
      },
      {
        key: env.OPENAI_API_KEY,
        model: env.OPENAI_REPORT_MODEL,
        publicUrl: env.PUBLIC_URL,
      },
    );
  }
  fetch(request) {
    return this.service.handle("session", request);
  }
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    let sid = request.headers
        .get("Cookie")
        ?.match(/(?:^|;\s*)rr_v2=([a-f0-9]{64})(?:;|$)/)?.[1],
      fresh = !sid;
    if (fresh)
      sid = Array.from(crypto.getRandomValues(new Uint8Array(32)), (x) =>
        x.toString(16).padStart(2, "0"),
      ).join("");
    const result = await env.GAME_SESSIONS.get(
      env.GAME_SESSIONS.idFromName(sid),
    ).fetch(request);
    const response = new Response(result.body, result);
    if (fresh)
      response.headers.set(
        "Set-Cookie",
        `rr_v2=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
      );
    return response;
  },
};
