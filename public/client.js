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

// ── Session helpers ────────────────────────────────────────
function clearSession() {
  localStorage.removeItem('bi_room');
  localStorage.removeItem('bi_session');
  myRoomId = null; mySession = null; myIdx = null;
  isHost = false; isReady = false; G = null;
}
let G = null, timerIv = null, countdownIv = null;

const FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

// Full square data (mirrors server.js SQUARES) used for property cards
const SQUARES_FULL = [
  {id:0,  name:'START',           type:'corner'},
  {id:1,  name:'Goa',             type:'property', price:4000,  rent:[400,800,1600,2400,3200],   group:'#4CAF50', icon:'🌴'},
  {id:2,  name:'Motor Boat',      type:'transport', price:5500,  rent:[500,1000,1500,2000],        group:'#607D8B', icon:'🚤'},
  {id:3,  name:'Cochin',          type:'property',  price:3000,  rent:[300,600,1200,1800,2400],   group:'#4CAF50', icon:'⚓'},
  {id:4,  name:'Mysore',          type:'property',  price:2500,  rent:[250,500,1000,1500,2000],   group:'#4CAF50', icon:'🏯'},
  {id:5,  name:'Wealth Tax',      type:'tax',        amount:750,                                               icon:'💰'},
  {id:6,  name:'Bengaluru',       type:'property',  price:4000,  rent:[400,800,1600,2400,3200],   group:'#9C27B0', icon:'💻'},
  {id:7,  name:'Community Chest', type:'chest',                                                               icon:'📦'},
  {id:8,  name:'Chennai',         type:'property',  price:7000,  rent:[700,1400,2800,4200,5600],  group:'#9C27B0', icon:'🛕'},
  {id:9,  name:'REST HOUSE',      type:'corner'},
  {id:10, name:'Hyderabad',       type:'property',  price:3500,  rent:[350,700,1400,2100,2800],   group:'#F44336', icon:'🕌'},
  {id:11, name:'Kolkata',         type:'property',  price:6500,  rent:[650,1300,2600,3900,5200],  group:'#F44336', icon:'🌉'},
  {id:12, name:'Air India',       type:'transport', price:10500, rent:[1000,2000,3000,4000],       group:'#607D8B', icon:'✈️'},
  {id:13, name:'Darjeeling',      type:'property',  price:2500,  rent:[250,500,1000,1500,2000],   group:'#00BCD4', icon:'🍵'},
  {id:14, name:'Patna',           type:'property',  price:2000,  rent:[200,400,800,1200,1600],    group:'#00BCD4', icon:'🏞️'},
  {id:15, name:'Kanpur',          type:'property',  price:4000,  rent:[400,800,1600,2400,3200],   group:'#00BCD4', icon:'🏭'},
  {id:16, name:'Chance',          type:'chance',                                                              icon:'🎴'},
  {id:17, name:'Agra',            type:'property',  price:2500,  rent:[250,500,1000,1500,2000],   group:'#FF9800', icon:'🏰'},
  {id:18, name:'Srinagar',        type:'property',  price:5000,  rent:[500,1000,2000,3000,4000],  group:'#FF9800', icon:'🏔️'},
  {id:19, name:'CLUB',            type:'corner'},
  {id:20, name:'Amritsar',        type:'property',  price:3300,  rent:[330,660,1320,1980,2640],   group:'#3F51B5', icon:'⛩️'},
  {id:21, name:'Shimla',          type:'property',  price:3500,  rent:[350,700,1400,2100,2800],   group:'#3F51B5', icon:'⛰️'},
  {id:22, name:'BEST',            type:'property',  price:2200,  rent:[220,440,880,1320,1760],    group:'#3F51B5', icon:'🚌'},
  {id:23, name:'Electric Co.',    type:'utility',   price:2500,  rent:[150,300],                   group:'#FFC107', icon:'💡'},
  {id:24, name:'Chandigarh',      type:'property',  price:2500,  rent:[250,500,1000,1500,2000],   group:'#795548', icon:'🌿'},
  {id:25, name:'Community Chest', type:'chest',                                                               icon:'📦'},
  {id:26, name:'Lucknow',         type:'property',  price:3000,  rent:[300,600,1200,1800,2400],   group:'#795548', icon:'🕌'},
  {id:27, name:'Delhi',           type:'property',  price:6000,  rent:[600,1200,2400,3600,4800],  group:'#795548', icon:'🏯'},
  {id:28, name:'JAIL',            type:'corner'},
  {id:29, name:'Jaipur',          type:'property',  price:3000,  rent:[300,600,1200,1800,2400],   group:'#E91E63', icon:'🌸'},
  {id:30, name:'Chance',          type:'chance',                                                              icon:'🎴'},
  {id:31, name:'Indore',          type:'property',  price:1500,  rent:[150,300,600,900,1200],     group:'#E91E63', icon:'🌮'},
  {id:32, name:'Income Tax',      type:'tax',        amount:1000,                                              icon:'📄'},
  {id:33, name:'Ahmedabad',       type:'property',  price:4000,  rent:[400,800,1600,2400,3200],   group:'#FF5722', icon:'💎'},
  {id:34, name:'Railways',        type:'transport', price:9500,  rent:[2500,3500,4500,5500],       group:'#607D8B', icon:'🚂'},
  {id:35, name:'Water Works',     type:'utility',   price:3200,  rent:[150,300],                   group:'#03A9F4', icon:'💧'},
  {id:36, name:'Mumbai',          type:'property',  price:8500,  rent:[850,1700,3400,5100,6800],  group:'#FF5722', icon:'🏛️'},
];
// Simple name-only array kept for legacy lookups
const SQUARES = SQUARES_FULL.map(s => ({id: s.id, name: s.name}));

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
  clearSession();
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
    const sq = SQUARES_FULL[sid];
    const b  = state.buildings?.[sid];
    const bldg = b ? (b.hotel ? ' 🏨' : ' 🏠'.repeat(b.houses)) : '';
    const d = document.createElement('div');
    d.className = 'mpi';
    d.title = 'Click to view property card';
    // Color band matching the group
    const groupColor = sq?.group || '#555';
    d.innerHTML = `<div class="mpidot" style="background:${groupColor};box-shadow:0 0 5px ${groupColor}88"></div>
      <span>${sq?.name}${bldg}</span>`;
    d.addEventListener('click', () => showPropCard(sid, { viewOnly: true }));
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

