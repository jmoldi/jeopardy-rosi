const STORAGE_KEY = "renten-runde-v1";
const TEAM_COLORS = ["#f5c85b", "#5be0bd", "#ff7e67", "#8ea8ff", "#d798ff", "#74d4f5"];

const defaultState = () => ({
  screen: "welcome",
  setupTab: "basics",
  gameTitle: "Wer weiß denn sowas über den Ruhestand?",
  honoree: "",
  teams: [
    { id: crypto.randomUUID(), name: "Team Sonnendeck", score: 0, color: TEAM_COLORS[0] },
    { id: crypto.randomUUID(), name: "Team Freizeit", score: 0, color: TEAM_COLORS[1] },
  ],
  boards: [makeBoard("Runde 1", 3, 3)],
  activeBoard: 0,
  activeTeam: 0,
  openClue: null,
});

function makeBoard(title, columns, rows) {
  return {
    id: crypto.randomUUID(), title, columns, rows,
    categories: Array.from({ length: columns }, (_, col) => ({
      name: `Kategorie ${col + 1}`,
      clues: Array.from({ length: rows }, (_, row) => ({
        value: (row + 1) * 100,
        question: "",
        answer: "",
        used: false,
      })),
    })),
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.boards?.length && saved?.teams?.length) return { ...defaultState(), ...saved, screen: "welcome", openClue: null };
  } catch (_) { /* Invalid local data falls back to a clean game. */ }
  return defaultState();
}

let state = loadState();
const app = document.querySelector("#app");
const modal = document.querySelector("#modal");
let toastTimer;

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const brand = () => `<div class="brand"><span class="brand-mark"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 15.5 12 4l7 11.5-7 4.5-7-4.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8.5 14h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span><span class="brand-name">Renten-Runde</span></div>`;

