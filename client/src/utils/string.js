export function sanitizePlayerName(name) {
  const safe = (name || "").trim().replace(/[^\p{L}\p{N}_\- ]/gu, "");
  const compact = safe.replace(/\s+/g, " ").slice(0, 20);
  return compact || "Jogador";
}
