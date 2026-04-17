// ============================================================
// BUSINESS INDIA — CLIENT  v3.0
// ============================================================
'use strict';

// ── Socket setup (auto-reconnect) ──────────────────────────
const socket = io({
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling']
});

// ── State ──────────────────────────────────────────────────
let mySession  = null;   // sessionId from server
let myRoomId   = null;
let myIdx      = null;   // my player index in G.players
let isHost     = false;
let isReady    = false;
let G          = null;   // full game state from server
let timerIv    = null;

const FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

const SQUARES = [
  {id:0,  name:'START'},     {id:1,  name:'Goa'},         {id:2,  name:'Motor Boat'},
  {id:3,  name:'Cochin'},    {id:4,  name:'Mysore'},       {id:5,  name:'Wealth Tax'},
  {id:6,  name:'Bengaluru'}, {id:7,  name:'Community Chest'},{id:8, name:'Chennai'},
  {id:9,  name:'REST HOUSE'},{id:10, name:'Hyderabad'},    {id:11, name:'Kolkata'},
  {id:12, name:'Air India'}, {id:13, name:'Darjeeling'},   {id:14, name:'Patna'},
  {id:15, name:'Kanpur'},    {id:16, name:'Chance'},       {id:17, name:'Agra'},
  {id:18, name:'Srinagar'},  {id:19, name:'CLUB'},         {id:20, name:'Amritsar'},
  {id:21, name:'Shimla'},    {id:22, name:'BEST'},         {id:23, name:'Electric Co.'},
  {id:24, name:'Chandigarh'},{id:25, name:'Community Chest'},{id:26,name:'Lucknow'},
  {id:27, name:'Delhi'},     {id:28, name:'JAIL'},         {id:29, name:'Jaipur'},
  {id:30, name:'Chance'},    {id:31, name:'Indore'},       {id:32, name:'Income Tax'},
  {id:33, name:'Ahmedabad'}, {id:34, name:'Railways'},     {id:35, name:'Water Works'},
  {id:36, name:'Mumbai'}
];

// ── Screen helpers ─────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Enter screen ───────────────────────────────────────────
function createRoom() {
  const name = document.getElementById('inp-name').value.trim();
  if (!name) return setErr('enter-err', 'Enter your name first.');
  socket.emit('create-room', { name });
}
function joinRoom() {
  const name = document.getElementById('inp-name').value.trim();
  const code = document.getElementById('inp-room').value.trim().toUpperCase();
  if (!name) return setErr('enter-err', 'Enter your name first.');
  if (!code) return setErr('enter-err', 'Enter a Room Code.');
  socket.emit('join-room', { roomId: code, name });
}
function setErr(id, msg) { document.getElementById(id).textContent = msg; }

// ── Lobby ──────────────────────────────────────────────────
function copyRoomCode() {
  navigator.clipboard.writeText(myRoomId).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = '✅'; setTimeout(() => { btn.textContent = '📋'; }, 1500);
  });
}
function toggleReady() {
  isReady = !isReady;
  socket.emit('player-ready', { ready: isReady });
  const btn = document.getElementById('btn-ready');
  btn.textContent = isReady ? '❌ Unready' : '✅ Ready';
}
function startGame() { socket.emit('start-game'); }
function leaveLobby() {
  socket.emit('player-exit');
  myRoomId = null; mySession = null; isHost = false; isReady = false;
  localStorage.removeItem('bi_room'); localStorage.removeItem('bi_session');
  showScreen('screen-enter');
}
function renderLobby(players) {
  const ul = document.getElementById('lobby-players');
  ul.innerHTML = '';
  players.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'player-row';
    let badge = '';
    if (p.isHost) badge += `<span class="player-row-badge badge-host">HOST</span>`;
    if (p.ready)  badge += `<span class="player-row-badge badge-ready">READY</span>`;
    else          badge += `<span class="player-row-badge badge-waiting">WAITING</span>`;
    row.innerHTML = `<div class="player-dot" style="background:${p.color}"></div>
      <span class="player-row-name">${p.name}</span>${badge}`;
    ul.appendChild(row);
  });
  const startBtn = document.getElementById('btn-start');
  if (isHost) {
    const allReady = players.filter(p => !p.isHost).every(p => p.ready);
    startBtn.classList.toggle('hidden', players.length < 2 || !allReady);
  }
}

// ── Game render helpers ────────────────────────────────────
function renderTokens(state) {
  document.querySelectorAll('.tok-area').forEach(el => el.innerHTML = '');
  state.players.forEach((p, i) => {
    if (p.bust) return;
    const area = document.getElementById('sq' + p.pos);
    if (!area) return;
    const t = document.createElement('div');
    t.className = 'token';
    t.style.background = p.color;
    t.textContent = i + 1;
    area.appendChild(t);
  });
}