// ── Property Card ──────────────────────────────────────────
/**
 * Show the city/property card modal.
 * @param {number} sqId  - board square id
 * @param {object} opts  - { canBuy, cannotAfford, viewOnly }
 *   canBuy: show Buy + Skip buttons (it's my turn, unowned, I can afford)
 *   cannotAfford: show Skip-only + "Can't afford" hint
 *   viewOnly: just info, no action buttons
 */
function showPropCard(sqId, opts = {}) {
  const sq = SQUARES_FULL[sqId];
  if (!sq || !sq.price) return; // not a purchasable square

  // Header color
  const hdr = document.getElementById('pc-header');
  const groupColor = sq.group || '#607D8B';
  hdr.style.background = `linear-gradient(135deg, ${groupColor}dd, ${groupColor}88)`;
  hdr.style.boxShadow  = `0 4px 20px ${groupColor}66`;

  // Type badge
  const typeBadge = document.getElementById('pc-type-badge');
  const typeLabels = { property:'Property', transport:'Transport', utility:'Utility' };
  typeBadge.textContent = typeLabels[sq.type] || 'Property';

  // Icon & name
  document.getElementById('pc-icon').textContent = sq.icon || '🏙️';
  document.getElementById('pc-name').textContent = sq.name;

  // Owner
  const ownerBar = document.getElementById('pc-owner-bar');
  if (G && G.ownership[sqId] !== undefined && G.ownership[sqId] !== null) {
    const owner = G.players[G.ownership[sqId]];
    if (owner) {
      document.getElementById('pc-owner-dot').style.background   = owner.color;
      document.getElementById('pc-owner-dot').style.boxShadow    = `0 0 6px ${owner.color}`;
      document.getElementById('pc-owner-name').textContent = `Owned by ${owner.name}`;
      ownerBar.classList.remove('hidden');
    }
  } else {
    ownerBar.classList.add('hidden');
  }

  // Price
  document.getElementById('pc-price').textContent    = `₹${sq.price.toLocaleString()}`;
  document.getElementById('pc-mortgage').textContent = `₹${Math.floor(sq.price / 2).toLocaleString()}`;

  // Rent table
  const rentTable = document.getElementById('pc-rent-table');
  rentTable.innerHTML = '';
  const b = G?.buildings?.[sqId];
  const currentHouses = b?.hotel ? 5 : (b?.houses ?? 0);

  if (sq.type === 'property') {
    const rentLabels = ['Base Rent','1 House','2 Houses','3 Houses','4 Houses','Hotel'];
    // Include rent[0] as base, then houses 1-4, then hotel (last element)
    const allRents = [...sq.rent]; // [base, h1, h2, h3, h4] or [base, h1, h2, h3, h4, hotel]
    // For our data: rent[0]=base, [1]=1H, [2]=2H, [3]=3H, [4]=hotel (5 values)
    const tiers = [
      { label: 'Base Rent',  val: sq.rent[0], tier: 0 },
      { label: '1 🏠',       val: sq.rent[1], tier: 1 },
      { label: '2 🏠🏠',     val: sq.rent[2], tier: 2 },
      { label: '3 🏠🏠🏠',   val: sq.rent[3], tier: 3 },
      { label: '4 🏠🏠🏠🏠', val: sq.rent[4] ?? sq.rent[3], tier: 4 },
    ];
    if (sq.rent.length >= 5) {
      tiers.push({ label: 'Hotel 🏨', val: sq.rent[sq.rent.length - 1], tier: 5 });
    }
    tiers.forEach(t => {
      if (t.val === undefined) return;
      const isCurrent = (t.tier === currentHouses);
      const row = document.createElement('div');
      row.className = 'pc-rent-row' + (isCurrent ? ' highlight' : '');
      row.innerHTML = `<span class="pc-rent-label">${t.label}</span>
        <span class="pc-rent-val${isCurrent ? ' current' : ''}">₹${t.val.toLocaleString()}</span>`;
      rentTable.appendChild(row);
    });
  } else if (sq.type === 'transport') {
    const tLabels = ['1 Transport','2 Transports','3 Transports','4 Transports'];
    sq.rent.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'pc-rent-row';
      row.innerHTML = `<span class="pc-rent-label">${tLabels[i] || (i+1)+' owned'}</span>
        <span class="pc-rent-val">₹${r.toLocaleString()}</span>`;
      rentTable.appendChild(row);
    });
  } else if (sq.type === 'utility') {
    const uLabels = ['1 Utility owned','2 Utilities owned'];
    sq.rent.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'pc-rent-row';
      row.innerHTML = `<span class="pc-rent-label">${uLabels[i]}</span>
        <span class="pc-rent-val">₹${r.toLocaleString()}</span>`;
      rentTable.appendChild(row);
    });
  }

  // Buildings display
  const bldDiv = document.getElementById('pc-buildings');
  const bldIcons = document.getElementById('pc-bld-icons');
  if (b && sq.type === 'property') {
    bldDiv.classList.remove('hidden');
    if (b.hotel) {
      bldIcons.textContent = '🏨';
    } else if (b.houses > 0) {
      bldIcons.textContent = '🏠'.repeat(b.houses);
    } else {
      bldIcons.textContent = '—';
    }
  } else {
    bldDiv.classList.add('hidden');
  }

  // Action buttons
  const actions = document.getElementById('pc-actions');
  actions.innerHTML = '';
  if (opts.canBuy) {
    const buyBtn = document.createElement('button');
    buyBtn.className = 'ebtn primary';
    buyBtn.innerHTML = `🛒 Buy ₹${sq.price.toLocaleString()}`;
    buyBtn.onclick = () => { closePropCard(); socket.emit('buy-property', { sqId }); };
    actions.appendChild(buyBtn);

    const skipBtn = document.createElement('button');
    skipBtn.className = 'ebtn secondary';
    skipBtn.textContent = '⏭ Skip';
    skipBtn.onclick = () => { closePropCard(); socket.emit('skip-buy'); };
    actions.appendChild(skipBtn);
  } else if (opts.cannotAfford) {
    // Show skip only with a note
    const note = document.createElement('div');
    note.style.cssText = 'font-size:.68rem;color:#ff6b6b;text-align:center;margin-bottom:4px';
    note.textContent = '💸 Not enough funds to buy';
    actions.appendChild(note);
    const skipBtn = document.createElement('button');
    skipBtn.className = 'ebtn secondary full';
    skipBtn.textContent = '⏭ Skip';
    skipBtn.onclick = () => { closePropCard(); socket.emit('skip-buy'); };
    actions.appendChild(skipBtn);
  } else {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'ebtn secondary full';
    closeBtn.textContent = '✕ Close';
    closeBtn.onclick = closePropCard;
    actions.appendChild(closeBtn);
  }

  document.getElementById('prop-card-modal').classList.remove('hidden');
}

