import fs from "node:fs";
import path from "node:path";
const root = path.resolve("dist/client");
if (!root.startsWith(process.cwd() + path.sep))
  throw new Error("Invalid build root");
fs.mkdirSync(root, { recursive: true });
for (const file of ["index.html", "styles.css"])
  fs.copyFileSync("frontend/" + file, path.join(root, file));
fs.cpSync("frontend/client", path.join(root, "client"), { recursive: true });
fs.mkdirSync(path.join(root, "assets"), { recursive: true });
fs.cpSync('frontend/assets',path.join(root,'assets'),{recursive:true});
fs.cpSync("frontend/audio", path.join(root, "audio"), { recursive: true });
fs.writeFileSync(
  path.join(root, "_headers"),
  "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Content-Security-Policy: default-src 'self'; img-src 'self' blob: data:; media-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'\n",
);
console.log("V2 client built; backend logic is excluded from public assets.");
