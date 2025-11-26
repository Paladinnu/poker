const tables = [
  {
    name: 'Super Table A',
    stakes: '25 / 50',
    seats: 9,
    status: 'Running',
    pot: 200,
    occupancy: 9,
    players: [
      { name: 'alex', stack: 12340, role: 'admin' },
      { name: 'maria', stack: 8350 },
      { name: 'sanjay', stack: 6400 },
      { name: 'wei', stack: 4100 },
      { name: 'sara', stack: 10200 },
      { name: 'josh', stack: 7200 },
      { name: 'lena', stack: 5100 },
      { name: 'dax', stack: 3800 },
      { name: 'riley', stack: 9400 }
    ]
  },
  { name: 'Silver 1', stakes: '10 / 20', seats: 8, status: 'Paused', pot: 140, occupancy: 6, players: [] },
  { name: 'Gold 2', stakes: '5 / 10', seats: 8, status: 'Seating', pot: 0, occupancy: 4, players: [] }
];

const admins = [
  { name: 'Charlotte P.', focus: 'ID checks & buy-ins', status: 'online' },
  { name: 'Ivan G.', focus: 'Table safety & chat', status: 'online' },
  { name: 'Lara T.', focus: 'Payout review', status: 'online' },
  { name: 'Thomas R.', focus: 'Tech monitor', status: 'on break' }
];

const coverage = [
  { name: 'Cameras', detail: 'Angles live', status: 'online' },
  { name: 'Payments', detail: 'Escrow synced', status: 'online' },
  { name: 'Seat audits', detail: 'Randomized draws', status: 'online' },
  { name: 'Cooldowns', detail: '2 min enforced', status: 'online' }
];

const queue = [
  { name: 'Diego', stakes: '25/50', note: 'Needs KYC' },
  { name: 'Akari', stakes: '25/50', note: 'Approved by Alex' },
  { name: 'Nina', stakes: '10/20', note: 'New player' },
  { name: 'Mateo', stakes: '5/10', note: 'Referral' }
];

const monitors = [
  { name: 'KYC cadence', value: 98, tag: 'Identity', status: 'good' },
  { name: 'Collusion scan', value: 93, tag: 'AI monitor', status: 'good' },
  { name: 'Seat variance', value: 76, tag: 'Fair rotation', status: 'warn' },
  { name: 'Chat filters', value: 88, tag: 'Live mod', status: 'good' },
  { name: 'Latency floor', value: 42, tag: 'Edge RTT (ms)', status: 'good' },
  { name: 'Chip drift', value: 6, tag: 'Error bps', status: 'warn' }
];

const timeline = [
  { title: 'Super Table A', body: 'Dealer swap executed · sanity pass', tone: 'ok' },
  { title: 'Queue sync', body: 'Akari promoted to seat review', tone: 'ok' },
  { title: 'Integrity', body: 'Seat variance trending upward', tone: 'warn' }
];

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

const seatsEl = document.getElementById('seats');
const boardEl = document.getElementById('board');
const potDisplay = document.getElementById('pot-display');
const stageDisplay = document.getElementById('stage-display');
const activePlayerEl = document.getElementById('active-player');
const dealerDisplay = document.getElementById('dealer-display');

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
  if (actionLog.length > 12) actionLog.pop();
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
  const list = document.getElementById('table-list');
  list.innerHTML = '';
  tables.forEach((t) => {
    const row = document.createElement('div');
    row.className = 'table-row';
    const fill = Math.min(100, Math.round((t.occupancy / t.seats) * 100));
    row.innerHTML = `
      <div>
        <strong>${t.name}</strong>
        <p class="muted">${t.seats} seats · ${t.stakes}</p>
        <div class="fill"><span style="width:${fill}%"></span></div>
      </div>
      <div class="chip ${t.status === 'Running' ? 'success' : t.status === 'Paused' ? 'warn' : ''}">${t.status}</div>
      <div class="muted">Pot: $${t.pot}</div>
      <button class="ghost" data-name="${t.name}">Move player</button>
    `;
    list.appendChild(row);
  });
}

function renderAdmins() {
  const roster = document.getElementById('admin-roster');
  roster.innerHTML = '';
  admins.forEach((admin) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${admin.name}</strong>
        <p class="muted">${admin.focus}</p>
      </div>
      <span class="chip ${admin.status === 'online' ? 'success' : 'warn'}">${admin.status}</span>
    `;
    roster.appendChild(li);
  });
}

function renderCoverage() {
  const grid = document.getElementById('admin-coverage');
  grid.innerHTML = '';
  coverage.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'micro-card';
    card.innerHTML = `
      <p class="mini">${item.name}</p>
      <strong>${item.detail}</strong>
      <span class="pill">${item.status}</span>
    `;
    grid.appendChild(card);
  });
}

function renderQueue() {
  const list = document.getElementById('queue-list');
  list.innerHTML = '';
  queue.forEach((p) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${p.name}</strong>
        <p class="muted">${p.stakes} · ${p.note}</p>
      </div>
      <button class="primary" data-player="${p.name}">Approve</button>
    `;
    list.appendChild(li);
  });
  renderQueueBreakdown();
}

