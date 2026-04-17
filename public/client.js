// ============================================================
// BUSINESS INDIA — CLIENT v4.0
// Auto-advance turns, no End Turn button
// ============================================================
'use strict';

const socket = io({
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling']
});

// ── State ──────────────────────────────────────────────────
let mySession = null, myRoomId = null, myIdx = null, isHost = false, isReady = false;
let G = null, timerIv = null, countdownIv = null;

const FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
const SQUARES = [
  {id:0,name:'START'},{id:1,name:'Goa'},{id:2,name:'Motor Boat'},
  {id:3,name:'Cochin'},{id:4,name:'Mysore'},{id:5,name:'Wealth Tax'},
  {id:6,name:'Bengaluru'},{id:7,name:'Community Chest'},{id:8,name:'Chennai'},
  {id:9,name:'REST HOUSE'},{id:10,name:'Hyderabad'},{id:11,name:'Kolkata'},
  {id:12,name:'Air India'},{id:13,name:'Darjeeling'},{id:14,name:'Patna'},
  {id:15,name:'Kanpur'},{id:16,name:'Chance'},{id:17,name:'Agra'},
  {id:18,name:'Srinagar'},{id:19,name:'CLUB'},{id:20,name:'Amritsar'},
  {id:21,name:'Shimla'},{id:22,name:'BEST'},{id:23,name:'Electric Co.'},
  {id:24,name:'Chandigarh'},{id:25,name:'Community Chest'},{id:26,name:'Lucknow'},
  {id:27,name:'Delhi'},{id:28,name:'JAIL'},{id:29,name:'Jaipur'},
  {id:30,name:'Chance'},{id:31,name:'Indore'},{id:32,name:'Income Tax'},
  {id:33,name:'Ahmedabad'},{id:34,name:'Railways'},{id:35,name:'Water Works'},
  {id:36,name:'Mumbai'}
];

// ── Screens ────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Toast notifications ────────────────────────────────────
function toast(msg, type = 'info', duration = 3200) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  const container = document.getElementById('toast-container');
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .4s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 420);
  }, duration);
}

// ── Countdown pill ─────────────────────────────────────────
function showCountdown(seconds, label = 'Next turn in') {
  clearInterval(countdownIv);
  const overlay = document.getElementById('countdown-overlay');
  const num     = document.getElementById('countdown-num');
  const pill    = document.getElementById('countdown-pill');
  pill.innerHTML = `${label} <span id="countdown-num">${seconds}</span>…`;
  overlay.classList.remove('hidden');
  let rem = seconds;
  countdownIv = setInterval(() => {
    rem--;
    const n = document.getElementById('countdown-num');
    if (n) n.textContent = rem;
    if (rem <= 0) {
      clearInterval(countdownIv);
      overlay.classList.add('hidden');
    }
  }, 1000);
}
function hideCountdown() {
  clearInterval(countdownIv);
  document.getElementById('countdown-overlay').classList.add('hidden');
}

// ── Enter screen ───────────────────────────────────────────
function createRoom() {
  const name = document.getElementById('inp-name').value.trim();
  if (!name) return setErr('enter-err', '⚠ Enter your name first.');
  socket.emit('create-room', { name });
}
function joinRoom() {
  const name = document.getElementById('inp-name').value.trim();
  const code = document.getElementById('inp-room').value.trim().toUpperCase();
  if (!name) return setErr('enter-err', '⚠ Enter your name first.');
  if (!code) return setErr('enter-err', '⚠ Enter a Room Code.');
  socket.emit('join-room', { roomId: code, name });
}
function setErr(id, msg) { document.getElementById(id).textContent = msg; }

