import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import request from "supertest";

import { createApp } from "../server/src/app.js";
import { errorHandlerMiddleware } from "../server/src/middleware/error-handler.js";
import { LeaderboardRepository } from "../server/src/modules/leaderboard/leaderboard.repository.js";

function tempFile(name) {
  return path.join(os.tmpdir(), `slingshot-${name}-${process.pid}-${Math.random().toString(16).slice(2)}.json`);
}

function appWith(leaderboardFile) {
  return createApp({ env: { nodeEnv: "test", leaderboardFile, rateLimitMax: 1000 } });
}

function fakeResponse(headersSent = false) {
  return {
    headersSent,
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("unknown API routes answer a JSON 404 with the request id", async () => {
  const file = tempFile("not-found");

  const response = await request(appWith(file)).get("/api/v2/missing");

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "NOT_FOUND");
  assert.match(response.body.error.message, /GET \/api\/v2\/missing/);
  assert.ok(response.body.error.requestId);
  await fs.rm(file, { force: true });
});

test("non-API paths fall back to the client page", async () => {
  const file = tempFile("spa");

  const response = await request(appWith(file)).get("/any/client/route");

  assert.equal(response.status, 200);
  assert.match(response.headers["content-type"], /html/);
  await fs.rm(file, { force: true });
});

test("an invalid list query is a 400, not a server error", async () => {
  const file = tempFile("bad-query");

  const response = await request(appWith(file)).get("/api/v1/leaderboard?limit=abc");

  assert.equal(response.status, 400);
  assert.ok(response.body.error.message);
  await fs.rm(file, { force: true });
});

test("a corrupt store answers a generic 500 without leaking the cause", async (t) => {
  const file = tempFile("corrupt");
  await fs.writeFile(file, "{not json", "utf8");
  t.mock.method(console, "error", () => {});

  const response = await request(appWith(file)).get("/api/v1/leaderboard");

  assert.equal(response.status, 500);
  assert.equal(response.body.error.code, "INTERNAL_ERROR");
  assert.equal(response.body.error.message, "Erro interno do servidor");
  assert.equal(console.error.mock.callCount(), 1);
  await fs.rm(file, { force: true });
});

test("error handler defers to Express after the response started", () => {
  const error = new Error("late failure");
  const forwarded = [];

  errorHandlerMiddleware(error, { requestId: "r1" }, fakeResponse(true), (value) =>
    forwarded.push(value),
  );

  assert.deepEqual(forwarded, [error]);
});

test("error handler keeps client errors readable and fills in defaults", () => {
  const known = fakeResponse();
  errorHandlerMiddleware(
    Object.assign(new Error("nome inválido"), { status: 422, code: "INVALID_NAME" }),
    { requestId: "r2" },
    known,
    () => {},
  );
  assert.equal(known.statusCode, 422);
  assert.deepEqual(known.body.error, {
    code: "INVALID_NAME",
    message: "nome inválido",
    requestId: "r2",
  });

  const bare = fakeResponse();
  errorHandlerMiddleware({ status: 400 }, { requestId: "r3" }, bare, () => {});
  assert.equal(bare.body.error.code, "REQUEST_ERROR");
  assert.equal(bare.body.error.message, "Erro na requisição");
});

test("repository reads a store without an entries list as empty", async () => {
  const file = tempFile("no-entries");
  await fs.writeFile(file, "{}", "utf8");

  assert.deepEqual(await new LeaderboardRepository(file).readAll(), []);
  await fs.rm(file, { force: true });
});
