const tables = [
  {
    name: 'Super Table A',
    stakes: '25 / 50',
    seats: 9,
    pot: 320,
    players: [
      { name: 'Alex', stack: 12340 },
      { name: 'Maria', stack: 8350 },
      { name: 'Sanjay', stack: 6400 },
      { name: 'Wei', stack: 4100 },
      { name: 'Sara', stack: 10200 },
      { name: 'Josh', stack: 7200 },
      { name: 'Lena', stack: 5100 },
      { name: 'Dax', stack: 3800 },
      { name: 'Riley', stack: 9400 }
    ]
  },
  { name: 'Silver 1', stakes: '10 / 20', seats: 8, pot: 140, players: [] },
  { name: 'Gold 2', stakes: '5 / 10', seats: 8, pot: 0, players: [] }
];

const user = {
  name: 'You',
  stack: 12000,
  seatIndex: null,
  table: tables[0].name,
  cards: []
};

const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
let deck = [];
let board = [];
let pot = 0;
let stage = 'Waiting';
let activeSeat = 0;
let livePlayers = [];
let dealerIndex = 0;
const actionLog = [];
let calmMode = false;

const seatsEl = document.getElementById('seats');
const boardEl = document.getElementById('board');
const potDisplay = document.getElementById('pot-display');
const stageDisplay = document.getElementById('stage-display');
const activePlayerEl = document.getElementById('active-player');
const dealerDisplay = document.getElementById('dealer-display');
const tableListEl = document.getElementById('table-list');
const pocketEl = document.getElementById('my-pocket');
const stackDisplay = document.getElementById('stack-display');
const seatPositionEl = document.getElementById('seat-position');
const seatStateEl = document.getElementById('seat-state');
const cardStatusEl = document.getElementById('card-status');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function buildDeck() {
  deck = [];
  suits.forEach((suit) => {
    values.forEach((value) => deck.push({ suit, value }));
  });
  shuffle(deck);
}

function drawCard() {
  return deck.pop();
}

function cardEl(card) {
  const el = document.createElement('div');
  el.className = `card ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`;
  el.innerHTML = `<div>${card.value}</div><div class="suit">${card.suit}</div>`;
  return el;
}

function inlineCard(card) {
  const el = document.createElement('div');
  el.className = `inline-card ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`;
  el.textContent = `${card.value}${card.suit}`;
  return el;
}

function logAction(text, tone = 'info') {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  actionLog.unshift({ text, tone, timestamp });
  if (actionLog.length > 20) actionLog.pop();
  renderActionLog();
}

function renderActionLog() {
  const logEl = document.getElementById('action-log');
  logEl.innerHTML = '';
  actionLog.forEach((item) => {
    const line = document.createElement('div');
    line.className = `log-line ${item.tone}`;
    line.innerHTML = `<span>${item.timestamp}</span><p>${item.text}</p>`;
    logEl.appendChild(line);
  });
}

function renderTables() {
  tableListEl.innerHTML = '';
  tables.forEach((t) => {
    const row = document.createElement('div');
    row.className = 'table-row';
    const fill = Math.min(100, Math.round(((t.players?.length || 0) / t.seats) * 100));
    row.innerHTML = `
      <div>
        <strong>${t.name}</strong>
        <p class="muted">${t.seats} seats · ${t.stakes}</p>
        <div class="fill"><span style="width:${fill}%"></span></div>
      </div>
      <div class="muted">Pot: $${t.pot || 0}</div>
      <div class="table-actions">
        <button class="ghost" data-table="${t.name}">Watch</button>
        <button class="primary" data-seat="${t.name}">Take seat</button>
      </div>
    `;
    tableListEl.appendChild(row);
  });
}

function seatPositions(count) {
  const radiusX = 43;
  const radiusY = 37;
  const centerX = 50;
  const centerY = 50;
  const positions = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    positions.push({
      top: centerY + radiusY * Math.sin(angle),
      left: centerX + radiusX * Math.cos(angle)
    });
  }
  return positions;
}

