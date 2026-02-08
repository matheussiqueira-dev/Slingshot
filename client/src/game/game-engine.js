import { GAME_CONFIG, PALETTE, STORAGE_KEYS } from "../config/game-config.js";
import { BubbleGrid } from "./grid-service.js";
import { findBestSuggestion } from "./hint-service.js";
import { clamp, lerp, randomFrom } from "../utils/math.js";

export class GameEngine {
  constructor({ renderer, eventBus, storage }) {
    this.renderer = renderer;
    this.eventBus = eventBus;
    this.storage = storage;

    this.config = { ...GAME_CONFIG };

    this.layout = {
      width: 0,
      height: 0,
      dpr: 1,
      padding: 24,
      radius: 20,
      rowHeight: 34,
      topOffset: 100,
      bottomLimit: 120,
      colsEven: 10,
      colsOdd: 10,
    };

    this.grid = new BubbleGrid((row) => this.getRowCols(row));

    this.score = 0;
    this.bestScore = Number(this.storage.get(STORAGE_KEYS.bestScore, 0)) || 0;
    this.level = 1;
    this.shots = 0;
    this.combo = 0;
    this.maxCombo = 0;

    this.currentColor = null;
    this.nextColor = null;
    this.movingBubble = null;

    this.paused = false;
    this.gameOver = false;
    this.hintsEnabled = true;
    this.zenMode = false;
    this.needsHint = true;

    this.assistant = {
      target: null,
      message: "As dicas de jogada aparecem aqui.",
    };

    this.aim = {
      active: false,
      angle: -Math.PI / 2,
      power: 0.45,
    };

    this.shooter = {
      x: 0,
      y: 0,
    };

    this.input = {
      dragging: false,
      dragStart: { x: 0, y: 0 },
    };

    this.lastTime = 0;
    this.rafId = null;
  }

  getRowCols(row) {
    return row % 2 === 0 ? this.layout.colsEven : this.layout.colsOdd;
  }

  setSize({ width, height, dpr }) {
    this.layout.width = width;
    this.layout.height = height;
    this.layout.dpr = dpr;

    const cols = width > 900 ? 12 : width > 680 ? 10 : 8;
    this.layout.padding = Math.max(16, Math.round(width * 0.03));
    this.layout.radius = Math.min(28, Math.floor((width - this.layout.padding * 2) / (cols * 2 + 1)));
    this.layout.rowHeight = this.layout.radius * Math.sqrt(3);
    this.layout.colsEven = cols;
    this.layout.colsOdd = cols;
    this.layout.topOffset = Math.max(64, Math.round(height * 0.09));

    this.shooter.x = width / 2;
    this.shooter.y = height - Math.max(90, this.layout.radius * 3.8);
    this.layout.bottomLimit = this.shooter.y - this.layout.radius * 1.45;

    this.renderer.resize(this.layout);
  }

  randomColor() {
    const count = Math.min(this.config.maxInitialColors + Math.floor((this.level - 1) / 3), PALETTE.length);
    return randomFrom(PALETTE.slice(0, count));
  }

  initGame() {
    this.score = 0;
    this.level = 1;
    this.combo = 0;
    this.maxCombo = 0;
    this.shots = 0;
    this.gameOver = false;
    this.paused = false;
    this.needsHint = true;
    this.assistant.target = null;

    this.grid.reset(this.config.initialRows, () => ({ color: this.randomColor() }));

    this.currentColor = this.randomColor();
    this.nextColor = this.randomColor();
    this.movingBubble = null;
    this.aim.active = false;

    this.eventBus.emit("game:restart");
    this.emitStatus("Pronto. Arraste para mirar e lançar.");
    this.syncHud();
    this.updateAssistant(true);
  }