function renderOwnership(state) {
  // Clear all owner bars
  document.querySelectorAll('.owner-bar').forEach(el => el.style.background = 'transparent');
  // Apply ownership colors
  Object.entries(state.ownership).forEach(([sqId, ownerId]) => {
    if (ownerId === undefined || ownerId === null) return;
    const owner = state.players[ownerId];
    if (!owner) return;
    const el = document.querySelector(`[data-sq="${sqId}"] .owner-bar`);
    if (el) el.style.background = owner.color;
  });
}

function renderPlayers(state) {
  const panel = document.getElementById('player-panel');
  panel.innerHTML = '';
  state.players.forEach((p, i) => {
    const sq = SQUARES[p.pos] || { name: '?' };
    const isCur = i === state.cur;
    const isMe  = i === myIdx;
    const card  = document.createElement('div');
    card.className = 'pcard' + (isCur ? ' active' : '') + (p.bust ? ' bust' : '');
    // Property dots
    const dots = p.props.map(sid => {
      const sq2 = SQUARES[sid];
      const color = state.players[state.ownership[sid]]?.color || '#888';
      return `<div class="prop-dot" style="background:${color}" title="${sq2?.name || ''}"></div>`;
    }).join('');
    card.innerHTML = `
      <div class="pcr">
        <div class="pcdot" style="background:${p.color}"></div>
        <span class="pcname">${p.name}${isMe ? ' (You)' : ''}</span>
      </div>
      <div class="pcmoney">₹${p.money.toLocaleString()}</div>
      <div class="pcpos">📍 ${sq.name}</div>
      <div class="pcstatus ${p.bust ? 'bust-txt' : 'ok'}">${p.bust ? '💀 Bankrupt' : isCur ? '🎯 Active Turn' : '⏳ Waiting'}</div>
      ${dots ? `<div class="pcprops">${dots}</div>` : ''}`;
    panel.appendChild(card);
  });
}

function renderMyProps(state) {
  const el = document.getElementById('my-props');
  el.innerHTML = '';
  if (myIdx === null) return;
  const me = state.players[myIdx];
  if (!me || me.bust) { el.innerHTML = '<div style="font-size:.55rem;color:#666">None yet</div>'; return; }
  if (!me.props.length) { el.innerHTML = '<div style="font-size:.55rem;color:#666">None yet</div>'; return; }
  me.props.forEach(sid => {
    const sq = SQUARES[sid];
    const b  = state.buildings?.[sid];
    const bldg = b ? (b.hotel ? '🏨' : '🏠'.repeat(b.houses)) : '';
    const d  = document.createElement('div');
    d.className = 'myprop-item';
    d.innerHTML = `<div class="myprop-name"><div class="myprop-dot" style="background:${me.color}"></div>
      <span>${sq?.name}</span></div>
      ${bldg ? `<span style="font-size:.48rem">${bldg}</span>` : ''}`;
    el.appendChild(d);
  });
}

function renderCardLog(state) {
  const el = document.getElementById('card-log');
  el.innerHTML = '';
  if (!state.cardLog?.length) { el.innerHTML = '<div style="font-size:.55rem;color:#666">No cards yet</div>'; return; }
  state.cardLog.slice(0, 5).forEach(entry => {
    const d = document.createElement('div');
    d.className = 'log-entry';
    d.innerHTML = `<span class="log-name">${entry.player}:</span> ${entry.result || entry.card}`;
    el.appendChild(d);
  });
}

function renderAll(state) {
  renderTokens(state);
  renderOwnership(state);
  renderPlayers(state);
  renderMyProps(state);
  renderCardLog(state);
  updateControls(state);
  updateTurnUI(state);
}

function updateControls(state) {
  const isMyTurn = myIdx === state.cur;
  const rb = document.getElementById('roll-btn');
  const eb = document.getElementById('end-btn');
  rb.disabled = !isMyTurn || state.rolled;
  eb.disabled = !isMyTurn || !state.rolled;
}

function updateTurnUI(state) {
  const cur = state.players[state.cur];
  const ti  = document.getElementById('turn-indicator');
  const isMe = state.cur === myIdx;
  ti.style.color = cur?.color || '#fff';
  ti.textContent = isMe ? '🎯 Your Turn!' : `${cur?.name || '?'}'s Turn`;

  // Timer bar
  if (state.turnDeadline) startTimerBar(state.turnDeadline);
}