function renderSeats() {
  seatsEl.innerHTML = '';
  const positions = seatPositions(livePlayers.length || 1);
  livePlayers.forEach((player, idx) => {
    const pos = positions[idx];
    const seat = document.createElement('div');
    seat.className = 'seat';
    seat.style.top = `${pos.top}%`;
    seat.style.left = `${pos.left}%`;

    const playerEl = document.createElement('div');
    playerEl.className = 'player';
    playerEl.innerHTML = `
      <h4>${player.name}</h4>
      <div class="stack">
        <span>${player.name === user.name ? 'You' : 'Player'}</span>
        <strong>$${player.stack}</strong>
      </div>
    `;

    const chips = document.createElement('div');
    chips.className = 'chips';
    chips.innerHTML = `
      <span class="chip-stack">Bet $${player.currentBet || 0}</span>
      <span class="chip-stack ${player.folded ? 'warn' : 'gold'}">${player.folded ? 'Folded' : 'Live'}</span>
    `;

    const hole = document.createElement('div');
    hole.className = 'hole';
    if (player.cards && player.cards.length) {
      player.cards.forEach((c) => hole.appendChild(cardEl(c)));
    }

    playerEl.appendChild(chips);
    playerEl.appendChild(hole);
    seat.appendChild(playerEl);
    seatsEl.appendChild(seat);

    if (idx === activeSeat) {
      playerEl.style.border = '2px solid rgba(77,208,225,0.7)';
      playerEl.classList.add('active');
    }
  });
  renderStackHealth();
}

function renderBoard() {
  boardEl.innerHTML = '';
  board.forEach((c) => boardEl.appendChild(cardEl(c)));
  if (user.cards.length) {
    pocketEl.innerHTML = '';
    user.cards.forEach((c) => pocketEl.appendChild(inlineCard(c)));
    cardStatusEl.textContent = 'Live';
  } else {
    pocketEl.innerHTML = '<span class="muted">Waiting on deal</span>';
    cardStatusEl.textContent = 'Waiting';
  }
}

function renderStackHealth() {
  const health = document.getElementById('stack-health');
  health.innerHTML = '';
  livePlayers.forEach((p) => {
    const row = document.createElement('div');
    row.className = 'health-row';
    const pct = Math.min(100, Math.round((p.stack / 15000) * 100));
    row.innerHTML = `
      <div>
        <strong>${p.name}</strong>
        <p class="mini">$${p.stack}</p>
      </div>
      <div class="meter mini-meter"><span style="width:${pct}%"></span></div>
    `;
    health.appendChild(row);
  });
}

function setStage(nextStage) {
  stage = nextStage;
  stageDisplay.textContent = stage;
}

function updateActivePlayer() {
  if (!livePlayers.length) {
    activePlayerEl.textContent = 'Waiting...';
    return;
  }
  activeSeat = activeSeat % livePlayers.length;
  const player = livePlayers[activeSeat];
  activePlayerEl.textContent = `${player.name} to act (${player.folded ? 'folded' : 'live'})`;
  dealerDisplay.textContent = livePlayers[(dealerIndex - 1 + livePlayers.length) % livePlayers.length].name;
}

function nextPlayer() {
  for (let i = 1; i <= livePlayers.length; i += 1) {
    const idx = (activeSeat + i) % livePlayers.length;
    if (!livePlayers[idx].folded) {
      activeSeat = idx;
      break;
    }
  }
  updateActivePlayer();
  renderSeats();
}

function syncFromTable() {
  const table = tables.find((t) => t.name === user.table);
  if (!table) return;
  livePlayers = table.players.map((p) => ({ ...p, cards: [], currentBet: 0, folded: false }));
  renderSeats();
  renderBoard();
  document.getElementById('table-title').textContent = table.name;
  document.getElementById('blinds-display').textContent = table.stakes;
  pot = table.pot || 0;
  potDisplay.textContent = `$${pot}`;
}

