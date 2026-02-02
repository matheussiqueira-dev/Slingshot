const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const levelEl = document.getElementById("level");
const statusEl = document.getElementById("status");
const assistantMessageEl = document.getElementById("assistantMessage");

const toggleHintsBtn = document.getElementById("toggleHints");
const pauseBtn = document.getElementById("pause");
const overlayEl = document.getElementById("overlay");
const restartBtn = document.getElementById("restart");

const palette = ["#ff6b6b", "#ffd93d", "#6ae3ff", "#8affb3", "#c7a1ff"];
const maxInitialColors = 4;
const STORAGE_KEY = "slingshot_best_score";
const EVEN_NEIGHBOR_OFFSETS = [
  [-1, -1],
  [-1, 0],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
];
const ODD_NEIGHBOR_OFFSETS = [
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, 0],
  [1, 1],
];

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  padding: 24,
  radius: 20,
  rowHeight: 34,
  topOffset: 110,
  bottomLimit: 140,
  colsEven: 10,
  colsOdd: 9,
  grid: [],
  movingBubble: null,
  currentColor: null,
  nextColor: null,
  shots: 0,
  score: 0,
  bestScore: 0,
  level: 1,
  paused: false,
  gameOver: false,
  hintsEnabled: true,
  needsHint: true,
  assistant: {
    target: null,
    message: "",
  },
  aim: {
    angle: -Math.PI / 2,
    power: 0.4,
    active: false,
  },
  shooter: {
    x: 0,
    y: 0,
  },
  input: {
    dragging: false,
    dragStart: { x: 0, y: 0 },
    pointer: { x: 0, y: 0 },
  },
  config: {
    shotsPerRow: 6,
    maxRows: 11,
    minAngle: degToRad(15),
    maxAngle: degToRad(165),
  },
  lastTime: 0,
};

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function resize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.dpr = window.devicePixelRatio || 1;

  canvas.width = state.width * state.dpr;
  canvas.height = state.height * state.dpr;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

  const cols = state.width > 960 ? 12 : state.width > 680 ? 10 : 8;
  state.padding = Math.max(18, Math.round(state.width * 0.03));
  state.radius = Math.min(28, Math.floor((state.width - state.padding * 2) / (cols * 2 + 1)));
  state.rowHeight = state.radius * Math.sqrt(3);
  state.colsEven = cols;
  state.colsOdd = cols;
  state.topOffset = Math.max(90, Math.round(state.height * 0.11));
  state.shooter.x = state.width / 2;
  state.shooter.y = state.height - Math.max(120, state.radius * 4);
  state.bottomLimit = state.shooter.y - state.radius * 1.5;
}

function randomColor() {
  const colorCount = Math.min(maxInitialColors + Math.floor((state.level - 1) / 3), palette.length);
  return palette[Math.floor(Math.random() * colorCount)];
}

function getRowCols(row) {
  return row % 2 === 0 ? state.colsEven : state.colsOdd;
}

function ensureRows(rowIndex) {
  while (state.grid.length <= rowIndex) {
    const cols = getRowCols(state.grid.length);
    state.grid.push(new Array(cols).fill(null));
  }
}

function initGrid() {
  state.grid = [];
  const initialRows = 6;
  for (let r = 0; r < initialRows; r += 1) {
    const cols = getRowCols(r);
    const row = [];
    for (let c = 0; c < cols; c += 1) {
      row.push({ color: randomColor() });
    }
    state.grid.push(row);
  }
}

function initGame() {
  state.score = 0;
  state.shots = 0;
  state.level = 1;
  state.gameOver = false;
  state.paused = false;
  state.needsHint = true;
  state.movingBubble = null;
  initGrid();
  state.currentColor = randomColor();
  state.nextColor = randomColor();
  overlayEl.classList.add("hidden");
  updateScore();
  updateBestScore();
  updateLevel();
  updateStatus("Pronto. Use o mouse para mirar e lançar.");
}

function updateScore() {
  scoreEl.textContent = state.score.toString();
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    updateBestScore();
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, state.bestScore.toString());
    }
  }
}

