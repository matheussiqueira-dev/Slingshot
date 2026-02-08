import { EventBus } from "./core/event-bus.js";
import { Storage } from "./core/storage.js";
import { CanvasRenderer } from "./rendering/canvas-renderer.js";
import { GameEngine } from "./game/game-engine.js";
import { InputController } from "./input/input-controller.js";
import { UIController } from "./ui/ui-controller.js";
import { LeaderboardService } from "./services/leaderboard-service.js";

const canvas = document.getElementById("gameCanvas");

const eventBus = new EventBus();
const storage = new Storage();
const renderer = new CanvasRenderer(canvas);
const gameEngine = new GameEngine({ renderer, eventBus, storage });
const input = new InputController(canvas, gameEngine);
const ui = new UIController(eventBus, storage);
const leaderboard = new LeaderboardService(storage);

let lastResult = {
  score: 0,
  level: 1,
  combo: 0,
  mode: "standard",
};

function resizeGame() {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (width < 200 || height < 200) {
    return;
  }

  gameEngine.setSize({ width, height, dpr });
}

async function refreshLeaderboard() {
  ui.renderLeaderboard([]);
  const entries = await leaderboard.getTop(10);
  ui.renderLeaderboard(entries);
}

async function submitScore(playerName) {
  const result = await leaderboard.submitScore({
    playerName,
    score: lastResult.score,
    level: lastResult.level,
    combo: lastResult.combo,
    mode: lastResult.mode,
  });

  if (result.accepted) {
    ui.updateStatus(result.fallback ? "Pontuação salva localmente (API indisponível)." : "Pontuação enviada ao leaderboard.");
    await refreshLeaderboard();
  }
}

function bindEventBus() {
  eventBus.on("game:hud", ({ detail }) => {
    ui.updateHUD(detail);
    ui.setHintsState(detail.hintsEnabled);
    ui.setPauseState(detail.paused);
    ui.setZenState(detail.zenMode);
  });

  eventBus.on("game:status", ({ detail }) => {
    ui.updateStatus(detail.message);
  });

  eventBus.on("game:assistant", ({ detail }) => {
    ui.updateAssistant(detail.message);
  });

  eventBus.on("game:over", async ({ detail }) => {
    lastResult = detail;
    ui.showOverlay(detail);
    await refreshLeaderboard();
  });

  eventBus.on("game:restart", () => {
    ui.hideOverlay();
  });

  eventBus.on("ui:toggleHints", () => {
    gameEngine.toggleHints();
  });

  eventBus.on("ui:toggleZen", () => {
    gameEngine.toggleZen();
  });

  eventBus.on("ui:togglePause", () => {
    gameEngine.togglePause();
  });

  eventBus.on("ui:restart", () => {
    gameEngine.initGame();
  });

  eventBus.on("ui:refreshLeaderboard", async () => {
    await refreshLeaderboard();
  });

  eventBus.on("ui:submitScore", async ({ detail }) => {
    await submitScore(detail.playerName);
  });
}

function init() {
  ui.init();
  bindEventBus();
  input.init();

  const resizeObserver = new ResizeObserver(() => {
    resizeGame();
  });
  resizeObserver.observe(canvas);

  window.addEventListener("resize", resizeGame);

  resizeGame();
  gameEngine.initGame();
  gameEngine.start();
  refreshLeaderboard();
}

init();