function seatUser(targetTable) {
  const table = tables.find((t) => t.name === (targetTable || user.table));
  if (!table) return;
  if (table.players.find((p) => p.name === user.name)) {
    logAction('You are already seated here', 'warn');
    return;
  }
  if (table.players.length >= table.seats) {
    logAction(`${table.name} is full`, 'warn');
    return;
  }
  table.players.push({ name: user.name, stack: user.stack });
  user.table = table.name;
  user.seatIndex = table.players.length - 1;
  seatStateEl.textContent = 'Seated';
  seatStateEl.className = 'chip success';
  seatPositionEl.textContent = `Seat ${user.seatIndex + 1}`;
  logAction(`You sat at ${table.name} (${table.stakes})`);
  syncFromTable();
}

function leaveSeat() {
  const table = tables.find((t) => t.name === user.table);
  if (!table) return;
  const idx = table.players.findIndex((p) => p.name === user.name);
  if (idx !== -1) {
    table.players.splice(idx, 1);
  }
  user.seatIndex = null;
  user.cards = [];
  seatStateEl.textContent = 'Observing';
  seatStateEl.className = 'chip warn';
  seatPositionEl.textContent = 'Not seated';
  cardStatusEl.textContent = 'Waiting';
  pocketEl.innerHTML = '<span class="muted">Join a table to see cards</span>';
  logAction('You left your seat', 'warn');
  syncFromTable();
}

function startHand() {
  const table = tables.find((t) => t.name === user.table);
  if (!table || table.players.length < 2) {
    logAction('Need at least 2 players to deal', 'warn');
    return;
  }
  livePlayers = table.players.map((p) => ({ ...p, cards: [], currentBet: 0, folded: false }));
  activeSeat = dealerIndex % livePlayers.length;
  dealerIndex += 1;
  board = [];
  pot = 0;
  buildDeck();
  livePlayers.forEach((p) => {
    p.cards = [drawCard(), drawCard()];
    if (p.name === user.name) {
      user.cards = [...p.cards];
    }
  });
  setStage('Preflop');
  updateActivePlayer();
  renderBoard();
  renderSeats();
  potDisplay.textContent = `$${pot}`;
  toggleBoardButtons();
  logAction(`Hand started on ${table.name}`);
}

function resetHand() {
  board = [];
  pot = 0;
  stage = 'Waiting';
  livePlayers.forEach((p) => {
    p.cards = [];
    p.currentBet = 0;
    p.folded = false;
  });
  user.cards = [];
  renderBoard();
  renderSeats();
  setStage(stage);
  potDisplay.textContent = `$${pot}`;
  toggleBoardButtons();
  activePlayerEl.textContent = 'Waiting...';
  logAction('Hand cleared', 'warn');
}

function dealFlop() {
  board = [drawCard(), drawCard(), drawCard()];
  setStage('Flop');
  renderBoard();
  toggleBoardButtons();
  logAction('Flop dealt');
}

function dealTurn() {
  board.push(drawCard());
  setStage('Turn');
  renderBoard();
  toggleBoardButtons();
  logAction('Turn dealt');
}

function dealRiver() {
  board.push(drawCard());
  setStage('River');
  renderBoard();
  toggleBoardButtons();
  logAction('River dealt');
}

function toggleBoardButtons() {
  document.getElementById('deal-flop').disabled = stage !== 'Preflop';
  document.getElementById('deal-turn').disabled = stage !== 'Flop';
  document.getElementById('deal-river').disabled = stage !== 'Turn';
}

function checkOrCall() {
  if (!livePlayers.length) return;
  const player = livePlayers[activeSeat];
  const maxBet = Math.max(...livePlayers.map((p) => p.currentBet || 0));
  const need = Math.max(0, maxBet - (player.currentBet || 0));
  if (need > 0) {
    const toPay = Math.min(need, player.stack);
    player.stack -= toPay;
    player.currentBet = (player.currentBet || 0) + toPay;
    pot += toPay;
    logAction(`${player.name} calls $${toPay}`);
    if (player.name === user.name) user.stack = player.stack;
  } else {
    logAction(`${player.name} checks`);
  }
  nextPlayer();
  potDisplay.textContent = `$${pot}`;
  renderSeats();
  stackDisplay.textContent = `$${user.stack}`;
}