function startTimerBar(deadline) {
  clearInterval(timerIv);
  const TOTAL = 90;
  function tick() {
    const rem = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
    document.getElementById('timer-bar-label').textContent = rem + 's';
    const pct = (rem / TOTAL) * 100;
    const fill = document.getElementById('timer-bar');
    fill.style.width = pct + '%';
    fill.style.background = rem < 20 ? '#F44336' : rem < 40 ? '#FF9800' : '#FFD600';
    if (rem <= 0) clearInterval(timerIv);
  }
  tick();
  timerIv = setInterval(tick, 1000);
}

function setMsg(text) {
  document.getElementById('status-msg').textContent = text;
}

// ── Dice UI ────────────────────────────────────────────────
function rollDice() {
  if (!G) return;
  const rb = document.getElementById('roll-btn');
  if (rb.disabled) return;
  rb.disabled = true;
  const d1 = document.getElementById('d1');
  const d2 = document.getElementById('d2');
  d1.classList.add('spinning'); d2.classList.add('spinning');
  let t = 0;
  const iv = setInterval(() => {
    d1.textContent = FACES[Math.floor(Math.random()*6)];
    d2.textContent = FACES[Math.floor(Math.random()*6)];
    if (++t >= 10) { clearInterval(iv); socket.emit('roll-dice'); }
  }, 55);
}
function endTurn() {
  if (document.getElementById('end-btn').disabled) return;
  socket.emit('end-turn');
}

// ── Event modal ────────────────────────────────────────────
function showEvent(title, body, buttons) {
  document.getElementById('evt-title').textContent = title;
  document.getElementById('evt-body').textContent  = body;
  const row = document.getElementById('evt-btns');
  row.innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'ebtn ' + (b.primary ? 'primary' : 'secondary');
    btn.textContent = b.label;
    btn.onclick = () => {
      document.getElementById('evt-modal').classList.add('hidden');
      if (b.fn) b.fn();
    };
    row.appendChild(btn);
  });
  document.getElementById('evt-modal').classList.remove('hidden');
}
function closeEvt() { document.getElementById('evt-modal').classList.add('hidden'); }

// ── Exit dialog ────────────────────────────────────────────
function openExitDialog()  { document.getElementById('exit-overlay').classList.remove('hidden'); }
function closeExitDialog() { document.getElementById('exit-overlay').classList.add('hidden'); }
function confirmExit() {
  closeExitDialog();
  socket.emit('player-exit');
  localStorage.removeItem('bi_room');
  localStorage.removeItem('bi_session');
  myRoomId = null; mySession = null; myIdx = null; G = null;
  showScreen('screen-enter');
  setMsg('');
}

// ── Reconnection ───────────────────────────────────────────
function tryReconnect() {
  const roomId    = localStorage.getItem('bi_room');
  const sessionId = localStorage.getItem('bi_session');
  if (roomId && sessionId) {
    document.getElementById('reconnect-banner').classList.remove('hidden');
    socket.emit('reconnect-room', { roomId, sessionId });
  }
}

// ── Socket events ──────────────────────────────────────────

socket.on('connect', () => {
  document.getElementById('reconnect-banner').classList.add('hidden');
  if (!myRoomId) tryReconnect();
});

socket.on('disconnect', () => {
  document.getElementById('reconnect-banner').classList.remove('hidden');
});

socket.on('reconnect', () => {
  document.getElementById('reconnect-banner').classList.add('hidden');
  if (myRoomId && mySession) {
    socket.emit('reconnect-room', { roomId: myRoomId, sessionId: mySession });
  }
});

socket.on('error', ({ msg }) => {
  const activeScreen = document.querySelector('.screen.active')?.id;
  if (activeScreen === 'screen-enter') setErr('enter-err', msg);
  else if (activeScreen === 'screen-lobby') setErr('lobby-err', msg);
  else setMsg('❗ ' + msg);
});

// ── Room created ──
socket.on('room-created', ({ roomId, sessionId }) => {
  myRoomId = roomId; mySession = sessionId; isHost = true;
  localStorage.setItem('bi_room', roomId);
  localStorage.setItem('bi_session', sessionId);
  document.getElementById('lobby-roomcode').textContent = roomId;
  document.getElementById('btn-start').classList.remove('hidden');
  document.getElementById('btn-ready').classList.add('hidden');
  showScreen('screen-lobby');
});

