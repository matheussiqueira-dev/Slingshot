import assert from "node:assert/strict";
import test from "node:test";

import { resolveApiBaseUrl } from "../client/src/config/api-base.js";
import { LeaderboardService } from "../client/src/services/leaderboard-service.js";

function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    get: (key, fallback = null) => (data.has(key) ? data.get(key) : fallback),
    set: (key, value) => {
      data.set(key, value);
      return true;
    },
  };
}

function createRequestSpy(response) {
  const calls = [];
  const request = async (...args) => {
    calls.push(args);
    if (response instanceof Error) {
      throw response;
    }
    return response;
  };
  return { calls, request };
}

function fakeDocument(content) {
  return {
    querySelector: (selector) => {
      if (content === undefined || selector !== 'meta[name="slingshot-api-base"]') {
        return null;
      }
      return { getAttribute: () => content };
    },
  };
}

test("resolveApiBaseUrl accepts only same-origin paths from the meta tag", () => {
  assert.equal(resolveApiBaseUrl(fakeDocument("/api/v1")), "/api/v1");
  assert.equal(resolveApiBaseUrl(fakeDocument(" /api/v1 ")), "/api/v1");
  assert.equal(resolveApiBaseUrl(fakeDocument("")), null);
  assert.equal(resolveApiBaseUrl(fakeDocument(undefined)), null);
  assert.equal(resolveApiBaseUrl(fakeDocument("https://example.com/api")), null);
  assert.equal(resolveApiBaseUrl(fakeDocument("//example.com/api")), null);
  assert.equal(resolveApiBaseUrl(undefined), null);
});

test("without a configured backend getTop makes no request and returns the local ranking", async () => {
  const storage = createMemoryStorage({
    slingshot_local_leaderboard_v2: [
      { playerName: "Bia", score: 200 },
      { playerName: "Ana", score: 500 },
      { playerName: "Caio", score: 350 },
    ],
  });
  const spy = createRequestSpy({ data: [] });
  const service = new LeaderboardService(storage, { apiBaseUrl: null, request: spy.request });

  const result = await service.getTop(2);

  assert.equal(spy.calls.length, 0);
  assert.equal(result.source, "local");
  assert.deepEqual(
    result.entries.map((entry) => [entry.playerName, entry.score]),
    [
      ["Ana", 500],
      ["Caio", 350],
    ],
  );
});

test("without a configured backend submitScore saves locally without requests", async () => {
  const storage = createMemoryStorage();
  const spy = createRequestSpy({ data: {} });
  const service = new LeaderboardService(storage, { apiBaseUrl: null, request: spy.request });

  const result = await service.submitScore({ playerName: "Ana", score: 120, level: 2, combo: 1, mode: "standard" });

  assert.equal(spy.calls.length, 0);
  assert.equal(result.accepted, true);
  assert.equal(result.localOnly, true);
  assert.equal(service.getLocalTop()[0].score, 120);
});

test("with a backend getTop uses the API and reports the remote source", async () => {
  const spy = createRequestSpy({ data: [{ playerName: "Ana", score: 900 }] });
  const service = new LeaderboardService(createMemoryStorage(), { apiBaseUrl: "/api/v1", request: spy.request });

  const result = await service.getTop(5);

  assert.equal(spy.calls.length, 1);
  assert.equal(spy.calls[0][0], "/api/v1/leaderboard?limit=5");
  assert.equal(result.source, "remote");
  assert.equal(result.entries[0].score, 900);
});

test("with a backend that fails getTop and submitScore fall back to local storage", async () => {
  const storage = createMemoryStorage();
  const spy = createRequestSpy(new Error("offline"));
  const service = new LeaderboardService(storage, { apiBaseUrl: "/api/v1", request: spy.request });

  const submit = await service.submitScore({ playerName: "Ana", score: 80, level: 1, combo: 0, mode: "zen" });
  const top = await service.getTop();

  assert.equal(spy.calls.length, 2);
  assert.equal(submit.fallback, true);
  assert.equal(submit.localOnly, false);
  assert.equal(top.source, "local");
  assert.equal(top.entries[0].mode, "zen");
});