function renderQueueBreakdown() {
  const breakdown = document.getElementById('queue-breakdown');
  const grouped = queue.reduce((acc, q) => {
    acc[q.stakes] = (acc[q.stakes] || 0) + 1;
    return acc;
  }, {});
  breakdown.innerHTML = '';
  Object.entries(grouped).forEach(([stakes, count]) => {
    const card = document.createElement('div');
    card.className = 'micro-card';
    card.innerHTML = `<p class="mini">${stakes}</p><strong>${count} in queue</strong>`;
    breakdown.appendChild(card);
  });
}

function renderIntegrity() {
  const list = document.getElementById('integrity-list');
  list.innerHTML = '';
  monitors.forEach((m) => {
    const card = document.createElement('div');
    card.className = `monitor ${m.status}`;
    card.innerHTML = `
      <div class="monitor-head">
        <div>
          <p class="mini">${m.tag}</p>
          <strong>${m.name}</strong>
        </div>
        <span class="pill">${m.value}${m.tag.includes('ms') ? '' : '%'}</span>
      </div>
      <div class="meter"><span style="width:${Math.min(100, m.value)}%"></span></div>
    `;
    list.appendChild(card);
  });
}

function renderTimeline() {
  const container = document.getElementById('ops-timeline');
  container.innerHTML = '';
  timeline.forEach((item) => {
    const row = document.createElement('div');
    row.className = `timeline-row ${item.tone}`;
    row.innerHTML = `
      <div>
        <p class="mini">${item.title}</p>
        <strong>${item.body}</strong>
      </div>
      <span class="pill">${item.tone === 'warn' ? 'watch' : 'ok'}</span>
    `;
    container.appendChild(row);
  });
}

