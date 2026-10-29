import assert from "node:assert/strict";
import test from "node:test";

import { fetchJson } from "../client/src/services/api-client.js";

function withFetch(implementation, run) {
  const original = globalThis.fetch;
  globalThis.fetch = implementation;
  return run().finally(() => {
    globalThis.fetch = original;
  });
}

test("fetchJson returns the JSON payload and sends JSON headers", async () => {
  let captured;
  await withFetch(
    async (url, options) => {
      captured = { url, options };
      return { ok: true, json: async () => ({ data: [1] }) };
    },
    async () => {
      const payload = await fetchJson("/api/v1/leaderboard", { method: "POST", headers: { "X-Test": "1" } }, 50);
      assert.deepEqual(payload, { data: [1] });
    },
  );

  assert.equal(captured.url, "/api/v1/leaderboard");
  assert.equal(captured.options.method, "POST");
  assert.equal(captured.options.headers["Content-Type"], "application/json");
  assert.equal(captured.options.headers["X-Test"], "1");
  assert.ok(captured.options.signal);
});

test("fetchJson surfaces the API error message on non-2xx responses", async () => {
  await withFetch(
    async () => ({ ok: false, json: async () => ({ error: { message: "Nome inválido" } }) }),
    () => assert.rejects(fetchJson("/api/v1/leaderboard"), /Nome inválido/),
  );
});

test("fetchJson uses a generic message when the error body is not JSON", async () => {
  await withFetch(
    async () => ({
      ok: false,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    }),
    () => assert.rejects(fetchJson("/api/v1/leaderboard"), /Falha na requisição/),
  );
});

test("fetchJson aborts the request after the timeout", async () => {
  await withFetch(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new Error("aborted")));
      }),
    () => assert.rejects(fetchJson("/api/v1/leaderboard", {}, 10), /aborted/),
  );
});
