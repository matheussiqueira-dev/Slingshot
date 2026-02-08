import { STORAGE_KEYS } from "../config/game-config.js";
import { sanitizePlayerName } from "../utils/string.js";

export class UIController {
  constructor(eventBus, storage) {
    this.eventBus = eventBus;
    this.storage = storage;

    this.elements = {
      score: document.getElementById("score"),
      bestScore: document.getElementById("bestScore"),
      level: document.getElementById("level"),
      combo: document.getElementById("combo"),
      status: document.getElementById("status"),
      assistantMessage: document.getElementById("assistantMessage"),
      hintsButton: document.getElementById("toggleHints"),
      zenButton: document.getElementById("toggleZen"),
      pauseButton: document.getElementById("pause"),
      restartButton: document.getElementById("restart"),
      restartQuickButton: document.getElementById("restartQuick"),
      submitScoreButton: document.getElementById("submitScore"),
      overlay: document.getElementById("overlay"),
      summary: document.getElementById("gameOverSummary"),
      leaderboardList: document.getElementById("leaderboardList"),
      refreshLeaderboardButton: document.getElementById("refreshLeaderboard"),
      playerName: document.getElementById("playerName"),
      nextBubblePreview: document.getElementById("nextBubblePreview"),
    };
  }

  init() {
    const storedName = this.storage.get(STORAGE_KEYS.playerName, "Jogador");
    this.elements.playerName.value = sanitizePlayerName(storedName);

    this.bindEvents();
  }

  bindEvents() {
    this.elements.hintsButton.addEventListener("click", () => {
      this.eventBus.emit("ui:toggleHints");
    });

    this.elements.zenButton.addEventListener("click", () => {
      this.eventBus.emit("ui:toggleZen");
    });

    this.elements.pauseButton.addEventListener("click", () => {
      this.eventBus.emit("ui:togglePause");
    });

    this.elements.restartButton.addEventListener("click", () => {
      this.eventBus.emit("ui:restart");
    });

    this.elements.restartQuickButton.addEventListener("click", () => {
      this.eventBus.emit("ui:restart");
    });

    this.elements.submitScoreButton.addEventListener("click", () => {
      this.eventBus.emit("ui:submitScore", {
        playerName: this.getPlayerName(),
      });
    });

    this.elements.refreshLeaderboardButton.addEventListener("click", () => {
      this.eventBus.emit("ui:refreshLeaderboard");
    });

    this.elements.playerName.addEventListener("change", () => {
      const safe = this.getPlayerName();
      this.elements.playerName.value = safe;
      this.storage.set(STORAGE_KEYS.playerName, safe);
    });

    document.addEventListener("keydown", (event) => {
      if (event.code === "KeyR") {
        this.eventBus.emit("ui:restart");
      }

      if (event.code === "KeyP") {
        this.eventBus.emit("ui:togglePause");
      }
    });
  }

  getPlayerName() {
    return sanitizePlayerName(this.elements.playerName.value);
  }

  updateHUD({ score, bestScore, level, combo, nextColor }) {
    this.elements.score.textContent = String(score);
    this.elements.bestScore.textContent = String(bestScore);
    this.elements.level.textContent = String(level);
    this.elements.combo.textContent = String(combo);
    this.elements.nextBubblePreview.style.background = nextColor || "transparent";
  }

  updateStatus(message) {
    this.elements.status.textContent = message;
  }

  updateAssistant(message) {
    this.elements.assistantMessage.textContent = message;
  }

  setHintsState(active) {
    this.elements.hintsButton.textContent = active ? "Dicas: Ativas" : "Dicas: Off";
    this.elements.hintsButton.classList.toggle("is-active", active);
    this.elements.hintsButton.setAttribute("aria-pressed", String(active));
  }

  setZenState(active) {
    this.elements.zenButton.textContent = active ? "Modo Zen: On" : "Modo Zen: Off";
    this.elements.zenButton.classList.toggle("is-active", active);
    this.elements.zenButton.setAttribute("aria-pressed", String(active));
  }

  setPauseState(paused) {
    this.elements.pauseButton.textContent = paused ? "Retomar" : "Pausar";
    this.elements.pauseButton.classList.toggle("is-active", paused);
    this.elements.pauseButton.setAttribute("aria-pressed", String(paused));
  }

  showOverlay({ score, level, combo }) {
    this.elements.summary.textContent = `Sua pontuação foi ${score} no nível ${level}, combo máximo ${combo}.`;
    this.elements.overlay.classList.remove("hidden");
    this.elements.overlay.setAttribute("aria-hidden", "false");
  }

  hideOverlay() {
    this.elements.overlay.classList.add("hidden");
    this.elements.overlay.setAttribute("aria-hidden", "true");
  }

  renderLeaderboard(entries) {
    if (!entries.length) {
      this.elements.leaderboardList.innerHTML = '<li class="placeholder">Nenhuma pontuação registrada ainda.</li>';
      return;
    }

    this.elements.leaderboardList.innerHTML = entries
      .map((entry, index) => {
        return `<li>
          <span class="rank">${index + 1}</span>
          <span class="name" title="${entry.playerName}">${entry.playerName}</span>
          <span class="points">${entry.score}</span>
        </li>`;
      })
      .join("");
  }
}