function closePropCard(e) {
  if (e && e.target !== document.getElementById('prop-card-modal')) return;
  document.getElementById('prop-card-modal').classList.add('hidden');
}


// ── Exit dialog ────────────────────────────────────────────
function openExitDialog()  { document.getElementById('exit-overlay').classList.remove('hidden'); }
function closeExitDialog() { document.getElementById('exit-overlay').classList.add('hidden'); }
function confirmExit() {
  closeExitDialog();
  socket.emit('player-exit');
  clearSession();
  hideCountdown();
  showScreen('screen-enter');
}

// ── Reconnect ──────────────────────────────────────────────
function tryReconnect() {
  const roomId    = localStorage.getItem('bi_room');
  const sessionId = localStorage.getItem('bi_session');
  // Only attempt reconnect if we have valid stored session
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
  // Only auto-reconnect if we have an active in-memory session (mid-game)
  if (!myRoomId) tryReconnect();
});
socket.on('disconnect', () => {
  // Only show reconnecting banner if we're actually in a room
  if (myRoomId) document.getElementById('reconnect-banner').classList.remove('hidden');
});
socket.on('reconnect', () => {
  document.getElementById('reconnect-banner').classList.add('hidden');
  if (myRoomId && mySession) socket.emit('reconnect-room', { roomId: myRoomId, sessionId: mySession });
});