function updateBestScore() {
  if (!bestScoreEl) return;
  bestScoreEl.textContent = state.bestScore.toString();
}

function updateLevel() {
  levelEl.textContent = state.level.toString();
}

function updateStatus(message) {
  statusEl.textContent = message;
}

function loadBestScore() {
  if (!bestScoreEl || typeof localStorage === "undefined") return;
  const saved = Number.parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  state.bestScore = Number.isFinite(saved) ? saved : 0;
  updateBestScore();
}

function gridToWorld(row, col) {
  const offset = row % 2 === 0 ? 0 : state.radius;
  const x = state.padding + state.radius + col * state.radius * 2 + offset;
  const y = state.topOffset + row * state.rowHeight;
  return { x, y };
}

function worldToGrid(x, y) {
  const row = Math.round((y - state.topOffset) / state.rowHeight);
  const safeRow = Math.max(0, row);
  const offset = safeRow % 2 === 0 ? 0 : state.radius;
  const col = Math.round((x - state.padding - state.radius - offset) / (state.radius * 2));
  return { row: safeRow, col: Math.max(0, col) };
}

function neighbors(row, col) {
  const offsets = row % 2 === 0 ? EVEN_NEIGHBOR_OFFSETS : ODD_NEIGHBOR_OFFSETS;
  return offsets.map(([dr, dc]) => ({ row: row + dr, col: col + dc }));
}

function isValidCell(row, col) {
  if (row < 0 || row >= state.grid.length) return false;
  const cols = getRowCols(row);
  return col >= 0 && col < cols;
}

function getColorAt(row, col, virtual) {
  if (virtual && row === virtual.row && col === virtual.col) {
    return virtual.color;
  }
  if (!isValidCell(row, col)) return null;
  const bubble = state.grid[row][col];
  return bubble ? bubble.color : null;
}

