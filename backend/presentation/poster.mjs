import QRCode from "qrcode-generator";
import { esc } from "./views.mjs";
import mascotImages from "./mascot-inline.mjs";
const lines = (s, width = 20) =>
  Array.from(s).reduce((out, c, i) => {
    if (i % width === 0) out.push("");
    out[out.length - 1] += c;
    return out;
  }, []);
export function poster(r, url) {
  const qr = QRCode(0, "M");
  qr.addData(url + "/?from=report");
  qr.make();
  const count = qr.getModuleCount(),
    unit = 180 / (count + 8);
  let modules = "";
  for (let y = 0; y < count; y++)
    for (let x = 0; x < count; x++)
      if (qr.isDark(y, x))
        modules += `<rect x="${510 + (x + 4) * unit}" y="${1100 + (y + 4) * unit}" width="${unit + 0.1}" height="${unit + 0.1}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1360" viewBox="0 0 750 1360"><rect width="750" height="1360" fill="#fff8f2"/><rect x="30" y="145" width="690" height="530" rx="24" fill="#fce9ed"/><g fill="#58424c" font-family="Microsoft YaHei, sans-serif"><text x="50" y="78" font-size="26">心动译码。 / 关系小剧场</text><path d="M50 110H700" stroke="#58424c"/><text x="375" y="195" text-anchor="middle" font-size="23" fill="#893a4d">我的异性理解人格</text><text x="375" y="263" text-anchor="middle" font-size="49" font-weight="bold">${esc(r.type.name)}</text><text x="375" y="298" text-anchor="middle" font-size="19">${esc(r.type.english)}</text><image x="230" y="316" width="290" height="290" href="${mascotImages[r.type.id]}"/>${lines(
    r.type.quote,
    19,
  )
    .map(
      (l, i) =>
        `<text x="375" y="${623 + i * 34}" text-anchor="middle" font-size="26">${esc(l)}</text>`,
    )
    .join(
      "",
    )}<text x="50" y="738" font-size="25">异性理解力</text><text x="690" y="750" text-anchor="end" font-size="65" fill="#893a4d">${r.score}<tspan font-size="22"> / 100</tspan></text>${r.metrics.map((m, i) => `<text x="50" y="${807 + i * 40}" font-size="22">${m.label}</text><text x="690" y="${807 + i * 40}" text-anchor="end" font-size="24">${m.value ?? "未评估"}${m.lowerIsBetter ? " ↓" : ""}</text>`).join("")}<text x="50" y="1060" font-size="26">脑补指数 ${r.imagination} / 100</text><text x="50" y="1140" font-size="28">你以为你懂。</text><text x="50" y="1190" font-size="28">来，换你猜一次。</text><rect x="510" y="1100" width="180" height="180" fill="white"/>${modules}<text x="50" y="1292" font-size="16">20题 · 单人 · 预测异性 · 最后一起揭晓</text><text x="50" y="1325" font-size="14">娱乐与自我观察，不是心理诊断，不代表所有男性或女性。</text></g></svg>`;
}
