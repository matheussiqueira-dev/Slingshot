import assert from "node:assert/strict";
import test from "node:test";

import { getScoreSchemaForTests } from "../server/src/modules/leaderboard/leaderboard.service.js";

test("score schema accepts valid score payload", () => {
  const schema = getScoreSchemaForTests();

  const parsed = schema.safeParse({
    playerName: "Player_01",
    score: 1500,
    level: 5,
    combo: 7,
    mode: "standard",
  });

  assert.equal(parsed.success, true);
});

test("score schema rejects invalid characters in player name", () => {
  const schema = getScoreSchemaForTests();

  const parsed = schema.safeParse({
    playerName: "<script>",
    score: 100,
    level: 1,
    combo: 0,
    mode: "standard",
  });

  assert.equal(parsed.success, false);
});
