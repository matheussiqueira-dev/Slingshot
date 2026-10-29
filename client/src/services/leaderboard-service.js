import { API_CONFIG, STORAGE_KEYS } from "../config/game-config.js";
import { fetchJson } from "./api-client.js";
import { sanitizePlayerName } from "../utils/string.js";

export const LEADERBOARD_SOURCE = Object.freeze({
  remote: "remote",
  local: "local",
});

export class LeaderboardService {
  constructor(storage, { apiBaseUrl = API_CONFIG.baseUrl, request = fetchJson, timeoutMs = API_CONFIG.timeoutMs } = {}) {
    this.storage = storage;
    this.apiBaseUrl = apiBaseUrl || null;
    this.request = request;
    this.timeoutMs = timeoutMs;
  }

  get hasRemote() {
    return this.apiBaseUrl !== null;
  }

  async getTop(limit = 10) {
    if (!this.hasRemote) {
      return { source: LEADERBOARD_SOURCE.local, entries: this.getLocalTop(limit) };
    }

    try {
      const payload = await this.request(`${this.apiBaseUrl}/leaderboard?limit=${limit}`, {}, this.timeoutMs);
      const entries = Array.isArray(payload.data) ? payload.data : [];
      return { source: LEADERBOARD_SOURCE.remote, entries: entries.map((entry) => this.normalizeEntry(entry)) };
    } catch {
      return { source: LEADERBOARD_SOURCE.local, entries: this.getLocalTop(limit) };
    }
  }

  async submitScore({ playerName, score, level, combo, mode }) {
    const safeEntry = {
      playerName: sanitizePlayerName(playerName),
      score: Number(score) || 0,
      level: Number(level) || 1,
      combo: Number(combo) || 0,
      mode: mode === "zen" ? "zen" : "standard",
    };

    if (safeEntry.score <= 0) {
      return { accepted: false, reason: "score_zero" };
    }

    if (!this.hasRemote) {
      return this.saveLocally(safeEntry, { localOnly: true });
    }

    try {
      const payload = await this.request(
        `${this.apiBaseUrl}/leaderboard`,
        {
          method: "POST",
          body: JSON.stringify(safeEntry),
        },
        this.timeoutMs,
      );

      return {
        accepted: true,
        entry: this.normalizeEntry(payload.data),
      };
    } catch {
      return this.saveLocally(safeEntry, { localOnly: false });
    }
  }

  saveLocally(safeEntry, { localOnly }) {
    const fallbackEntry = {
      ...safeEntry,
      createdAt: new Date().toISOString(),
    };
    this.addLocalEntry(fallbackEntry);
    return {
      accepted: true,
      entry: fallbackEntry,
      fallback: true,
      localOnly,
    };
  }

  getLocalTop(limit = 10) {
    const entries = this.storage.get(STORAGE_KEYS.localLeaderboard, []);
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries
      .map((entry) => this.normalizeEntry(entry))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  addLocalEntry(entry) {
    const entries = this.storage.get(STORAGE_KEYS.localLeaderboard, []);
    const nextEntries = Array.isArray(entries) ? entries : [];
    nextEntries.push(this.normalizeEntry(entry));

    nextEntries.sort((a, b) => b.score - a.score);
    this.storage.set(STORAGE_KEYS.localLeaderboard, nextEntries.slice(0, 50));
  }

  normalizeEntry(entry) {
    return {
      playerName: sanitizePlayerName(entry?.playerName),
      score: Number(entry?.score) || 0,
      level: Number(entry?.level) || 1,
      combo: Number(entry?.combo) || 0,
      mode: entry?.mode === "zen" ? "zen" : "standard",
      createdAt: entry?.createdAt || new Date().toISOString(),
    };
  }
}
