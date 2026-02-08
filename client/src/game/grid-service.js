import { EVEN_NEIGHBOR_OFFSETS, ODD_NEIGHBOR_OFFSETS } from "../config/game-config.js";
import { clamp } from "../utils/math.js";

export class BubbleGrid {
  constructor(getRowCols) {
    this.getRowCols = getRowCols;
    this.rows = [];
  }

  reset(initialRows, createBubble) {
    this.rows = [];
    for (let row = 0; row < initialRows; row += 1) {
      const cols = this.getRowCols(row);
      const values = [];
      for (let col = 0; col < cols; col += 1) {
        values.push(createBubble(row, col));
      }
      this.rows.push(values);
    }
  }

  get rowCount() {
    return this.rows.length;
  }

  ensureRows(rowIndex) {
    while (this.rows.length <= rowIndex) {
      const row = this.rows.length;
      this.rows.push(new Array(this.getRowCols(row)).fill(null));
    }
  }

  get(row, col) {
    if (!this.isValidCell(row, col)) {
      return null;
    }
    return this.rows[row][col];
  }

  set(row, col, value) {
    this.ensureRows(row);
    const cols = this.getRowCols(row);
    const safeCol = clamp(col, 0, cols - 1);
    this.rows[row][safeCol] = value;
  }

  isValidCell(row, col) {
    if (row < 0 || row >= this.rows.length) {
      return false;
    }
    const cols = this.getRowCols(row);
    return col >= 0 && col < cols;
  }

  getColorAt(row, col, virtual = null) {
    if (virtual && virtual.row === row && virtual.col === col) {
      return virtual.color;
    }

    const bubble = this.get(row, col);
    return bubble ? bubble.color : null;
  }

  neighbors(row, col) {
    const offsets = row % 2 === 0 ? EVEN_NEIGHBOR_OFFSETS : ODD_NEIGHBOR_OFFSETS;
    return offsets.map(([dr, dc]) => ({ row: row + dr, col: col + dc }));
  }

  collectCluster(startRow, startCol, color, virtual = null) {
    const queue = [{ row: startRow, col: startCol }];
    const visited = new Set();
    const cluster = [];

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      const key = `${current.row},${current.col}`;
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);

      if (this.getColorAt(current.row, current.col, virtual) !== color) {
        continue;
      }

      cluster.push(current);

      this.neighbors(current.row, current.col).forEach((neighbor) => {
        const isVirtual = Boolean(virtual && neighbor.row === virtual.row && neighbor.col === virtual.col);
        if (!isVirtual && !this.isValidCell(neighbor.row, neighbor.col)) {
          return;
        }

        const neighborKey = `${neighbor.row},${neighbor.col}`;
        if (!visited.has(neighborKey)) {
          queue.push(neighbor);
        }
      });
    }

    return cluster;
  }

  removeCluster(cluster) {
    cluster.forEach(({ row, col }) => {
      if (this.isValidCell(row, col)) {
        this.rows[row][col] = null;
      }
    });
  }

  removeFloatingBubbles() {
    if (!this.rows.length) {
      return 0;
    }

    const queue = [];
    const connected = new Set();

    this.rows[0].forEach((bubble, col) => {
      if (bubble) {
        queue.push({ row: 0, col });
      }
    });

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      const key = `${current.row},${current.col}`;
      if (connected.has(key)) {
        continue;
      }
      connected.add(key);

      this.neighbors(current.row, current.col).forEach((neighbor) => {
        if (!this.isValidCell(neighbor.row, neighbor.col)) {
          return;
        }

        if (!this.rows[neighbor.row][neighbor.col]) {
          return;
        }

        const neighborKey = `${neighbor.row},${neighbor.col}`;
        if (!connected.has(neighborKey)) {
          queue.push(neighbor);
        }
      });
    }

    let removed = 0;

    for (let row = 0; row < this.rows.length; row += 1) {
      for (let col = 0; col < this.rows[row].length; col += 1) {
        const bubble = this.rows[row][col];
        if (!bubble) {
          continue;
        }

        const key = `${row},${col}`;
        if (!connected.has(key)) {
          this.rows[row][col] = null;
          removed += 1;
        }
      }
    }

    return removed;
  }

  dropEmptyRows() {
    while (this.rows.length > 0 && this.rows[this.rows.length - 1].every((bubble) => !bubble)) {
      this.rows.pop();
    }
  }

  addTopRow(createBubble) {
    const cols = this.getRowCols(0);
    const row = [];
    for (let col = 0; col < cols; col += 1) {
      row.push(createBubble(0, col));
    }
    this.rows.unshift(row);
  }

  forEachBubble(callback) {
    for (let row = 0; row < this.rows.length; row += 1) {
      for (let col = 0; col < this.rows[row].length; col += 1) {
        const bubble = this.rows[row][col];
        if (!bubble) {
          continue;
        }
        callback({ row, col, bubble });
      }
    }
  }

  findNearestEmpty(row, col) {
    if (!this.get(row, col)) {
      return { row, col };
    }

    const queue = [{ row, col }];
    const visited = new Set();

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      const key = `${current.row},${current.col}`;

      if (visited.has(key)) {
        continue;
      }
      visited.add(key);

      if (!this.isValidCell(current.row, current.col)) {
        continue;
      }

      if (!this.get(current.row, current.col)) {
        return current;
      }

      this.neighbors(current.row, current.col).forEach((neighbor) => {
        const neighborKey = `${neighbor.row},${neighbor.col}`;
        if (!visited.has(neighborKey)) {
          queue.push(neighbor);
        }
      });
    }

    return null;
  }
}