function collectCluster(startRow, startCol, color, virtual) {
  const queue = [{ row: startRow, col: startCol }];
  let queueIndex = 0;
  const visited = new Set();
  const cluster = [];

  while (queueIndex < queue.length) {
    const current = queue[queueIndex];
    queueIndex += 1;
    const key = `${current.row},${current.col}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (getColorAt(current.row, current.col, virtual) !== color) continue;

    cluster.push(current);
    neighbors(current.row, current.col).forEach((neighbor) => {
      if (isValidCell(neighbor.row, neighbor.col) || (virtual && neighbor.row === virtual.row && neighbor.col === virtual.col)) {
        const neighborKey = `${neighbor.row},${neighbor.col}`;
        if (!visited.has(neighborKey)) {
          queue.push(neighbor);
        }
      }
    });
  }

  return cluster;
}

function removeCluster(cluster) {
  cluster.forEach(({ row, col }) => {
    if (isValidCell(row, col)) {
      state.grid[row][col] = null;
    }
  });
}

function removeFloatingBubbles() {
  const connected = new Set();
  const queue = [];
  let queueIndex = 0;

  if (state.grid.length === 0) return 0;

  state.grid[0].forEach((bubble, col) => {
    if (bubble) {
      queue.push({ row: 0, col });
    }
  });

  while (queueIndex < queue.length) {
    const current = queue[queueIndex];
    queueIndex += 1;
    const key = `${current.row},${current.col}`;
    if (connected.has(key)) continue;
    connected.add(key);

    neighbors(current.row, current.col).forEach((neighbor) => {
      if (isValidCell(neighbor.row, neighbor.col)) {
        const bubble = state.grid[neighbor.row][neighbor.col];
        if (bubble) {
          const neighborKey = `${neighbor.row},${neighbor.col}`;
          if (!connected.has(neighborKey)) {
            queue.push(neighbor);
          }
        }
      }
    });
  }

  let removed = 0;
  for (let row = 0; row < state.grid.length; row += 1) {
    for (let col = 0; col < state.grid[row].length; col += 1) {
      const bubble = state.grid[row][col];
      if (!bubble) continue;
      const key = `${row},${col}`;
      if (!connected.has(key)) {
        state.grid[row][col] = null;
        removed += 1;
      }
    }
  }

  return removed;
}

function dropEmptyRows() {
  while (state.grid.length && state.grid[state.grid.length - 1].every((bubble) => !bubble)) {
    state.grid.pop();
  }
}

function addRow() {
  const cols = getRowCols(0);
  const newRow = [];
  for (let c = 0; c < cols; c += 1) {
    newRow.push({ color: randomColor() });
  }
  state.grid.unshift(newRow);
  state.needsHint = true;
}

function checkGameOver() {
  for (let row = 0; row < state.grid.length; row += 1) {
    for (let col = 0; col < state.grid[row].length; col += 1) {
      if (!state.grid[row][col]) continue;
      const pos = gridToWorld(row, col);
      if (pos.y + state.radius >= state.bottomLimit) {
        endGame();
        return;
      }
    }
  }
}

function endGame() {
  state.gameOver = true;
  overlayEl.classList.remove("hidden");
}

function placeBubble(bubble) {
  const target = worldToGrid(bubble.x, bubble.y);
  ensureRows(target.row);

  let row = target.row;
  let col = clamp(target.col, 0, getRowCols(target.row) - 1);

  if (state.grid[row][col]) {
    const queue = [{ row, col }];
    let queueIndex = 0;
    const visited = new Set();
    let found = null;

    while (queueIndex < queue.length) {
      const current = queue[queueIndex];
      queueIndex += 1;
      const key = `${current.row},${current.col}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (!isValidCell(current.row, current.col)) continue;
      if (!state.grid[current.row][current.col]) {
        found = current;
        break;
      }

      neighbors(current.row, current.col).forEach((neighbor) => queue.push(neighbor));
    }

    if (found) {
      row = found.row;
      col = found.col;
    }
  }

  ensureRows(row);
  if (!state.grid[row]) {
    state.grid[row] = new Array(getRowCols(row)).fill(null);
  }
  state.grid[row][col] = { color: bubble.color };
  state.movingBubble = null;
  state.shots += 1;
  state.needsHint = true;

  const cluster = collectCluster(row, col, bubble.color);
  if (cluster.length >= 3) {
    removeCluster(cluster);
    const dropped = removeFloatingBubbles();
    dropEmptyRows();
    const bonus = cluster.length * 10 + dropped * 15;
    state.score += bonus;
    updateScore();
  }

  if (state.shots % state.config.shotsPerRow === 0) {
    addRow();
  }

  state.currentColor = state.nextColor;
  state.nextColor = randomColor();

  if (state.score > state.level * 500) {
    state.level += 1;
    updateLevel();
  }

  checkGameOver();
}

function shootBubble(angle, power) {
  if (state.movingBubble || state.gameOver || state.paused) return;
  const speed = Math.max(460, state.width * 0.7) * power + 200;
  state.movingBubble = {
    x: state.shooter.x,
    y: state.shooter.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    color: state.currentColor,
  };
  state.aim.active = false;
}

function updateMovingBubble(dt) {
  if (!state.movingBubble) return;
  const bubble = state.movingBubble;

  bubble.x += bubble.vx * dt;
  bubble.y += bubble.vy * dt;

  const leftBound = state.padding + state.radius;
  const rightBound = state.width - state.padding - state.radius;

  if (bubble.x <= leftBound) {
    bubble.x = leftBound;
    bubble.vx *= -1;
  }

  if (bubble.x >= rightBound) {
    bubble.x = rightBound;
    bubble.vx *= -1;
  }

  if (bubble.y <= state.topOffset + state.radius) {
    placeBubble(bubble);
    return;
  }

  for (let row = 0; row < state.grid.length; row += 1) {
    for (let col = 0; col < state.grid[row].length; col += 1) {
      const existing = state.grid[row][col];
      if (!existing) continue;
      const pos = gridToWorld(row, col);
      const dx = bubble.x - pos.x;
      const dy = bubble.y - pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= state.radius * 2 - 2) {
        placeBubble(bubble);
        return;
      }
    }
  }
}

