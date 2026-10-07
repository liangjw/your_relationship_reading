import fs from "node:fs/promises";
import path from "node:path";
export class FileStore {
  constructor(root) {
    this.root = path.resolve(root);
  }
  file(id) {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new Error("Invalid session");
    return path.join(this.root, id + ".json");
  }
  async get(id) {
    try {
      return JSON.parse(await fs.readFile(this.file(id), "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  }
  async put(id, value) {
    await fs.mkdir(this.root, { recursive: true });
    const file = this.file(id),
      temp = file + ".tmp";
    await fs.writeFile(temp, JSON.stringify(value));
    await fs.rename(temp, file);
  }
}