// ── Lobby ──────────────────────────────────────────────────
function copyRoomCode() {
  navigator.clipboard.writeText(myRoomId).then(() => {
    toast('Room code copied!', 'info', 1800);
    const btn = document.querySelector('.copy-btn');
    btn.textContent = '✅'; setTimeout(() => btn.textContent = '📋', 1600);
  });
}
function toggleReady() {
  isReady = !isReady;
  socket.emit('player-ready', { ready: isReady });
  document.getElementById('btn-ready').textContent = isReady ? '❌ Unready' : '✅ Mark Ready';
}
function startGame() { socket.emit('start-game'); }
function leaveLobby() {
  socket.emit('player-exit');
  localStorage.removeItem('bi_room'); localStorage.removeItem('bi_session');
  myRoomId = null; mySession = null; isHost = false; isReady = false;
  showScreen('screen-enter');
}
function renderLobby(players) {
  const ul = document.getElementById('lobby-players');
  ul.innerHTML = '';
  players.forEach(p => {
    const row = document.createElement('div');
    row.className = 'player-row';
    let badges = '';
    if (p.isHost) badges += `<span class="badge badge-host">HOST</span>`;
    if (p.ready)  badges += `<span class="badge badge-ready">READY</span>`;
    else          badges += `<span class="badge badge-wait">WAITING</span>`;
    row.innerHTML = `<div class="player-dot" style="background:${p.color};color:${p.color}"></div>
      <span class="player-row-name">${p.name}</span>${badges}`;
    ul.appendChild(row);
  });
  if (isHost) {
    const allReady = players.filter(p => !p.isHost).every(p => p.ready);
    const startBtn = document.getElementById('btn-start');
    startBtn.classList.toggle('hidden', players.length < 2 || !allReady);
  }
}

// ── Board render ───────────────────────────────────────────
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
  document.querySelectorAll('.owner-bar').forEach(el => el.style.background = 'transparent');
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
    const dots = p.props.map(sid => {
      const ownerColor = state.players[state.ownership[sid]]?.color || '#555';
      return `<div class="pdot" style="background:${ownerColor}"></div>`;
    }).join('');
    card.innerHTML = `
      <div class="pcr">
        <div class="pcdot" style="background:${p.color};color:${p.color}"></div>
        <span class="pcname">${p.name}</span>${isMe ? '<span class="you-badge">You</span>' : ''}
      </div>
      <div class="pcmoney">₹${p.money.toLocaleString()}</div>
      <div class="pcpos">📍 ${sq.name}</div>
      <div class="pcst ${p.bust ? 'bust-txt' : 'ok'}">${p.bust ? '💀 Bankrupt' : isCur ? '🎯 Active' : '⏳ Waiting'}</div>
      ${dots ? `<div class="pcpropdots">${dots}</div>` : ''}`;
    panel.appendChild(card);
  });
}

function renderMyProps(state) {
  const el = document.getElementById('my-props');
  el.innerHTML = '';
  if (myIdx === null) return;
  const me = state.players[myIdx];
  if (!me || !me.props.length) {
    el.innerHTML = '<div class="empty-hint">None yet</div>'; return;
  }
  me.props.forEach(sid => {
    const sq = SQUARES[sid];
    const b  = state.buildings?.[sid];
    const bldg = b ? (b.hotel ? ' 🏨' : ' 🏠'.repeat(b.houses)) : '';
    const d = document.createElement('div');
    d.className = 'mpi';
    d.innerHTML = `<div class="mpidot" style="background:${me.color}"></div>
      <span>${sq?.name}${bldg}</span>`;
    el.appendChild(d);
  });
}

function renderCardLog(state) {
  const el = document.getElementById('card-log');
  el.innerHTML = '';
  if (!state.cardLog?.length) {
    el.innerHTML = '<div class="empty-hint">No cards drawn</div>'; return;
  }
  state.cardLog.slice(0, 6).forEach(e => {
    const d = document.createElement('div');
    d.className = 'log-item';
    d.innerHTML = `<span class="log-pname">${e.player}:</span> ${e.result || e.card}`;
    el.appendChild(d);
  });
}

