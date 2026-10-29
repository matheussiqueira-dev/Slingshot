import path from "node:path";

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseCorsOrigins(value) {
  const raw = (value || "").trim();
  if (raw === "*") {
    return "*";
  }

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: toInt(process.env.PORT, 3000),
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 160),
  leaderboardFile: process.env.LEADERBOARD_FILE || path.resolve(process.cwd(), "server", "data", "leaderboard.json"),
});