function seatPositions(count) {
  const radiusX = 42;
  const radiusY = 34;
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
        <span>${player.role === 'admin' ? 'Admin' : 'Player'}</span>
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
        <p class="mini">${p.role === 'admin' ? 'Admin' : 'Player'} · $${p.stack}</p>
      </div>
      <div class="meter mini-meter"><span style="width:${pct}%"></span></div>
    `;
    health.appendChild(row);
  });
}

function renderDensity() {
  const density = document.getElementById('table-density');
  density.innerHTML = '';
  tables.forEach((t) => {
    const pct = Math.min(100, Math.round((t.occupancy / t.seats) * 100));
    const bar = document.createElement('div');
    bar.className = 'density-row';
    bar.innerHTML = `
      <div>
        <strong>${t.name}</strong>
        <p class="mini">${t.stakes}</p>
      </div>
      <div class="meter mini-meter"><span style="width:${pct}%"></span></div>
    `;
    density.appendChild(bar);
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

function startHand() {
  const table = tables[0];
  livePlayers = table.players.map((p) => ({ ...p, cards: [], currentBet: 0, folded: false }));
  activeSeat = dealerIndex % livePlayers.length;
  dealerIndex += 1;
  board = [];
  pot = 0;
  buildDeck();
  livePlayers.forEach((p) => {
    p.cards = [drawCard(), drawCard()];
  });
  setStage('Preflop');
  updateActivePlayer();
  renderBoard();
  renderSeats();
  potDisplay.textContent = `$${pot}`;
  toggleBoardButtons();
  logAction('New hand deployed on Super Table A');
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
  renderBoard();
  renderSeats();
  setStage(stage);
  potDisplay.textContent = `$${pot}`;
  toggleBoardButtons();
  activePlayerEl.textContent = 'Waiting...';
  logAction('Hand reset by admin', 'warn');
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
  const player = livePlayers[activeSeat];
  const maxBet = Math.max(...livePlayers.map((p) => p.currentBet || 0));
  const need = Math.max(0, maxBet - (player.currentBet || 0));
  if (need > 0) {
    const toPay = Math.min(need, player.stack);
    player.stack -= toPay;
    player.currentBet = (player.currentBet || 0) + toPay;
    pot += toPay;
    logAction(`${player.name} calls $${toPay}`);
  } else {
    logAction(`${player.name} checks`);
  }
  nextPlayer();
  potDisplay.textContent = `$${pot}`;
  renderSeats();
}

function betOrRaise() {
  const player = livePlayers[activeSeat];
  const amount = Math.max(0, Number(document.getElementById('bet-size').value) || 0);
  if (amount <= 0) return;
  const pay = Math.min(amount, player.stack);
  player.stack -= pay;
  player.currentBet = (player.currentBet || 0) + pay;
  pot += pay;
  logAction(`${player.name} bets $${pay}`);
  nextPlayer();
  potDisplay.textContent = `$${pot}`;
  renderSeats();
}

function fold() {
  const player = livePlayers[activeSeat];
  player.folded = true;
  logAction(`${player.name} folds`, 'warn');
  nextPlayer();
  renderSeats();
}

function renderVitals() {
  document.getElementById('stat-tables').textContent = `${tables.length} active`;
  document.getElementById('stat-players').textContent = `${tables.reduce((s, t) => s + (t.occupancy || 0), 0)} seated`;
  document.getElementById('stat-admins').textContent = `${admins.length} on duty`;
  document.getElementById('stat-pot').textContent = `$${Math.max(0, Math.round(pot || 240))}`;
  const latency = monitors.find((m) => m.name === 'Latency floor');
  document.getElementById('stat-latency').textContent = `${latency ? latency.value : 42} ms`;
  const integrityScore = Math.round(
    monitors.reduce((sum, m) => sum + m.value, 0) / monitors.length
  );
  document.getElementById('stat-integrity').textContent = `${integrityScore}%`;
  document.getElementById('uptime-bar').style.width = `${96 + Math.random() * 3}%`;
}

function initHandlers() {
  document.getElementById('table-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('table-name').value.trim();
    const stakes = document.getElementById('table-stakes').value.trim();
    const seats = Number(document.getElementById('table-seats').value) || 8;
    tables.push({ name, stakes, seats, status: 'Seating', pot: 0, occupancy: 0, players: [] });
    renderTables();
    renderDensity();
    renderVitals();
    logAction(`Table ${name} created at ${stakes}`);
    e.target.reset();
  });

  document.getElementById('approve-all').addEventListener('click', () => {
    queue.length = 0;
    renderQueue();
    logAction('All pending players approved');
  });

  document.getElementById('start-hand').addEventListener('click', startHand);
  document.getElementById('deal-flop').addEventListener('click', dealFlop);
  document.getElementById('deal-turn').addEventListener('click', dealTurn);
  document.getElementById('deal-river').addEventListener('click', dealRiver);
  document.getElementById('reset-hand').addEventListener('click', resetHand);

  document.getElementById('btn-check').addEventListener('click', checkOrCall);
  document.getElementById('btn-bet').addEventListener('click', betOrRaise);
  document.getElementById('btn-fold').addEventListener('click', fold);

  document.getElementById('lock-in').addEventListener('click', () => logAction('Entries locked for all tables', 'warn'));
  document.getElementById('start-tournament').addEventListener('click', () => logAction('Tournament clock started'));
  document.getElementById('refresh').addEventListener('click', () => logAction('Statuses refreshed'));
}

function initTableState() {
  const table = tables[0];
  document.getElementById('live-table-title').textContent = table.name;
  document.getElementById('live-blinds').textContent = table.stakes;
  livePlayers = table.players.map((p) => ({ ...p, cards: [], currentBet: 0, folded: false }));
  renderSeats();
  renderBoard();
}

function initDashboard() {
  renderTables();
  renderAdmins();
  renderCoverage();
  renderQueue();
  renderIntegrity();
  renderTimeline();
  renderDensity();
  renderVitals();
}

function simulatePulse() {
  setInterval(() => {
    const monitor = monitors[Math.floor(Math.random() * monitors.length)];
    const delta = (Math.random() > 0.5 ? 1 : -1) * Math.random() * 3;
    monitor.value = Math.max(5, Math.min(100, Math.round(monitor.value + delta)));
    renderIntegrity();
    renderVitals();
  }, 2800);

  setInterval(() => {
    const note = {
      title: 'Live hand',
      body: `${livePlayers[Math.floor(Math.random() * livePlayers.length)]?.name || 'player'} made a move`,
      tone: Math.random() > 0.7 ? 'warn' : 'ok'
    };
    timeline.unshift(note);
    if (timeline.length > 8) timeline.pop();
    renderTimeline();
  }, 4500);
}

function init() {
  initDashboard();
  initTableState();
  initHandlers();
  potDisplay.textContent = `$${pot}`;
  setStage(stage);
  updateActivePlayer();
  simulatePulse();
  logAction('Control room online', 'ok');
}

init();