function renderAll(state) {
  renderTokens(state);
  renderOwnership(state);
  renderPlayers(state);
  renderMyProps(state);
  renderCardLog(state);
  updateRollBtn(state);
  updateTurnBanner(state);
}

function updateRollBtn(state) {
  const rb = document.getElementById('roll-btn');
  rb.disabled = !(myIdx === state.cur && !state.rolled);
}

function updateTurnBanner(state) {
  const cur    = state.players[state.cur];
  const banner = document.getElementById('turn-banner');
  const dot    = document.getElementById('turn-dot');
  const text   = document.getElementById('turn-text');
  const isMe   = state.cur === myIdx;
  dot.style.background = cur?.color || '#fff';
  text.textContent = isMe ? '🎯 Your Turn — Roll the Dice!' : `${cur?.name}'s Turn`;
  banner.classList.toggle('my-turn', isMe);
  // Update room badge
  const rb = document.getElementById('room-badge');
  if (rb && myRoomId) rb.textContent = myRoomId;
  // Timer
  if (state.turnDeadline) startTimerBar(state.turnDeadline);
}

function startTimerBar(deadline) {
  clearInterval(timerIv);
  const TOTAL = 90;
  function tick() {
    const rem = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
    document.getElementById('timer-sec').textContent = rem + 's';
    const fill = document.getElementById('timer-fill');
    fill.style.width = ((rem / TOTAL) * 100) + '%';
    fill.style.background = rem < 20 ? '#EF5350' : rem < 40 ? '#FF9800' : '#FFD600';
    if (rem <= 0) clearInterval(timerIv);
  }
  tick(); timerIv = setInterval(tick, 1000);
}

