import fs from "node:fs/promises";
import path from "node:path";

export class LeaderboardRepository {
  constructor(filePath, maxEntries = 500) {
    this.filePath = filePath;
    this.maxEntries = maxEntries;
  }

  async ensureFile() {
    const directory = path.dirname(this.filePath);
    await fs.mkdir(directory, { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, JSON.stringify({ entries: [] }, null, 2), "utf8");
    }
  }

  async readAll() {
    await this.ensureFile();

    const content = await fs.readFile(this.filePath, "utf8");
    const parsed = JSON.parse(content || "{}");

    if (!Array.isArray(parsed.entries)) {
      return [];
    }

    return parsed.entries;
  }

  async writeAll(entries) {
    await this.ensureFile();
    const payload = {
      entries: entries.slice(0, this.maxEntries),
    };

    await fs.writeFile(this.filePath, JSON.stringify(payload, null, 2), "utf8");
  }

  async list(limit = 10) {
    const entries = await this.readAll();
    return entries
      .slice()
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0);
      })
      .slice(0, limit);
  }

  async add(entry) {
    const entries = await this.readAll();
    entries.push(entry);

    entries.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0);
    });

    await this.writeAll(entries);
    return entry;
  }
}
