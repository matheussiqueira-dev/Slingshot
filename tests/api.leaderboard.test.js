import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import request from "supertest";

import { createApp } from "../server/src/app.js";

function createTempLeaderboardPath(name) {
  return path.join(os.tmpdir(), `slingshot-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
}

test("GET /api/v1/health returns service status", async () => {
  const leaderboardPath = createTempLeaderboardPath("health");
  const app = createApp({
    env: {
      nodeEnv: "test",
      leaderboardFile: leaderboardPath,
      rateLimitMax: 1000,
    },
  });

  const response = await request(app).get("/api/v1/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.data.status, "ok");

  await fs.rm(leaderboardPath, { force: true });
});

test("POST /api/v1/leaderboard validates payload", async () => {
  const leaderboardPath = createTempLeaderboardPath("validation");
  const app = createApp({
    env: {
      nodeEnv: "test",
      leaderboardFile: leaderboardPath,
      rateLimitMax: 1000,
    },
  });

  const response = await request(app).post("/api/v1/leaderboard").send({
    playerName: "A",
    score: -1,
    level: 1,
    combo: 0,
    mode: "standard",
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");

  await fs.rm(leaderboardPath, { force: true });
});

test("POST + GET /api/v1/leaderboard persists and returns ranking", async () => {
  const leaderboardPath = createTempLeaderboardPath("ranking");
  const app = createApp({
    env: {
      nodeEnv: "test",
      leaderboardFile: leaderboardPath,
      rateLimitMax: 1000,
    },
  });

  const createResponse = await request(app).post("/api/v1/leaderboard").send({
    playerName: "Matheus",
    score: 900,
    level: 3,
    combo: 4,
    mode: "standard",
  });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.data.score, 900);

  await request(app).post("/api/v1/leaderboard").send({
    playerName: "Luna",
    score: 1200,
    level: 4,
    combo: 6,
    mode: "zen",
  });

  const listResponse = await request(app).get("/api/v1/leaderboard?limit=10");

  assert.equal(listResponse.status, 200);
  assert.equal(Array.isArray(listResponse.body.data), true);
  assert.equal(listResponse.body.data.length, 2);
  assert.equal(listResponse.body.data[0].playerName, "Luna");
  assert.equal(listResponse.body.data[0].mode, "zen");

  await fs.rm(leaderboardPath, { force: true });
});