function save() {
  const stored = { ...state, screen: "welcome", setupTab: "basics", openClue: null };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

function notify(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function render() {
  if (state.screen === "welcome") renderWelcome();
  else if (state.screen === "setup") renderSetup();
  else if (state.screen === "game") renderGame();
  else renderScoreboard(state.screen === "final");
}

function renderWelcome() {
  const hasContent = state.boards.some(board => board.categories.some(category => category.clues.some(clue => clue.question)));
  app.innerHTML = `<div class="shell">
    <header class="topbar">${brand()}<div class="top-actions">
      <button class="btn btn-ghost" data-action="import">Importieren</button>
      <input class="hidden-input" id="import-file" type="file" accept="application/json" />
      ${hasContent ? '<button class="btn" data-action="export">Exportieren</button>' : ""}
    </div></header>
    <section class="hero">
      <div>
        <p class="eyebrow">Das Quiz zum neuen Kapitel</p>
        <h1>Vorhang auf für die <span class="gold-text">Renten-Runde.</span></h1>
        <p class="lede">Persönliche Fragen, freundschaftlicher Wettbewerb und eine Bühne für die besten Geschichten. Alles bleibt sicher in diesem Browser gespeichert.</p>
        <div class="top-actions" style="justify-content:flex-start;margin-top:30px">
          <button class="btn btn-primary" data-action="start-setup">${hasContent ? "Spiel bearbeiten" : "Spiel einrichten"} →</button>
          ${hasContent ? '<button class="btn btn-ghost" data-action="start-game">Direkt weiterspielen</button>' : ""}
        </div>
        <div class="hero-stats"><span class="stat-pill"><strong>${state.boards.length}</strong> Boards</span><span class="stat-pill"><strong>${state.teams.length}</strong> Teams</span><span class="stat-pill">100 % lokal</span></div>
      </div>
      <div class="hero-card" aria-hidden="true">
        <p class="eyebrow">Heute im Rampenlicht</p>
        <h2>${escapeHtml(state.honoree || "Ein ganz besonderer Mensch")}</h2>
        <div class="mini-board">${Array.from({length: 9}, (_, i) => `<span>${(i % 3 + 1) * 100}</span>`).join("")}</div>
      </div>
    </section>
  </div>`;
}

function renderSetup() {
  app.innerHTML = `<div class="shell">
    <header class="topbar">${brand()}<div class="top-actions"><button class="btn btn-ghost" data-action="home">← Startseite</button><button class="btn" data-action="export">Exportieren</button></div></header>
    <div class="setup-header"><div><p class="eyebrow">Spielvorbereitung</p><h1>Deine Show, deine Fragen.</h1><p class="lede">Erstelle Teams und fülle beliebig viele Spielbretter.</p></div><div class="stepper"><span class="step ${state.setupTab === "basics" ? "active" : ""}"></span><span class="step ${state.setupTab === "boards" ? "active" : ""}"></span></div></div>
    <div class="setup-grid">
      <section class="panel panel-pad">${state.setupTab === "basics" ? basicsEditor() : boardEditor()}</section>
      <aside class="panel panel-pad sticky-panel">${setupSidebar()}</aside>
    </div>
  </div>`;
}

function basicsEditor() {
  return `<p class="eyebrow">01 · Der Rahmen</p><h2>Titel & Teams</h2><p class="panel-subtitle">Gib der Show einen Namen und stelle die Rateteams zusammen.</p>
    <div class="form-grid" style="margin-top:24px">
      <div class="field full"><label for="game-title">Titel der Show</label><input id="game-title" data-field="gameTitle" value="${escapeHtml(state.gameTitle)}" placeholder="Unsere große Renten-Runde" /></div>
      <div class="field full"><label for="honoree">Wen feiern wir?</label><input id="honoree" data-field="honoree" value="${escapeHtml(state.honoree)}" placeholder="Name des Ehrengasts" /></div>
    </div>
    <div class="section-row"><h3>Teams <span style="color:var(--muted);font-weight:500">(${state.teams.length}/6)</span></h3><button class="btn btn-small" data-action="add-team" ${state.teams.length >= 6 ? "disabled" : ""}>+ Team</button></div>
    <div class="team-editor-list">${state.teams.map((team, i) => `<div class="team-editor"><span class="team-color" style="background:${team.color}"></span><input aria-label="Name von Team ${i + 1}" data-team-name="${i}" value="${escapeHtml(team.name)}" /><button class="icon-button" data-action="remove-team" data-index="${i}" aria-label="Team entfernen" ${state.teams.length === 1 ? "disabled" : ""}>×</button></div>`).join("")}</div>
    <div class="section-row" style="justify-content:flex-end"><button class="btn btn-primary" data-action="go-boards">Weiter zu den Boards →</button></div>`;
}

function setupSidebar() {
  return `<p class="eyebrow">Dein Spiel</p><h3>${escapeHtml(state.gameTitle || "Unbenanntes Spiel")}</h3><p class="panel-subtitle">${state.teams.length} ${state.teams.length === 1 ? "Team" : "Teams"} · ${state.boards.length} ${state.boards.length === 1 ? "Board" : "Boards"}</p>
    <div class="divider"></div>
    <div class="board-list">${state.boards.map((board, i) => `<div class="board-list-item ${i === state.activeBoard ? "active" : ""}" data-action="select-board" data-index="${i}"><div><strong>${escapeHtml(board.title)}</strong><small>${board.columns} × ${board.rows} · ${filledCount(board)} Fragen</small></div>${state.boards.length > 1 ? `<button class="icon-button" data-action="remove-board" data-index="${i}" aria-label="Board entfernen">×</button>` : ""}</div>`).join("")}</div>
    <button class="btn btn-ghost" style="width:100%;margin-top:12px" data-action="add-board">+ Neues Board</button>
    <div class="save-note">Änderungen werden lokal gespeichert</div>`;
}

function filledCount(board) { return board.categories.reduce((sum, category) => sum + category.clues.filter(clue => clue.question.trim()).length, 0); }

function boardEditor() {
  const board = state.boards[state.activeBoard];
  return `<div class="board-config-head"><div><p class="eyebrow">02 · Die Spielbretter</p><h2>Fragen & Antworten</h2><p class="panel-subtitle">Jede Kategorie erhält gleich viele Fragen.</p></div><button class="btn btn-primary" data-action="start-game">Spiel starten →</button></div>
    <div class="form-grid" style="margin-top:22px"><div class="field full"><label>Board-Name</label><input data-board-field="title" value="${escapeHtml(board.title)}" /></div></div>
    <div class="dimensions"><div class="field"><label>Kategorien</label><select data-board-field="columns">${[3,4,5,6].map(n => `<option ${n === board.columns ? "selected" : ""}>${n}</option>`).join("")}</select></div><div class="field"><label>Fragen je Kategorie</label><select data-board-field="rows">${[3,4,5].map(n => `<option ${n === board.rows ? "selected" : ""}>${n}</option>`).join("")}</select></div></div>
    <div class="clue-editor">${board.categories.map((category, ci) => `<div class="category-editor"><div class="category-title"><span>${String(ci + 1).padStart(2,"0")}</span><input data-category-name="${ci}" value="${escapeHtml(category.name)}" aria-label="Kategorie ${ci + 1}" /></div>${category.clues.map((clue, ri) => `<div class="clue-row"><input type="number" min="0" step="50" data-clue="value" data-category="${ci}" data-row="${ri}" value="${clue.value}" aria-label="Punktzahl" /><textarea data-clue="question" data-category="${ci}" data-row="${ri}" placeholder="Frage …" aria-label="Frage"></textarea><textarea data-clue="answer" data-category="${ci}" data-row="${ri}" placeholder="Antwort …" aria-label="Antwort"></textarea></div>`).join("")}</div>`).join("")}</div>
    <div class="section-row"><button class="btn btn-ghost" data-action="go-basics">← Zurück</button><button class="btn btn-primary" data-action="start-game">Spiel starten →</button></div>`;
}

function hydrateTextareas() {
  if (state.screen !== "setup" || state.setupTab !== "boards") return;
  const board = state.boards[state.activeBoard];
  document.querySelectorAll("[data-clue]").forEach(el => {
    const clue = board.categories[+el.dataset.category].clues[+el.dataset.row];
    el.value = clue[el.dataset.clue];
  });
}

function renderGame() {
  const board = state.boards[state.activeBoard];
  app.innerHTML = `<div class="shell game-shell">
    <header class="game-header">${brand()}<div class="round-label"><p>Board ${state.activeBoard + 1} von ${state.boards.length}</p><h2>${escapeHtml(board.title)}</h2></div><div class="top-actions"><button class="btn btn-ghost btn-small" data-action="setup">Bearbeiten</button><button class="btn btn-small" data-action="show-score">Punktestand</button></div></header>
    <div class="score-strip" style="--team-count:${state.teams.length}">${state.teams.map((team, i) => `<button class="score-card ${i === state.activeTeam ? "active" : ""}" style="--team-color:${team.color}" data-action="set-active-team" data-index="${i}"><small>${i === state.activeTeam ? "Ist am Zug" : "Team wählen"}</small><strong>${escapeHtml(team.name)}</strong><span>${team.score} Punkte</span></button>`).join("")}</div>
    <section class="jeopardy-board" style="--columns:${board.columns}">
      ${board.categories.map(category => `<div class="category-cell">${escapeHtml(category.name)}</div>`).join("")}
      ${Array.from({length: board.rows}, (_, ri) => board.categories.map((category, ci) => { const clue = category.clues[ri]; return `<button class="clue-cell ${clue.used ? "used" : ""}" data-action="open-clue" data-category="${ci}" data-row="${ri}" ${clue.used ? "disabled" : ""}>${clue.used ? "" : clue.value}</button>`; }).join("")).join("")}
    </section>
  </div>`;
}

function openClue(categoryIndex, rowIndex) {
  state.openClue = { categoryIndex, rowIndex, revealed: false };
  updateModal();
  modal.hidden = false;
}

function updateModal() {
  const { categoryIndex, rowIndex, revealed } = state.openClue;
  const category = state.boards[state.activeBoard].categories[categoryIndex];
  const clue = category.clues[rowIndex];
  document.querySelector("#modal-category").textContent = category.name;
  document.querySelector("#modal-value").textContent = `${clue.value} Punkte`;
  document.querySelector("#modal-question").textContent = clue.question || "Für diese Karte wurde noch keine Frage eingetragen.";
  document.querySelector("#modal-answer").textContent = clue.answer || "Keine Antwort hinterlegt";
  document.querySelector("#answer-wrap").hidden = !revealed;
  document.querySelector("#modal-actions").innerHTML = revealed
    ? `<div class="modal-team-picker"><span>Punkte für:</span><div>${state.teams.map((team, index) => `<button class="team-choice ${index === state.activeTeam ? "active" : ""}" style="--team-color:${team.color}" data-action="modal-team" data-index="${index}">${escapeHtml(team.name)}</button>`).join("")}</div></div><button class="btn btn-danger" data-action="score-wrong">Niemand wusste es</button><button class="btn btn-primary" data-action="score-correct">Richtig · +${clue.value}</button>`
    : `<button class="btn btn-primary" data-action="reveal-answer">Antwort aufdecken</button>`;
}

function resolveClue(correct) {
  const board = state.boards[state.activeBoard];
  const clue = board.categories[state.openClue.categoryIndex].clues[state.openClue.rowIndex];
  clue.used = true;
  if (correct) state.teams[state.activeTeam].score += Number(clue.value) || 0;
  modal.hidden = true;
  state.openClue = null;
  save();
  if (board.categories.every(category => category.clues.every(item => item.used))) {
    state.screen = "scoreboard";
  }
  render();
}

function renderScoreboard(final = false) {
  const ranked = [...state.teams].sort((a,b) => b.score - a.score);
  const allDone = state.activeBoard >= state.boards.length - 1;
  app.innerHTML = `<div class="shell"><header class="topbar">${brand()}<div class="top-actions"><button class="btn btn-ghost" data-action="game">Zurück zum Board</button></div></header>
    <section class="scoreboard"><div class="scoreboard-inner">
      ${final ? '<span class="winner-badge">🏆 Gewinnerteam</span><p class="eyebrow">Was für ein Finale</p><h1><span class="gold-text">${escapeHtml(ranked[0].name)}</span> gewinnt!</h1>' : '<p class="eyebrow">Zwischenstand</p><h1>So steht’s.</h1>'}
      <p class="lede" style="margin-inline:auto">${final ? "Herzlichen Glückwunsch – und vor allem: einen großartigen Start in den Ruhestand!" : `Nach ${escapeHtml(state.boards[state.activeBoard].title)} ist noch alles möglich.`}</p>
      <div class="rankings">${ranked.map((team, i) => `<div class="ranking ${i === 0 ? "winner" : ""}"><span class="rank">${String(i+1).padStart(2,"0")}</span><strong>${escapeHtml(team.name)}</strong><span class="ranking-score">${team.score} P</span></div>`).join("")}</div>
      <div class="top-actions" style="justify-content:center">${!final && !allDone ? '<button class="btn btn-primary" data-action="next-board">Nächstes Board →</button>' : !final ? '<button class="btn btn-primary" data-action="finish-game">Finales Ergebnis →</button>' : '<button class="btn btn-primary" data-action="reset-game">Neue Runde starten</button>'}<button class="btn btn-ghost" data-action="setup">Spiel bearbeiten</button></div>
    </div></section>
  </div>`;
}

function resizeBoard(board, columns, rows) {
  board.columns = columns;
  board.rows = rows;
  while (board.categories.length < columns) board.categories.push({ name: `Kategorie ${board.categories.length + 1}`, clues: [] });
  board.categories.length = columns;
  board.categories.forEach(category => {
    while (category.clues.length < rows) category.clues.push({ value: (category.clues.length + 1) * 100, question: "", answer: "", used: false });
    category.clues.length = rows;
  });
}

document.addEventListener("input", event => {
  const target = event.target;
  if (target.dataset.field) state[target.dataset.field] = target.value;
  if (target.dataset.teamName !== undefined) state.teams[+target.dataset.teamName].name = target.value;
  if (target.dataset.boardField === "title") state.boards[state.activeBoard].title = target.value;
  if (target.dataset.categoryName !== undefined) state.boards[state.activeBoard].categories[+target.dataset.categoryName].name = target.value;
  if (target.dataset.clue) state.boards[state.activeBoard].categories[+target.dataset.category].clues[+target.dataset.row][target.dataset.clue] = target.dataset.clue === "value" ? Number(target.value) : target.value;
  save();
});

document.addEventListener("change", event => {
  if (event.target.dataset.boardField === "columns" || event.target.dataset.boardField === "rows") {
    const board = state.boards[state.activeBoard];
    const columns = event.target.dataset.boardField === "columns" ? +event.target.value : board.columns;
    const rows = event.target.dataset.boardField === "rows" ? +event.target.value : board.rows;
    resizeBoard(board, columns, rows); save(); render(); hydrateTextareas();
  }
  if (event.target.id === "import-file" && event.target.files[0]) importGame(event.target.files[0]);
});

document.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "start-setup" || action === "setup") { state.screen = "setup"; state.setupTab = "basics"; render(); }
  if (action === "home") { state.screen = "welcome"; render(); }
  if (action === "go-boards") { state.setupTab = "boards"; render(); hydrateTextareas(); }
  if (action === "go-basics") { state.setupTab = "basics"; render(); }
  if (action === "add-team" && state.teams.length < 6) { const i = state.teams.length; state.teams.push({ id: crypto.randomUUID(), name: `Team ${i + 1}`, score: 0, color: TEAM_COLORS[i] }); save(); render(); }
  if (action === "remove-team" && state.teams.length > 1) { state.teams.splice(+button.dataset.index, 1); state.activeTeam = 0; save(); render(); }
  if (action === "add-board") { state.boards.push(makeBoard(`Runde ${state.boards.length + 1}`, 3, 3)); state.activeBoard = state.boards.length - 1; state.setupTab = "boards"; save(); render(); hydrateTextareas(); }
  if (action === "remove-board" && state.boards.length > 1) { event.stopPropagation(); state.boards.splice(+button.dataset.index, 1); state.activeBoard = Math.min(state.activeBoard, state.boards.length - 1); save(); render(); hydrateTextareas(); }
  if (action === "select-board") { state.activeBoard = +button.dataset.index; state.setupTab = "boards"; render(); hydrateTextareas(); }
  if (action === "start-game") { const fromSetup = state.screen === "setup"; state.screen = "game"; state.activeBoard = fromSetup ? 0 : Math.min(state.activeBoard, state.boards.length - 1); save(); render(); }
  if (action === "set-active-team") { state.activeTeam = +button.dataset.index; save(); render(); }
  if (action === "open-clue") openClue(+button.dataset.category, +button.dataset.row);
  if (action === "close-question") { modal.hidden = true; state.openClue = null; }
  if (action === "reveal-answer") { state.openClue.revealed = true; updateModal(); }
  if (action === "modal-team") { state.activeTeam = +button.dataset.index; save(); updateModal(); }
  if (action === "score-correct") resolveClue(true);
  if (action === "score-wrong") resolveClue(false);
  if (action === "show-score") { state.screen = "scoreboard"; render(); }
  if (action === "game") { state.screen = "game"; render(); }
  if (action === "next-board") { state.activeBoard += 1; state.screen = "game"; save(); render(); }
  if (action === "finish-game") { state.screen = "final"; render(); }
  if (action === "reset-game") { state.teams.forEach(team => team.score = 0); state.boards.forEach(board => board.categories.forEach(category => category.clues.forEach(clue => clue.used = false))); state.activeBoard = 0; state.activeTeam = 0; state.screen = "welcome"; save(); render(); notify("Punkte und Spielfelder wurden zurückgesetzt."); }
  if (action === "export") exportGame();
  if (action === "import") document.querySelector("#import-file")?.click();
});

function exportGame() {
  const blob = new Blob([JSON.stringify({ ...state, screen: "welcome", openClue: null }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "renten-runde.json"; link.click(); URL.revokeObjectURL(url);
  notify("Spiel wurde exportiert.");
}

function importGame(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported.boards) || !Array.isArray(imported.teams) || !imported.boards.length || !imported.teams.length) throw new Error();
      state = { ...defaultState(), ...imported, screen: "setup", setupTab: "basics", openClue: null };
      state.teams = state.teams.slice(0, 6);
      save(); render(); notify("Spiel erfolgreich importiert.");
    } catch (_) { notify("Diese Datei ist kein gültiges Renten-Runde-Spiel."); }
  };
  reader.readAsText(file);
}

render();
