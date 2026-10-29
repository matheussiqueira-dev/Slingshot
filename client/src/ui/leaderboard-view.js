const EMPTY_MESSAGE = "Nenhuma pontuação registrada ainda.";

function createSpan(doc, className, text) {
  const span = doc.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

export function createLeaderboardItem(doc, entry, index) {
  const item = doc.createElement("li");
  const name = createSpan(doc, "name", String(entry.playerName));
  name.title = String(entry.playerName);

  item.append(createSpan(doc, "rank", String(index + 1)), name, createSpan(doc, "points", String(entry.score)));
  return item;
}

export function renderLeaderboardList(doc, listElement, entries) {
  if (!entries.length) {
    const placeholder = doc.createElement("li");
    placeholder.className = "placeholder";
    placeholder.textContent = EMPTY_MESSAGE;
    listElement.replaceChildren(placeholder);
    return;
  }

  listElement.replaceChildren(...entries.map((entry, index) => createLeaderboardItem(doc, entry, index)));
}
