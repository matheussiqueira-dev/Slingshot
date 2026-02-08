export function findBestSuggestion(grid, currentColor) {
  if (!currentColor) {
    return null;
  }

  let best = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let row = 0; row < grid.rowCount; row += 1) {
    const cells = grid.rows[row];
    for (let col = 0; col < cells.length; col += 1) {
      const bubble = cells[col];
      if (!bubble || bubble.color !== currentColor) {
        continue;
      }

      grid.neighbors(row, col).forEach((neighbor) => {
        if (!grid.isValidCell(neighbor.row, neighbor.col)) {
          return;
        }

        if (grid.get(neighbor.row, neighbor.col)) {
          return;
        }

        const virtual = { row: neighbor.row, col: neighbor.col, color: currentColor };
        const cluster = grid.collectCluster(neighbor.row, neighbor.col, currentColor, virtual);

        if (cluster.length < 3) {
          return;
        }

        const pressureRelief = grid.rowCount - neighbor.row;
        const score = cluster.length * 10 + pressureRelief;

        if (score > bestScore) {
          bestScore = score;
          best = {
            row: neighbor.row,
            col: neighbor.col,
            size: cluster.length,
            confidence: pressureRelief,
          };
        }
      });
    }
  }

  return best;
}