// ── Dice ───────────────────────────────────────────────────
function rollDice() {
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

// ── Event modal ────────────────────────────────────────────
function showEvent(icon, title, body, buttons) {
  document.getElementById('evt-icon').textContent  = icon;
  document.getElementById('evt-title').textContent = title;
  document.getElementById('evt-body').textContent  = body;
  const row = document.getElementById('evt-btns');
  row.innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'ebtn ' + (b.primary ? 'primary' : 'secondary');
    btn.textContent = b.label;
    btn.onclick = () => { closeEvt(); if (b.fn) b.fn(); };
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
  localStorage.removeItem('bi_room'); localStorage.removeItem('bi_session');
  myRoomId = null; mySession = null; myIdx = null; G = null;
  hideCountdown();
  showScreen('screen-enter');
}

// ── Reconnect ──────────────────────────────────────────────
function tryReconnect() {
  const roomId    = localStorage.getItem('bi_room');
  const sessionId = localStorage.getItem('bi_session');
  if (roomId && sessionId) {
    document.getElementById('reconnect-banner').classList.remove('hidden');
    socket.emit('reconnect-room', { roomId, sessionId });
  }
}

// ── Dice result display ────────────────────────────────────
function showRollResult(v1, v2) {
  const el = document.getElementById('roll-result');
  el.textContent = `🎲 ${v1} + ${v2} = ${v1+v2}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ═══════════════════════════════════════════════════════════
// SOCKET EVENTS
// ═══════════════════════════════════════════════════════════

socket.on('connect', () => {
  document.getElementById('reconnect-banner').classList.add('hidden');
  if (!myRoomId) tryReconnect();
});
socket.on('disconnect', () => {
  document.getElementById('reconnect-banner').classList.remove('hidden');
});
socket.on('reconnect', () => {
  document.getElementById('reconnect-banner').classList.add('hidden');
  if (myRoomId && mySession) socket.emit('reconnect-room', { roomId: myRoomId, sessionId: mySession });
});

socket.on('error', ({ msg }) => {
  const active = document.querySelector('.screen.active')?.id;
  if (active === 'screen-enter') setErr('enter-err', '⚠ ' + msg);
  else if (active === 'screen-lobby') setErr('lobby-err', '⚠ ' + msg);
  else toast('⚠ ' + msg, 'bad');
});

// Lobby
socket.on('room-created', ({ roomId, sessionId }) => {
  myRoomId = roomId; mySession = sessionId; isHost = true; myIdx = 0;
  localStorage.setItem('bi_room', roomId); localStorage.setItem('bi_session', sessionId);
  document.getElementById('lobby-roomcode').textContent = roomId;
  document.getElementById('btn-start').classList.remove('hidden');
  document.getElementById('btn-ready').classList.add('hidden');
  showScreen('screen-lobby');
});
socket.on('room-joined', ({ roomId, sessionId }) => {
  myRoomId = roomId; mySession = sessionId; isHost = false;
  localStorage.setItem('bi_room', roomId); localStorage.setItem('bi_session', sessionId);
  document.getElementById('lobby-roomcode').textContent = roomId;
  document.getElementById('btn-start').classList.add('hidden');
  document.getElementById('btn-ready').classList.remove('hidden');
  showScreen('screen-lobby');
  socket.emit('get-my-idx');
});
socket.on('my-idx', ({ idx }) => { myIdx = idx; });
socket.on('lobby-update', renderLobby);
socket.on('host-assigned', () => {
  isHost = true;
  document.getElementById('btn-start').classList.remove('hidden');
  document.getElementById('btn-ready').classList.add('hidden');
  toast('👑 You are now the host!', 'info');
});

// Reconnected mid-game
socket.on('reconnected', ({ roomId, playerIdx, state, lobbyPlayers, isHost: iH, sessionId }) => {
  document.getElementById('reconnect-banner').classList.add('hidden');
  myRoomId = roomId; myIdx = playerIdx; isHost = iH; mySession = sessionId;
  localStorage.setItem('bi_room', roomId); localStorage.setItem('bi_session', sessionId);
  if (state) {
    G = state;
    document.getElementById('room-badge').textContent = roomId;
    showScreen('screen-game');
    renderAll(G);
    toast('✅ Reconnected!', 'good');
  } else {
    document.getElementById('lobby-roomcode').textContent = roomId;
    renderLobby(lobbyPlayers);
    showScreen('screen-lobby');
  }
});

// Game started
socket.on('game-started', (state) => {
  G = state;
  if (myIdx === null) myIdx = 0; // fallback
  showScreen('screen-game');
  document.getElementById('room-badge').textContent = myRoomId;
  renderAll(G);
  toast('🎲 Game started! Player 1 goes first.', 'info');
});

// ── DICE ROLLED ─────────────────────────────────────────────
socket.on('dice-rolled', ({ v1, v2, steps, G: newG, result, winner }) => {
  G = newG;
  const d1 = document.getElementById('d1');
  const d2 = document.getElementById('d2');
  d1.textContent = FACES[v1-1]; d2.textContent = FACES[v2-1];
  d1.classList.remove('spinning'); d2.classList.remove('spinning');
  showRollResult(v1, v2);

  const p = G.players[G.cur]; // current player (before auto-advance)
  renderAll(G);

  if (winner) {
    hideCountdown();
    document.getElementById('winner-name').textContent = `🏆 ${winner} Wins!`;
    document.getElementById('winner-modal').classList.remove('hidden');
    return;
  }

  const sqName = SQUARES[p.pos]?.name || '?';
  const isMe   = G.cur === myIdx;

  switch (result.action) {
    case 'buy':
      if (isMe) {
        showEvent('🏙️', `Buy ${sqName}?`,
          `Price: ₹${result.price.toLocaleString()}\nYour balance: ₹${p.money.toLocaleString()}`,
          [
            { label: `🛒 Buy ₹${result.price.toLocaleString()}`, primary: true, fn: () => socket.emit('buy-property', { sqId: result.sqId }) },
            { label: '⏭ Skip', primary: false, fn: () => socket.emit('skip-buy') }
          ]);
      } else {
        toast(`${p.name} is deciding on ${sqName}…`, 'info');
      }
      return; // No countdown for buy – waits for player decision
    case 'cannot_buy':
      toast(`${p.name} can't afford ${sqName}.`, 'bad', 2500); break;
    case 'rent':
      toast(`${p.name} paid ₹${result.paid.toLocaleString()} rent to ${result.ownerName}.`, isMe ? 'bad' : 'info'); break;
    case 'tax':
      toast(`${p.name} paid ₹${result.amount.toLocaleString()} tax (${result.name}).`, isMe ? 'bad' : 'info'); break;
    case 'start_collect':
      toast(`${p.name} landed on START! +₹1,500 🟢`, isMe ? 'good' : 'info'); break;
    case 'rest':
      toast(`${p.name} at REST HOUSE – paid ₹${result.amount}. 🏠`, isMe ? 'bad' : 'info'); break;
    case 'club':
      toast(`${p.name} entered CLUB – paid ₹${result.amount}. 🎰`, isMe ? 'bad' : 'info'); break;
    case 'jail':
      toast(`⛓️ ${p.name} is in JAIL! Fine ₹500.`, 'bad'); break;
    case 'card':
      toast(`${p.name} drew ${result.deck.toUpperCase()}: ${result.result}`, 'info', 3500); break;
    case 'build':
      toast(`${p.name} is on their own property.`, 'info', 2000); break;
    default:
      toast(`${p.name} moved to ${sqName}.`, 'info', 2000);
  }

  // Show countdown (server will auto-advance in 2.5s)
  showCountdown(2, 'Next turn in');
});

