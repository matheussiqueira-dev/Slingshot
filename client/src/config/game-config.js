import { degToRad } from "../utils/math.js";

export const STORAGE_KEYS = {
  bestScore: "slingshot_best_score_v2",
  playerName: "slingshot_player_name_v2",
  localLeaderboard: "slingshot_local_leaderboard_v2",
};

export const PALETTE = ["#ff7d7d", "#ffd260", "#62d8ff", "#82efb2", "#c4a7ff", "#ff99cf"];

export const GAME_CONFIG = {
  initialRows: 6,
  maxInitialColors: 4,
  shotsPerRow: 6,
  levelThreshold: 520,
  minAngle: degToRad(15),
  maxAngle: degToRad(165),
  maxRows: 13,
  aimPullDistanceFactor: 0.3,
  baseShotSpeed: 250,
  minShotSpeed: 470,
};

export const EVEN_NEIGHBOR_OFFSETS = [
  [-1, -1],
  [-1, 0],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
];

export const ODD_NEIGHBOR_OFFSETS = [
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, 0],
  [1, 1],
];

export const API_CONFIG = {
  baseUrl: "/api/v1",
  timeoutMs: 6000,
};
