import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import request from "supertest";

import { createApp } from "../server/src/app.js";
import { parseCorsOrigins } from "../server/src/config/env.js";

function buildApp(envOverrides = {}) {
  const leaderboardFile = path.join(os.tmpdir(), `slingshot-security-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  const app = createApp({
    env: { nodeEnv: "test", leaderboardFile, rateLimitMax: 1000, ...envOverrides },
  });
  return { app, cleanup: () => fs.rm(leaderboardFile, { force: true }) };
}

test("parseCorsOrigins defaults to same-origin only and keeps wildcard explicit", () => {
  assert.deepEqual(parseCorsOrigins(undefined), []);
  assert.deepEqual(parseCorsOrigins("   "), []);
  assert.equal(parseCorsOrigins(" * "), "*");
  assert.deepEqual(parseCorsOrigins("https://a.dev, https://b.dev,"), ["https://a.dev", "https://b.dev"]);
});

test("cross-origin requests are refused when no origin is configured", async () => {
  const { app, cleanup } = buildApp({ corsOrigin: [] });

  const response = await request(app).get("/api/v1/health").set("Origin", "https://other.example");

  assert.equal(response.status, 200);
  assert.equal(response.headers["access-control-allow-origin"], undefined);
  await cleanup();
});

test("only explicitly configured origins receive CORS headers", async () => {
  const { app, cleanup } = buildApp({ corsOrigin: "https://game.example" });

  const allowed = await request(app).get("/api/v1/health").set("Origin", "https://game.example");
  const refused = await request(app).get("/api/v1/health").set("Origin", "https://other.example");

  assert.equal(allowed.headers["access-control-allow-origin"], "https://game.example");
  assert.equal(refused.headers["access-control-allow-origin"], undefined);
  await cleanup();
});

test("explicit wildcard still allows any origin", async () => {
  const { app, cleanup } = buildApp({ corsOrigin: "*" });

  const response = await request(app).get("/api/v1/health").set("Origin", "https://other.example");

  assert.equal(response.headers["access-control-allow-origin"], "https://other.example");
  await cleanup();
});

test("HTML responses carry a restrictive Content-Security-Policy", async () => {
  const { app, cleanup } = buildApp();

  for (const route of ["/", "/index.html", "/rota-desconhecida"]) {
    const response = await request(app).get(route);
    const policy = response.headers["content-security-policy"];

    assert.match(response.headers["content-type"], /text\/html/);
    assert.ok(policy, `missing CSP on ${route}`);
    assert.match(policy, /default-src 'self'/);
    assert.match(policy, /script-src 'self'(;|$)/);
    assert.match(policy, /object-src 'none'/);
    assert.match(policy, /frame-ancestors 'none'/);
    assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval/);
  }

  await cleanup();
});