// If server says room/session not found, clear stale storage and go to enter screen
socket.on('error', ({ msg }) => {
  const active = document.querySelector('.screen.active')?.id;
  if (active === 'screen-enter') setErr('enter-err', '⚠ ' + msg);
  else if (active === 'screen-lobby') setErr('lobby-err', '⚠ ' + msg);
  else toast('⚠ ' + msg, 'bad');
  // If reconnect failed due to expired room, clear session and go home
  if (msg.includes('Room expired') || msg.includes('Session not found')) {
    clearSession();
    document.getElementById('reconnect-banner').classList.add('hidden');
    showScreen('screen-enter');
  }
});

// (error handler moved above, after connect/disconnect/reconnect)

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
        // Show full property card with buy/skip buttons
        showPropCard(result.sqId, { canBuy: true });
      } else {
        toast(`${p.name} is deciding on ${sqName}…`, 'info');
      }
      return; // No countdown for buy – waits for player decision
    case 'cannot_buy':
      if (isMe) {
        // Show prop card in view-only + skip mode so player sees what they can't afford
        showPropCard(result.sqId, { cannotAfford: true });
      } else {
        toast(`${p.name} can't afford ${sqName}.`, 'bad', 2500);
      }
      break;
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
  // Clear session so refreshing the page goes to home screen, not reconnect
  clearSession();
});

// ── GAME RESTARTED ───────────────────────────────────────────
socket.on('game-restarted', (state) => {
  G = state;
  hideCountdown();
  document.getElementById('winner-modal').classList.add('hidden');
  renderAll(G);
  toast('🎲 New game started!', 'info');
});

// ── NEW GAME (from winner modal) ─────────────────────────────
function goToNewGame() {
  document.getElementById('winner-modal').classList.add('hidden');
  hideCountdown();
  clearSession();
  showScreen('screen-enter');
}

// ── KEYBOARD ─────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closePropCard();
    closeEvt();
  }
  if (e.key === 'Enter') {
    const activeId = document.querySelector('.screen.active')?.id;
    if (activeId === 'screen-enter') {
      const code = document.getElementById('inp-room').value.trim();
      if (code) joinRoom(); else createRoom();
    }
  }
});

// ── BOARD TILE CLICKS (view property card) ───────────────────
// Attach after DOM is ready; re-attach is safe since we use data-sq
document.querySelectorAll('.prop, .special').forEach(tile => {
  tile.addEventListener('click', () => {
    if (!G) return; // game not started
    const sqId = parseInt(tile.dataset.sq, 10);
    if (isNaN(sqId)) return;
    const sq = SQUARES_FULL[sqId];
    if (!sq || !sq.price) return; // not a purchasable square
    showPropCard(sqId, { viewOnly: true });
  });
});
