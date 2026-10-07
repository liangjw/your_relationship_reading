// Browser adapter only: DOM, HTTP, media playback, clipboard and image export.
// No question bank, scoring, type classification, progression or report rules.
const app = document.querySelector("#app"),
  audio = document.querySelector("#bgm"),
  sound = document.querySelector("#sound");
let view,
  busy = false,
  muted = true,
  toastTimer,
  posterUrl,
  pendingVisibility,
  lastCue,
  activeCue;
const toast = (text) => {
  const node = document.querySelector("#toast");
  node.textContent = text;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 3500);
};
async function response(response) {
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(data.error || "暂时无法连接，请重试。"), {
      status: response.status,
    });
  return data;
}
async function request(url, options = {}, read = response) {
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 15000);
  try {
    return await read(
      await fetch(url, { ...options, signal: controller.signal }),
    );
  } finally {
    clearTimeout(timeout);
  }
}
function media() {
  if (!view?.audio) return;
  const source = new URL(view.audio.src, location.origin).href;
  if (audio.src !== source) audio.src = source;
  audio.volume = view.audio.volume;
  sound.title = view.audio.label;
  if (muted || document.hidden) {
    audio.pause();
    activeCue?.pause();
  } else {
    audio.play().catch(() => {
      muted = true;
      sound.textContent = "♪ 开启声音";
      sound.setAttribute("aria-pressed", "false");
    });
    const cue = view.audio.cue;
    if (cue && lastCue !== cue.id) {
      lastCue = cue.id;
      activeCue?.pause();
      activeCue = new Audio(cue.src);
      activeCue.volume = cue.volume;
      activeCue.play().catch(() => {});
    }
  }
}
function show(data, { scroll = true } = {}) {
  view = data;
  document.body.dataset.screen = view.screen;
  document.body.dataset.mood = view.mood;
  app.innerHTML = view.html;
  media();
  if (scroll) window.scrollTo({ top: 0, behavior: "instant" });
}
async function refresh() {
  show(await request("/api/game", { cache: "no-store" }));
}
async function act(payload, { quiet = false } = {}) {
  if (busy || !view) return;
  busy = true;
  app.setAttribute("aria-busy", "true");
  app.querySelectorAll("button").forEach((b) => (b.disabled = true));
  const picked =
    payload.action === "answer"
      ? app.querySelector(`[data-pick="${payload.pick}"]`)
      : null;
  picked?.classList.add("picked");
  try {
    const result = await request("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        revision: view.revision,
        requestId: crypto.randomUUID(),
      }),
    });
    show(result, { scroll: !quiet });
  } catch (e) {
    if (e.status === 409) {
      try {
        await refresh();
        toast("页面已同步，请使用当前题目继续。");
      } catch {
        toast("暂时无法同步，请检查网络后重试。");
      }
    } else
      toast(
        e.name === "AbortError" ? "连接超时，请检查网络后重试。" : e.message,
      );
  } finally {
    picked?.classList.remove("picked");
    busy = false;
    app.removeAttribute("aria-busy");
    app.querySelectorAll("button").forEach((b) => (b.disabled = false));
    if (pendingVisibility) {
      const action = pendingVisibility;
      pendingVisibility = null;
      queueMicrotask(() => act({ action }, { quiet: true }));
    }
  }
}
async function share() {
  if (!view?.share) return;
  const { title, text, url } = view.share;
  try {
    if (navigator.share) await navigator.share({ title, text, url });
    else {
      await navigator.clipboard.writeText(url);
      toast("试玩链接已复制，发给TA一起聊聊。");
    }
  } catch (e) {
    if (e.name !== "AbortError")
      toast("可复制浏览器地址分享，或保存人格长卡。");
  }
}
async function poster() {
  if (!view?.share) return;
  try {
    const svg = await request(
        view.share.poster,
        { cache: "no-store" },
        async (result) => {
          if (!result.ok) throw new Error("分享卡暂不可用，请重试。");
          return result.blob();
        },
      ),
      src = URL.createObjectURL(svg),
      img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);
    const png = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    URL.revokeObjectURL(src);
    if (posterUrl) URL.revokeObjectURL(posterUrl);
    posterUrl = URL.createObjectURL(png);
    document.querySelector("#poster-image").src = posterUrl;
    const download = document.querySelector("#poster-download");
    download.href = posterUrl;
    download.download = view.share.filename;
    document.querySelector("#poster-dialog").showModal();
  } catch (e) {
    toast(e.name === "AbortError" ? "分享卡加载超时，请重试。" : e.message);
  }
}
app.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || busy) return;
  if (button.dataset.ui === "share") {
    share();
    return;
  }
  if (button.dataset.ui === "poster") {
    poster();
    return;
  }
  const { action, gender, questionId, pick } = button.dataset;
  if (!action) return;
  act({
    action,
    clickCount: event.detail,
    ...(gender ? { gender } : {}),
    ...(questionId ? { questionId, pick: Number(pick) } : {}),
  });
});
sound.addEventListener("click", () => {
  muted = !muted;
  sound.textContent = muted ? "♪ 开启声音" : "♫ 关闭声音";
  sound.setAttribute("aria-pressed", String(!muted));
  media();
});
document
  .querySelector("#close-poster")
  .addEventListener("click", () =>
    document.querySelector("#poster-dialog").close(),
  );
document.addEventListener("visibilitychange", () => {
  media();
  const action = document.hidden ? "pause" : "resume";
  if (busy) pendingVisibility = action;
  else if (view) act({ action }, { quiet: true });
});
window.addEventListener("pagehide", () => {
  audio.pause();
  if (view && !busy)
    navigator.sendBeacon(
      "/api/action",
      new Blob(
        [
          JSON.stringify({
            action: "pause",
            revision: view.revision,
            requestId: crypto.randomUUID(),
          }),
        ],
        { type: "application/json" },
      ),
    );
});
// Retire the old static app cache: V2 must always obtain game state from the server.
if ("serviceWorker" in navigator)
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .catch(() => {});
refresh()
  .then(() =>
    act({ action: document.hidden ? "pause" : "resume" }, { quiet: true }),
  )
  .catch(() => {
    app.innerHTML =
      '<main class="game-frame"><h1>这一期还没翻开</h1><p>请检查网络，然后刷新页面继续。游戏进度保存在服务器。</p><a href="/">重新连接 →</a></main>';
  });