// ── TURN CHANGED (auto-advance from server) ─────────────────
socket.on('turn-changed', (state) => {
  G = state;
  hideCountdown();
  renderAll(G);
  const cur  = G.players[G.cur];
  const isMe = G.cur === myIdx;
  toast(isMe ? `🎯 Your turn, ${cur.name}! Roll the dice!` : `${cur.name}'s turn.`, isMe ? 'good' : 'info', 2500);
});

// ── STATE UPDATE (generic sync) ──────────────────────────────
socket.on('state-update', (state) => {
  G = state;
  renderAll(G);
});

// ── PROPERTY BOUGHT ──────────────────────────────────────────
socket.on('property-bought', ({ playerName, sqId, G: newG }) => {
  G = newG;
  hideCountdown();
  renderAll(G);
  toast(`🏙️ ${playerName} bought ${SQUARES[sqId]?.name}!`, 'good');
  // Show whose turn it is next
  const cur = G.players[G.cur];
  const isMe = G.cur === myIdx;
  setTimeout(() => {
    toast(isMe ? `🎯 Your turn! Roll the dice.` : `${cur.name}'s turn.`, isMe ? 'good' : 'info', 2200);
  }, 500);
});

// ── PLAYER LEFT / RECONNECTED ────────────────────────────────
socket.on('player-left', ({ name, reconnectable }) => {
  toast(`${name} has ${reconnectable ? 'disconnected' : 'left the game'}.`, 'bad', 4000);
  if (G) renderPlayers(G);
});
socket.on('player-reconnected', ({ name }) => {
  toast(`${name} reconnected!`, 'good');
});

// ── GAME OVER ────────────────────────────────────────────────
socket.on('game-over', ({ winner }) => {
  hideCountdown();
  document.getElementById('winner-name').textContent = `🏆 ${winner} Wins!`;
  document.getElementById('winner-modal').classList.remove('hidden');
});

// ── GAME RESTARTED ───────────────────────────────────────────
socket.on('game-restarted', (state) => {
  G = state;
  hideCountdown();
  document.getElementById('winner-modal').classList.add('hidden');
  renderAll(G);
  toast('🎲 New game started!', 'info');
});

// ── KEYBOARD ─────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const activeId = document.querySelector('.screen.active')?.id;
    if (activeId === 'screen-enter') {
      const code = document.getElementById('inp-room').value.trim();
      if (code) joinRoom(); else createRoom();
    }
  }
});