// ── Room joined ──
socket.on('room-joined', ({ roomId, sessionId }) => {
  myRoomId = roomId; mySession = sessionId; isHost = false;
  localStorage.setItem('bi_room', roomId);
  localStorage.setItem('bi_session', sessionId);
  document.getElementById('lobby-roomcode').textContent = roomId;
  document.getElementById('btn-start').classList.add('hidden');
  document.getElementById('btn-ready').classList.remove('hidden');
  showScreen('screen-lobby');
});

// ── Reconnected ──
socket.on('reconnected', ({ roomId, playerIdx, state, lobbyPlayers, isHost: iH, sessionId }) => {
  document.getElementById('reconnect-banner').classList.add('hidden');
  myRoomId = roomId; myIdx = playerIdx; isHost = iH;
  mySession = sessionId;
  localStorage.setItem('bi_room', roomId);
  localStorage.setItem('bi_session', sessionId);

  if (state) {
    G = state;
    document.getElementById('lobby-roomcode').textContent = roomId;
    showScreen('screen-game');
    renderAll(G);
    setMsg('Reconnected! Welcome back.');
  } else {
    document.getElementById('lobby-roomcode').textContent = roomId;
    renderLobby(lobbyPlayers);
    showScreen('screen-lobby');
  }
});

// ── Lobby updates ──
socket.on('lobby-update', (players) => {
  // Find my index from players list
  const stored = localStorage.getItem('bi_session');
  renderLobby(players);
});

socket.on('host-assigned', () => {
  isHost = true;
  const btn = document.getElementById('btn-start');
  btn.classList.remove('hidden');
  document.getElementById('btn-ready').classList.add('hidden');
  setMsg('You are now the host!');
});

// ── Game started ──
socket.on('game-started', (state) => {
  G = state;
  // Determine myIdx: find my session playerIdx from localStorage
  //  (server doesn't re-send it here; we already stored it at room-joined/room-created)
  //  But we may not have set myIdx yet for the normal join flow.
  //  We'll detect by matching socket connection order – server sends players in join order.
  //  Fallback: keep existing myIdx if already set; otherwise detect via name.
  showScreen('screen-game');
  renderAll(G);
  setMsg('🎲 Game started! Player 1 goes first.');
});

// ── Dice rolled ──
socket.on('dice-rolled', ({ v1, v2, steps, G: newG, result, winner }) => {
  G = newG;
  document.getElementById('d1').textContent = FACES[v1 - 1];
  document.getElementById('d2').textContent = FACES[v2 - 1];
  document.getElementById('d1').classList.remove('spinning');
  document.getElementById('d2').classList.remove('spinning');

  const p = G.players[G.cur];
  let msgText = `${p.name} rolled ${v1}+${v2}=${steps} → ${SQUARES[p.pos]?.name}`;

  renderAll(G);

  if (winner) {
    document.getElementById('winner-name').textContent = `🏆 ${winner} Wins!`;
    document.getElementById('winner-modal').classList.remove('hidden');
    return;
  }

  // Handle result modals only for current player (everyone sees the state update)
  switch (result.action) {
    case 'buy':
      if (myIdx === G.cur) {
        showEvent(`🏙️ Buy Property?`, `${SQUARES[result.sqId]?.name} costs ₹${result.price.toLocaleString()}. You have ₹${p.money.toLocaleString()}.`, [
          { label: `Buy ₹${result.price.toLocaleString()}`, primary: true, fn: () => socket.emit('buy-property', { sqId: result.sqId }) },
          { label: 'Skip', primary: false, fn: () => socket.emit('end-turn') }
        ]);
      } else {
        setMsg(`${p.name} is deciding whether to buy ${SQUARES[result.sqId]?.name}…`);
      }
      break;
    case 'cannot_buy':
      setMsg(`${p.name} can't afford ${SQUARES[result.sqId]?.name}.`); break;
    case 'rent':
      setMsg(`${p.name} paid ₹${result.paid.toLocaleString()} rent to ${result.ownerName}.`);
      if (myIdx === G.cur) showEvent('🏠 Rent Paid!', `You paid ₹${result.paid.toLocaleString()} rent to ${result.ownerName}.`, [
        { label: 'OK', primary: true, fn: () => socket.emit('end-turn') }
      ]);
      break;
    case 'tax':
      setMsg(`${p.name} paid ₹${result.amount.toLocaleString()} as ${result.name}.`);
      if (myIdx === G.cur) showEvent(`💸 ${result.name}`, `You paid ₹${result.amount.toLocaleString()}.`, [
        { label: 'OK', primary: true, fn: () => socket.emit('end-turn') }
      ]);
      break;
    case 'start_collect':
      setMsg(`${p.name} landed on START! +₹1,500`);
      if (myIdx === G.cur) showEvent('🟢 START!', 'You collect ₹1,500!', [
        { label: 'Collect ₹1,500', primary: true, fn: () => socket.emit('end-turn') }
      ]);
      break;
    case 'rest':
      setMsg(`${p.name} is at REST HOUSE – paid ₹${result.amount}.`);
      if (myIdx === G.cur) showEvent('🏠 REST HOUSE', `Entry fee: ₹${result.amount} paid.`, [
        { label: 'OK', primary: true, fn: () => socket.emit('end-turn') }
      ]);
      break;
    case 'club':
      setMsg(`${p.name} entered CLUB – paid ₹${result.amount}.`);
      if (myIdx === G.cur) showEvent('🎰 CLUB', `Admission: ₹${result.amount} paid.`, [
        { label: 'OK', primary: true, fn: () => socket.emit('end-turn') }
      ]);
      break;
    case 'jail':
      setMsg(`${p.name} is in JAIL!`);
      if (myIdx === G.cur) showEvent('⛓️ JAIL!', 'You are sent to Jail! Pay ₹500 fine. Turn ends.', [
        { label: 'OK', primary: true, fn: () => socket.emit('end-turn') }
      ]);
      break;
    case 'card':
      setMsg(`${p.name} drew ${result.deck.toUpperCase()} card: ${result.result}`);
      if (myIdx === G.cur) showEvent(`${result.deck === 'chance' ? '🎴 CHANCE' : '📦 COMMUNITY CHEST'}`, result.result, [
        { label: 'OK', primary: true, fn: () => socket.emit('end-turn') }
      ]);
      break;
    case 'build':
      setMsg(`${p.name} is on their own property.`);
      break;
    default:
      setMsg(msgText);
  }
});