function betOrRaise() {
  if (!livePlayers.length) return;
  const player = livePlayers[activeSeat];
  const amount = Math.max(0, Number(document.getElementById('bet-size').value) || 0);
  if (amount <= 0) return;
  const pay = Math.min(amount, player.stack);
  player.stack -= pay;
  player.currentBet = (player.currentBet || 0) + pay;
  pot += pay;
  logAction(`${player.name} bets $${pay}`);
  if (player.name === user.name) user.stack = player.stack;
  nextPlayer();
  potDisplay.textContent = `$${pot}`;
  renderSeats();
  stackDisplay.textContent = `$${user.stack}`;
}

function fold() {
  if (!livePlayers.length) return;
  const player = livePlayers[activeSeat];
  player.folded = true;
  logAction(`${player.name} folds`, 'warn');
  nextPlayer();
  renderSeats();
}

function switchTable(name) {
  user.table = name;
  user.cards = [];
  seatStateEl.textContent = tables.find((t) => t.name === name && t.players.find((p) => p.name === user.name))
    ? 'Seated'
    : 'Observing';
  seatStateEl.className = seatStateEl.textContent === 'Seated' ? 'chip success' : 'chip warn';
  cardStatusEl.textContent = 'Waiting';
  pocketEl.innerHTML = '<span class="muted">Waiting on deal</span>';
  syncFromTable();
  logAction(`Now watching ${name}`);
}

function toggleTheme() {
  calmMode = !calmMode;
  document.body.classList.toggle('calm', calmMode);
  document.getElementById('swap-theme').textContent = calmMode ? 'Neon mode' : 'Calm mode';
}

function initHandlers() {
  document.getElementById('start-hand').addEventListener('click', startHand);
  document.getElementById('deal-flop').addEventListener('click', dealFlop);
  document.getElementById('deal-turn').addEventListener('click', dealTurn);
  document.getElementById('deal-river').addEventListener('click', dealRiver);
  document.getElementById('reset-hand').addEventListener('click', resetHand);

  document.getElementById('btn-check').addEventListener('click', checkOrCall);
  document.getElementById('btn-bet').addEventListener('click', betOrRaise);
  document.getElementById('btn-fold').addEventListener('click', fold);

  document.getElementById('take-seat').addEventListener('click', () => seatUser());
  document.getElementById('leave-seat').addEventListener('click', leaveSeat);

  document.getElementById('rebuy').addEventListener('click', () => {
    const topUp = 2500 + Math.round(Math.random() * 2500);
    user.stack += topUp;
    stackDisplay.textContent = `$${user.stack}`;
    logAction(`Rebuy confirmed: +$${topUp}`);
  });

  document.getElementById('swap-theme').addEventListener('click', toggleTheme);

  tableListEl.addEventListener('click', (e) => {
    const watch = e.target.closest('button[data-table]');
    const seat = e.target.closest('button[data-seat]');
    if (watch) {
      switchTable(watch.dataset.table);
    }
    if (seat) {
      switchTable(seat.dataset.table);
      seatUser(seat.dataset.table);
    }
  });

  document.getElementById('refresh').addEventListener('click', () => logAction('Lobby refreshed'));
}

function init() {
  renderTables();
  syncFromTable();
  renderActionLog();
  initHandlers();
  setStage(stage);
  updateActivePlayer();
  pocketEl.innerHTML = '<span class="muted">Waiting on deal</span>';
  stackDisplay.textContent = `$${user.stack}`;
  document.getElementById('player-handle').textContent = user.name;
  seatStateEl.className = 'chip warn';
  seatStateEl.textContent = 'Observing';
  logAction('Player lounge online', 'ok');
}

init();
