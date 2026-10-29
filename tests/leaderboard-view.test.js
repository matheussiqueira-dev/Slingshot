import assert from "node:assert/strict";
import test from "node:test";

import { createLeaderboardItem, renderLeaderboardList } from "../client/src/ui/leaderboard-view.js";
import { createFakeDocument } from "./fake-dom.js";

test("leaderboard item keeps markup in player names as literal text", () => {
  const doc = createFakeDocument();
  const name = '<img src=x onerror="alert(1)">';

  const item = createLeaderboardItem(doc, { playerName: name, score: 900 }, 0);
  const [rank, nameSpan, points] = item.children;

  assert.equal(item.tagName, "LI");
  assert.equal(rank.textContent, "1");
  assert.equal(nameSpan.className, "name");
  assert.equal(nameSpan.textContent, name);
  assert.equal(nameSpan.title, name);
  assert.equal(nameSpan.children.length, 0);
  assert.equal(points.textContent, "900");
});

test("renderLeaderboardList renders ordered entries without innerHTML", () => {
  const doc = createFakeDocument();
  const list = doc.createElement("ol");

  renderLeaderboardList(doc, list, [
    { playerName: "Ana", score: 300 },
    { playerName: "Bia", score: 200 },
  ]);

  assert.equal(list.innerHTMLWrites, 0);
  assert.equal(list.children.length, 2);
  assert.equal(list.children[1].children[0].textContent, "2");
  assert.equal(list.children[1].children[1].textContent, "Bia");
});

test("renderLeaderboardList shows placeholder when there are no entries", () => {
  const doc = createFakeDocument();
  const list = doc.createElement("ol");
  list.append(doc.createElement("li"));

  renderLeaderboardList(doc, list, []);

  assert.equal(list.children.length, 1);
  assert.equal(list.children[0].className, "placeholder");
  assert.equal(list.children[0].textContent, "Nenhuma pontuação registrada ainda.");
});