// ── State update ──
socket.on('state-update', (state) => {
  G = state;
  renderAll(G);
  setMsg("State synced. Roll dice or wait for your turn.");
});

// ── Buy confirmation broadcast ──
socket.on('property-bought', ({ playerName, sqId }) => {
  setMsg(`${playerName} bought ${SQUARES[sqId]?.name}!`);
  if (G) renderOwnership(G);
});

// ── Player left ──
socket.on('player-left', ({ name, reconnectable }) => {
  setMsg(`${name} has ${reconnectable ? 'disconnected (can reconnect)' : 'left the game'}.`);
  if (G) renderPlayers(G);
});

socket.on('player-reconnected', ({ name }) => {
  setMsg(`${name} reconnected!`);
});

// ── Game over ──
socket.on('game-over', ({ winner }) => {
  document.getElementById('winner-name').textContent = `🏆 ${winner} Wins!`;
  document.getElementById('winner-modal').classList.remove('hidden');
});

// ── Game restarted ──
socket.on('game-restarted', (state) => {
  G = state;
  document.getElementById('winner-modal').classList.add('hidden');
  renderAll(G);
  setMsg('🎲 New game started!');
});

// ── Set myIdx on room-created / room-joined ──
// We assign myIdx based on position in room:
// host = 0, subsequent joins = 1, 2, 3...
// We track this via the lobby-update event (find by matching our session)
let _myJoinOrder = null;

socket.on('room-created', () => { _myJoinOrder = 0; myIdx = 0; });
socket.on('room-joined',  ({ roomId }) => {
  // idx will be assigned when game starts via lobby size - but we don't know count yet
  // We'll set myIdx once game-started fires via lobby watcher
});

// Track lobby to know our index
let _lastLobbySize = 0;
socket.on('lobby-update', (players) => {
  _lastLobbySize = players.length;
  // If we freshly joined (not host), our index is the last one we have a session for
  if (!isHost && myIdx === null) {
    // Find matching player – not reliable without server confirmation; handled by reconnect
  }
});

// When game starts, if myIdx is still null, guess from socket join order
socket.on('game-started', (state) => {
  if (myIdx === null) {
    // Find the player that matches our stored room/session
    // As a fallback, assume we are the last person who joined
    myIdx = _lastLobbySize - 1;
  }
});

// ── Handle join-room to capture myIdx from lobby-update ──
// Server sends idx via room-joined event – re-read from there
// Server doesn't currently send playerIdx on room-joined, so we detect via lobby order
// The cleanest fix: emit player-info after joining
socket.on('room-joined', ({ roomId, sessionId }) => {
  // Request our player index
  socket.emit('get-my-idx');
});
socket.on('my-idx', ({ idx }) => {
  myIdx = idx;
});

// Key handler
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('screen-enter').classList.contains('active')) {
    const code = document.getElementById('inp-room').value.trim();
    if (code) joinRoom(); else createRoom();
  }
});