function findBestSuggestion() {
  if (!state.currentColor) return null;

  let best = null;
  let bestScore = -Infinity;

  for (let row = 0; row < state.grid.length; row += 1) {
    for (let col = 0; col < state.grid[row].length; col += 1) {
      const bubble = state.grid[row][col];
      if (!bubble || bubble.color !== state.currentColor) continue;

      neighbors(row, col).forEach((neighbor) => {
        if (!isValidCell(neighbor.row, neighbor.col)) return;
        if (state.grid[neighbor.row][neighbor.col]) return;

        const virtual = { row: neighbor.row, col: neighbor.col, color: state.currentColor };
        const cluster = collectCluster(neighbor.row, neighbor.col, state.currentColor, virtual);
        if (cluster.length >= 3) {
          const heightScore = state.grid.length - neighbor.row;
          const score = cluster.length * 10 + heightScore;
          if (score > bestScore) {
            bestScore = score;
            best = { row: neighbor.row, col: neighbor.col, size: cluster.length };
          }
        }
      });
    }
  }

  return best;
}

function updateAssistant() {
  if (!state.hintsEnabled) {
    state.assistant.target = null;
    const nextMessage = "Dicas desativadas. Você está no controle.";
    if (state.assistant.message !== nextMessage) {
      state.assistant.message = nextMessage;
      assistantMessageEl.textContent = state.assistant.message;
    }
    return;
  }

  if (!state.needsHint) return;

  const suggestion = findBestSuggestion();
  if (suggestion) {
    state.assistant.target = suggestion;
    state.assistant.message = `Sugestão: mire no espaço destacado para formar ${suggestion.size} bolhas.`;
  } else {
    state.assistant.target = null;
    state.assistant.message = "Nenhuma combinação direta. Abra caminho para a próxima cor.";
  }

  assistantMessageEl.textContent = state.assistant.message;
  state.needsHint = false;
}

function drawBackground() {
  ctx.save();
  ctx.fillStyle = "rgba(6, 10, 18, 0.2)";
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.restore();
}

function drawBubble(x, y, color, highlight) {
  ctx.save();
  const gradient = ctx.createRadialGradient(x - state.radius * 0.3, y - state.radius * 0.3, state.radius * 0.3, x, y, state.radius * 1.2);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.4, color);
  gradient.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, state.radius, 0, Math.PI * 2);
  ctx.fill();

  if (highlight) {
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, state.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGrid() {
  for (let row = 0; row < state.grid.length; row += 1) {
    for (let col = 0; col < state.grid[row].length; col += 1) {
      const bubble = state.grid[row][col];
      if (!bubble) continue;
      const pos = gridToWorld(row, col);
      drawBubble(pos.x, pos.y, bubble.color, false);
    }
  }
}

function drawShooter() {
  ctx.save();
  const baseY = state.shooter.y + state.radius * 1.2;
  ctx.fillStyle = "rgba(12, 20, 34, 0.75)";
  ctx.beginPath();
  ctx.arc(state.shooter.x, baseY, state.radius * 1.8, Math.PI, Math.PI * 2);
  ctx.fill();

  if (state.currentColor) {
    drawBubble(state.shooter.x, state.shooter.y, state.currentColor, false);
  }

  if (state.nextColor) {
    drawBubble(state.shooter.x + state.radius * 2.6, state.shooter.y + state.radius * 0.6, state.nextColor, false);
  }

  ctx.restore();
}

function drawAimLine() {
  if (!state.aim.active) return;

  const maxLength = state.height * 0.8;
  const segments = 2;
  let startX = state.shooter.x;
  let startY = state.shooter.y;
  let angle = clamp(state.aim.angle, state.config.minAngle, state.config.maxAngle);
  let remaining = maxLength;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.setLineDash([6, 8]);
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let i = 0; i < segments; i += 1) {
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    let endX = startX + dirX * remaining;
    let endY = startY + dirY * remaining;

    const leftBound = state.padding + state.radius;
    const rightBound = state.width - state.padding - state.radius;
    let hitWall = false;

    if (endX < leftBound) {
      const t = (leftBound - startX) / (endX - startX);
      endX = leftBound;
      endY = startY + (endY - startY) * t;
      hitWall = true;
    }

    if (endX > rightBound) {
      const t = (rightBound - startX) / (endX - startX);
      endX = rightBound;
      endY = startY + (endY - startY) * t;
      hitWall = true;
    }

    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);

    if (!hitWall) break;
    const segmentLength = Math.hypot(endX - startX, endY - startY);
    remaining -= segmentLength;
    startX = endX;
    startY = endY;
    angle = Math.PI - angle;
  }

  ctx.stroke();
  ctx.restore();
}

