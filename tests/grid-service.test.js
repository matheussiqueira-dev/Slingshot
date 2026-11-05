import assert from "node:assert/strict";
import test from "node:test";

import { BubbleGrid } from "../client/src/game/grid-service.js";
import { findBestSuggestion } from "../client/src/game/hint-service.js";

const getRowCols = (row) => (row % 2 === 0 ? 6 : 5);

/** Monta a grade a partir de linhas de cores; `.` marca célula vazia. */
function gridFrom(rows) {
  const grid = new BubbleGrid(getRowCols);
  grid.rows = rows.map((row) => [...row].map((color) => (color === "." ? null : { color })));
  return grid;
}

const cells = (list) =>
  list
    .map(({ row, col }) => `${row},${col}`)
    .sort()
    .join(" ");

test("reset fills alternating row widths through the factory", () => {
  const grid = new BubbleGrid(getRowCols);

  grid.reset(3, (row, col) => ({ color: `${row}-${col}` }));

  assert.equal(grid.rowCount, 3);
  assert.deepEqual(
    grid.rows.map((row) => row.length),
    [6, 5, 6],
  );
  assert.equal(grid.get(1, 4).color, "1-4");
});

test("neighbors use the offsets of even and odd rows", () => {
  const grid = new BubbleGrid(getRowCols);

  assert.equal(cells(grid.neighbors(2, 2)), "1,1 1,2 2,1 2,3 3,1 3,2");
  assert.equal(cells(grid.neighbors(1, 2)), "0,2 0,3 1,1 1,3 2,2 2,3");
});

test("cells outside the grid are invalid and read as empty", () => {
  const grid = gridFrom(["AAAAAA", "BBBBB"]);

  assert.equal(grid.isValidCell(-1, 0), false);
  assert.equal(grid.isValidCell(2, 0), false);
  assert.equal(grid.isValidCell(1, 5), false, "odd rows are one cell shorter");
  assert.equal(grid.isValidCell(0, 5), true);
  assert.equal(grid.get(5, 0), null);
});

test("set grows the grid on demand and clamps the column", () => {
  const grid = new BubbleGrid(getRowCols);

  grid.set(1, 99, { color: "A" });

  assert.equal(grid.rowCount, 2);
  assert.equal(grid.get(1, 4).color, "A");
});

test("a cluster of three matching bubbles pops", () => {
  const grid = gridFrom(["AAABBB", "CCCCC"]);

  const cluster = grid.collectCluster(0, 0, "A");
  assert.equal(cluster.length, 3);

  grid.removeCluster(cluster);
  assert.equal(grid.get(0, 0), null);
  assert.equal(grid.get(0, 2), null);
  assert.equal(grid.get(0, 3).color, "B");
});

test("a pair stays a pair: the cluster stops at other colors", () => {
  const grid = gridFrom(["AABBBB", "CCCCC"]);

  assert.equal(grid.collectCluster(0, 0, "A").length, 2);
});

test("a virtual bubble counts as part of the cluster before it lands", () => {
  const grid = gridFrom(["AA.BBB"]);
  grid.ensureRows(1);

  const virtual = { row: 0, col: 2, color: "A" };

  assert.equal(grid.getColorAt(0, 2, virtual), "A");
  assert.equal(grid.collectCluster(0, 2, "A", virtual).length, 3);
});

test("bubbles without a path to the top row fall", () => {
  const grid = gridFrom(["A.....", "A....", ".....B", ".B..."]);
  grid.rows[2] = [null, null, null, null, { color: "B" }, { color: "B" }];

  assert.equal(grid.removeFloatingBubbles(), 3);
  assert.equal(grid.get(0, 0).color, "A");
  assert.equal(grid.get(1, 0).color, "A");
  assert.equal(grid.get(2, 4), null);
  assert.equal(grid.get(3, 1), null);
});

test("removeFloatingBubbles handles an empty grid", () => {
  assert.equal(new BubbleGrid(getRowCols).removeFloatingBubbles(), 0);
});

test("dropEmptyRows trims only trailing empty rows", () => {
  const grid = gridFrom(["A.....", ".....", "B.....", ".....", "......"]);

  grid.dropEmptyRows();

  assert.equal(grid.rowCount, 3);
});

test("addTopRow pushes the existing rows down", () => {
  const grid = gridFrom(["AAAAAA"]);

  grid.addTopRow(() => ({ color: "Z" }));

  assert.equal(grid.rowCount, 2);
  assert.equal(grid.get(0, 0).color, "Z");
  assert.equal(grid.rows[1][0].color, "A");
});

test("forEachBubble visits only occupied cells", () => {
  const seen = [];

  gridFrom(["A.B...", ".C..."]).forEachBubble(({ row, col, bubble }) =>
    seen.push(`${row},${col}:${bubble.color}`),
  );

  assert.deepEqual(seen, ["0,0:A", "0,2:B", "1,1:C"]);
});

test("findNearestEmpty keeps a free cell and searches around an occupied one", () => {
  const grid = gridFrom(["AAAAAA", "A.AAA"]);

  assert.deepEqual(grid.findNearestEmpty(1, 1), { row: 1, col: 1 });
  assert.deepEqual(grid.findNearestEmpty(0, 1), { row: 1, col: 1 });
  assert.equal(gridFrom(["AAAAAA", "AAAAA"]).findNearestEmpty(0, 0), null);
});

test("the hint picks the largest cluster the shot can complete", () => {
  const grid = gridFrom(["AA.BBB", ".....", "AAA...", "....."]);

  const hint = findBestSuggestion(grid, "A");

  assert.equal(hint.size, 6, "the cell between both groups joins them");
  assert.equal(hint.row, 1);
  assert.equal(hint.col, 1);
});

test("the hint favors the higher cell when clusters have the same size", () => {
  const grid = gridFrom(["AA....", ".....", "......", ".....", "AA....", "....."]);

  const hint = findBestSuggestion(grid, "A");

  assert.equal(hint.size, 3);
  assert.equal(hint.row, 0);
  assert.equal(hint.confidence, grid.rowCount);
});

test("the hint stays silent without a color or a cluster of three", () => {
  assert.equal(findBestSuggestion(gridFrom(["AA...."]), null), null);
  assert.equal(findBestSuggestion(gridFrom(["A.B..."]), "A"), null);
  assert.equal(findBestSuggestion(gridFrom(["BBBBBB"]), "A"), null);
});