  start() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    const loop = (time) => {
      this.tick(time);
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  tick(time) {
    if (!this.lastTime) {
      this.lastTime = time;
    }

    const dt = Math.min(0.02, (time - this.lastTime) / 1000);
    this.lastTime = time;

    if (!this.paused && !this.gameOver) {
      this.updateMovingBubble(dt);
      this.updateAssistant();
    }

    this.renderer.draw(this);
  }

  emitStatus(message) {
    this.eventBus.emit("game:status", { message });
  }

  syncHud() {
    this.eventBus.emit("game:hud", {
      score: this.score,
      bestScore: this.bestScore,
      level: this.level,
      combo: this.maxCombo,
      nextColor: this.nextColor,
      hintsEnabled: this.hintsEnabled,
      paused: this.paused,
      zenMode: this.zenMode,
    });
  }

  isInteractionLocked() {
    return this.paused || this.gameOver;
  }

  startDrag(x, y) {
    this.input.dragging = true;
    this.input.dragStart = { x, y };
    this.aim.active = true;
  }

  moveDrag(x, y) {
    if (!this.input.dragging) {
      return;
    }

    const pullX = this.input.dragStart.x - x;
    const pullY = this.input.dragStart.y - y;
    const distance = Math.hypot(pullX, pullY);
    const power = clamp(distance / (this.layout.width * this.config.aimPullDistanceFactor), 0, 1);

    if (distance > 4) {
      this.aim.angle = clamp(Math.atan2(pullY, pullX), this.config.minAngle, this.config.maxAngle);
      this.aim.power = lerp(this.aim.power, power, 0.22);
      this.aim.active = true;
    }
  }

  endDrag(x, y) {
    if (!this.input.dragging) {
      return;
    }

    this.input.dragging = false;

    const pullX = this.input.dragStart.x - x;
    const pullY = this.input.dragStart.y - y;
    const distance = Math.hypot(pullX, pullY);
    const power = clamp(distance / (this.layout.width * this.config.aimPullDistanceFactor), 0, 1);

    if (power <= 0.08) {
      this.aim.active = false;
      return;
    }

    const angle = clamp(Math.atan2(pullY, pullX), this.config.minAngle, this.config.maxAngle);
    this.shootBubble(angle, power);
  }

  nudgeAim(delta) {
    this.aim.angle = clamp(this.aim.angle + delta, this.config.minAngle, this.config.maxAngle);
    this.aim.power = clamp(this.aim.power + 0.04, 0.35, 1);
    this.aim.active = true;
  }

  shootFromAim() {
    this.shootBubble(this.aim.angle, clamp(this.aim.power, 0.4, 1));
  }

  shootBubble(angle, power) {
    if (this.movingBubble || this.gameOver || this.paused) {
      return;
    }

    const speed = Math.max(this.config.minShotSpeed, this.layout.width * 0.7) * power + this.config.baseShotSpeed;
    this.movingBubble = {
      x: this.shooter.x,
      y: this.shooter.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: this.currentColor,
    };

    this.aim.active = false;
    this.emitStatus("Disparo executado.");
  }

  updateMovingBubble(dt) {
    if (!this.movingBubble) {
      return;
    }

    const bubble = this.movingBubble;
    bubble.x += bubble.vx * dt;
    bubble.y += bubble.vy * dt;

    const leftBound = this.layout.padding + this.layout.radius;
    const rightBound = this.layout.width - this.layout.padding - this.layout.radius;

    if (bubble.x <= leftBound) {
      bubble.x = leftBound;
      bubble.vx *= -1;
    }

    if (bubble.x >= rightBound) {
      bubble.x = rightBound;
      bubble.vx *= -1;
    }

    if (bubble.y <= this.layout.topOffset + this.layout.radius) {
      this.placeBubble(bubble);
      return;
    }

    let collided = false;

    this.grid.forEachBubble(({ row, col }) => {
      if (collided) {
        return;
      }

      const pos = this.gridToWorld(row, col);
      const distance = Math.hypot(bubble.x - pos.x, bubble.y - pos.y);
      if (distance <= this.layout.radius * 2 - 2) {
        collided = true;
      }
    });

    if (collided) {
      this.placeBubble(bubble);
    }
  }

  gridToWorld(row, col) {
    const offset = row % 2 === 0 ? 0 : this.layout.radius;
    return {
      x: this.layout.padding + this.layout.radius + col * this.layout.radius * 2 + offset,
      y: this.layout.topOffset + row * this.layout.rowHeight,
    };
  }

  worldToGrid(x, y) {
    const row = Math.max(0, Math.round((y - this.layout.topOffset) / this.layout.rowHeight));
    const offset = row % 2 === 0 ? 0 : this.layout.radius;
    const col = Math.round((x - this.layout.padding - this.layout.radius - offset) / (this.layout.radius * 2));

    return {
      row,
      col: Math.max(0, col),
    };
  }

  placeBubble(bubble) {
    const target = this.worldToGrid(bubble.x, bubble.y);
    this.grid.ensureRows(target.row);

    let row = target.row;
    let col = clamp(target.col, 0, this.getRowCols(target.row) - 1);

    if (this.grid.get(row, col)) {
      const nearest = this.grid.findNearestEmpty(row, col);
      if (nearest) {
        row = nearest.row;
        col = nearest.col;
      }
    }

    this.grid.set(row, col, { color: bubble.color });
    this.movingBubble = null;
    this.shots += 1;
    this.needsHint = true;

    const cluster = this.grid.collectCluster(row, col, bubble.color);

    if (cluster.length >= 3) {
      this.grid.removeCluster(cluster);
      const floating = this.grid.removeFloatingBubbles();
      this.grid.dropEmptyRows();

      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      const multiplier = 1 + (this.combo - 1) * 0.25;
      const points = Math.floor((cluster.length * 10 + floating * 15) * multiplier);
      this.score += points;
      this.emitStatus(`Combo x${this.combo}. +${points} pontos.`);
    } else {
      this.combo = 0;
    }

    if (!this.zenMode && this.shots % this.config.shotsPerRow === 0) {
      this.grid.addTopRow(() => ({ color: this.randomColor() }));
      this.needsHint = true;
      this.emitStatus("Nova linha adicionada. Pressão aumentou.");
    }

    this.currentColor = this.nextColor;
    this.nextColor = this.randomColor();

    while (this.score > this.level * this.config.levelThreshold) {
      this.level += 1;
      this.emitStatus(`Nível ${this.level} alcançado.`);
    }

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.storage.set(STORAGE_KEYS.bestScore, this.bestScore);
    }

    this.syncHud();
    this.checkGameOver();
  }