function drawAssistant() {
  if (!state.hintsEnabled || !state.assistant.target) return;
  const pos = gridToWorld(state.assistant.target.row, state.assistant.target.col);

  ctx.save();
  ctx.strokeStyle = "rgba(69, 242, 242, 0.9)";
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, state.radius + 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(state.shooter.x, state.shooter.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.restore();
}

function updateAimFromDrag(currentX, currentY) {
  const pullX = state.input.dragStart.x - currentX;
  const pullY = state.input.dragStart.y - currentY;
  const dist = Math.hypot(pullX, pullY);
  const power = clamp(dist / (state.width * 0.3), 0, 1);

  if (dist > 4) {
    const angle = Math.atan2(pullY, pullX);
    state.aim.angle = clamp(angle, state.config.minAngle, state.config.maxAngle);
    state.aim.power = lerp(state.aim.power, power, 0.2);
    state.aim.active = true;
  }
}

function handlePointerDown(event) {
  state.input.dragging = true;
  state.input.dragStart = { x: event.clientX, y: event.clientY };
  state.aim.active = true;
}

function handlePointerMove(event) {
  state.input.pointer = { x: event.clientX, y: event.clientY };

  if (state.input.dragging) {
    updateAimFromDrag(event.clientX, event.clientY);
  }
}

function handlePointerUp(event) {
  if (!state.input.dragging) return;
  state.input.dragging = false;

  const pullX = state.input.dragStart.x - event.clientX;
  const pullY = state.input.dragStart.y - event.clientY;
  const dist = Math.hypot(pullX, pullY);
  const power = clamp(dist / (state.width * 0.3), 0, 1);
  if (power > 0.08) {
    const angle = Math.atan2(pullY, pullX);
    shootBubble(clamp(angle, state.config.minAngle, state.config.maxAngle), power);
  }
  state.aim.active = false;
}

function toggleHints() {
  state.hintsEnabled = !state.hintsEnabled;
  toggleHintsBtn.classList.toggle("active", state.hintsEnabled);
  toggleHintsBtn.textContent = state.hintsEnabled ? "Dicas: Ativas" : "Dicas: Desligadas";
  state.needsHint = true;
}

function togglePause() {
  state.paused = !state.paused;
  pauseBtn.textContent = state.paused ? "Retomar" : "Pausar";
  state.aim.active = false;
  updateStatus(state.paused ? "Jogo pausado." : "Jogo em andamento.");
}

function gameLoop(time) {
  if (!state.lastTime) state.lastTime = time;
  const dt = Math.min(0.02, (time - state.lastTime) / 1000);
  state.lastTime = time;

  if (!state.paused && !state.gameOver) {
    updateMovingBubble(dt);
    updateAssistant();
  }

  draw();
  requestAnimationFrame(gameLoop);
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);
  drawBackground();
  drawGrid();
  drawAssistant();
  drawAimLine();

  if (state.movingBubble) {
    drawBubble(state.movingBubble.x, state.movingBubble.y, state.movingBubble.color, false);
  }

  drawShooter();
}

function bindEvents() {
  window.addEventListener("resize", () => {
    resize();
  });

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointerleave", handlePointerUp);

  toggleHintsBtn.addEventListener("click", toggleHints);
  pauseBtn.addEventListener("click", togglePause);
  restartBtn.addEventListener("click", () => {
    initGame();
  });
}

function start() {
  resize();
  loadBestScore();
  initGame();
  bindEvents();
  requestAnimationFrame(gameLoop);
}

start();