  checkGameOver() {
    if (this.grid.rowCount > this.config.maxRows) {
      this.endGame();
      return;
    }

    let over = false;

    this.grid.forEachBubble(({ row, col }) => {
      if (over) {
        return;
      }
      const pos = this.gridToWorld(row, col);
      if (pos.y + this.layout.radius >= this.layout.bottomLimit) {
        over = true;
      }
    });

    if (over) {
      this.endGame();
    }
  }

  endGame() {
    this.gameOver = true;
    this.aim.active = false;
    this.emitStatus("Fim da rodada.");
    this.eventBus.emit("game:over", {
      score: this.score,
      level: this.level,
      combo: this.maxCombo,
      mode: this.zenMode ? "zen" : "standard",
    });
  }

  updateAssistant(force = false) {
    if (!this.hintsEnabled) {
      this.assistant.target = null;
      this.assistant.message = "Dicas desativadas. Decisão 100% sua.";
      this.eventBus.emit("game:assistant", { message: this.assistant.message });
      return;
    }

    if (!force && !this.needsHint) {
      return;
    }

    const suggestion = findBestSuggestion(this.grid, this.currentColor);

    if (suggestion) {
      this.assistant.target = suggestion;
      this.assistant.message = `Mire na célula destacada para formar grupo de ${suggestion.size} bolhas.`;
    } else {
      this.assistant.target = null;
      this.assistant.message = "Sem combinação direta. Abra espaço para a próxima cor.";
    }

    this.eventBus.emit("game:assistant", { message: this.assistant.message });
    this.needsHint = false;
  }

  toggleHints() {
    this.hintsEnabled = !this.hintsEnabled;
    this.needsHint = true;
    this.syncHud();
    this.updateAssistant(true);
  }

  togglePause() {
    if (this.gameOver) {
      return;
    }

    this.paused = !this.paused;
    this.aim.active = false;
    this.syncHud();
    this.emitStatus(this.paused ? "Jogo pausado." : "Partida retomada.");
  }

  toggleZen() {
    if (this.movingBubble) {
      this.emitStatus("Aguarde o disparo atual terminar para trocar o modo.");
      return;
    }

    this.zenMode = !this.zenMode;
    this.syncHud();
    this.emitStatus(this.zenMode ? "Modo Zen ativado. Sem novas linhas automáticas." : "Modo padrão ativado.");
  }
}
