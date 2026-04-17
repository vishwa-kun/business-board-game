// ============================================================
// BUSINESS INDIA — CLIENT v5.0
// 3-Column Layout | FAB Chat | Avatars | Trading
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
let mySession = null, myRoomId = null, myIdx = null;
let isHost = false, isReady = false;
let G = null, timerIv = null, countdownIv = null;
let selectedAvatar = 'businessman';
let chatUnread = 0;
let pendingTrade  = null;
let tradeTargetIdx = null;

// ── Avatar emoji map ────────────────────────────────────────
const AVATAR_EMOJI = {
  businessman:'👔', robot:'🤖', king:'👑', queen:'👸',
  tiger:'🐯', lion:'🦁', ninja:'🥷', astronaut:'🧑‍🚀'
};
function av(key) { return AVATAR_EMOJI[key] || '👤'; }

// Avatar gradient pairs keyed by player color
function avGradient(color) {
  const map = {
    '#E53935':['#7f0000','#E53935'],'#1E88E5':['#0a2472','#1E88E5'],
    '#43A047':['#1a3d1e','#43A047'],'#FFB300':['#7a4d00','#FFB300'],
    '#8E24AA':['#3d005e','#8E24AA'],'#FB8C00':['#7a3000','#FB8C00'],
    '#00ACC1':['#003f4f','#00ACC1'],'#D81B60':['#5c0030','#D81B60']
  };
  const g = map[color] || ['#1a2040', color];
  return `linear-gradient(145deg,${g[0]},${g[1]})`;
}

// ── Session helpers ─────────────────────────────────────────
function clearSession() {
  localStorage.removeItem('bi_room');
  localStorage.removeItem('bi_session');
  myRoomId = null; mySession = null; myIdx = null;
  isHost = false; isReady = false; G = null;
}

const FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

// ── SQUARES DATA ────────────────────────────────────────────
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
const SQUARES = SQUARES_FULL.map(s => ({ id:s.id, name:s.name }));

// ── Screens ─────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Toast ────────────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3200) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .4s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 440);
  }, duration);
}

// ── Countdown ────────────────────────────────────────────────
function showCountdown(seconds, label = 'Next turn in') {
  clearInterval(countdownIv);
  const overlay = document.getElementById('countdown-overlay');
  const pill    = document.getElementById('countdown-pill');
  pill.innerHTML = `${label} <span id="countdown-num">${seconds}</span>…`;
  overlay.classList.remove('hidden');
  let rem = seconds;
  countdownIv = setInterval(() => {
    rem--;
    const n = document.getElementById('countdown-num');
    if (n) n.textContent = rem;
    if (rem <= 0) { clearInterval(countdownIv); overlay.classList.add('hidden'); }
  }, 1000);
}
function hideCountdown() {
  clearInterval(countdownIv);
  document.getElementById('countdown-overlay').classList.add('hidden');
}

// ── Mobile chat FAB ──────────────────────────────────────────
function toggleMobileChat() {
  const panel = document.getElementById('right-panel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    chatUnread = 0;
    const badge = document.getElementById('chat-fab-badge');
    badge.textContent = '0';
    badge.classList.add('hidden');
    setTimeout(scrollChat, 80);
  }
}
function closeMobileChat() {
  document.getElementById('right-panel').classList.remove('open');
}
// Close chat drawer when clicking outside (on overlay)
document.addEventListener('click', (e) => {
  const panel = document.getElementById('right-panel');
  const fab   = document.getElementById('chat-fab');
  if (panel && window.innerWidth <= 1100 && panel.classList.contains('open')) {
    if (!panel.contains(e.target) && e.target !== fab && !fab.contains(e.target)) {
      closeMobileChat();
    }
  }
});

// ── Avatar selection ─────────────────────────────────────────
document.getElementById('avatar-grid')?.querySelectorAll('.av-option').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.av-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    selectedAvatar = el.dataset.av;
  });
});

// ── Enter screen ─────────────────────────────────────────────
function createRoom() {
  const name = document.getElementById('inp-name').value.trim();
  if (!name) return setErr('enter-err', '⚠ Enter your name first.');
  socket.emit('create-room', { name, avatar: selectedAvatar });
}
function joinRoom() {
  const name = document.getElementById('inp-name').value.trim();
  const code = document.getElementById('inp-room').value.trim().toUpperCase();
  if (!name) return setErr('enter-err', '⚠ Enter your name first.');
  if (!code) return setErr('enter-err', '⚠ Enter a Room Code.');
  socket.emit('join-room', { roomId: code, name, avatar: selectedAvatar });
}
function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

// ── Lobby ────────────────────────────────────────────────────
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
function startGame()  { socket.emit('start-game'); }
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
    let badges = p.isHost ? `<span class="badge badge-host">HOST</span>` : '';
    badges += p.ready ? `<span class="badge badge-ready">READY</span>` : `<span class="badge badge-wait">WAITING</span>`;
    row.innerHTML = `
      <span style="font-size:1.2rem">${av(p.avatar)}</span>
      <div class="player-dot" style="background:${p.color}"></div>
      <span class="player-row-name">${p.name}</span>
      ${badges}`;
    ul.appendChild(row);
  });
  if (isHost) {
    const allReady = players.filter(p => !p.isHost).every(p => p.ready);
    document.getElementById('btn-start').classList.toggle('hidden', players.length < 2 || !allReady);
  }
}

// ── Board render ─────────────────────────────────────────────
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
    const sqName = SQUARES[p.pos]?.name || '?';
    const isCur  = i === state.cur;
    const isMe   = i === myIdx;
    const card   = document.createElement('div');
    card.className = `pcard${isCur ? ' active' : ''}${p.bust ? ' bust' : ''}`;

    // Property color dots
    const dots = p.props.map(sid => {
      const sq = SQUARES_FULL[sid];
      return `<div class="pdot" style="background:${sq?.group || '#555'}"></div>`;
    }).join('');

    // Trade button (only for other non-bust players when I'm also alive)
    const canTrade = !isMe && !p.bust && G && !G.players[myIdx]?.bust;
    const tradeBtn = canTrade
      ? `<button class="trade-btn" onclick="openTradeModal(${i})">🤝 Trade with ${p.name}</button>`
      : '';

    const onlineColor = p.bust ? '#3a3a3a' : '#2dd4a0';

    card.innerHTML = `
      <div class="pcard-row1">
        <div class="pcard-av" style="background:${avGradient(p.color)}">${av(p.avatar)}</div>
        <div class="pcard-nameblock">
          <div class="pcard-name">
            ${p.name}
            <span class="online-dot" style="background:${onlineColor}"></span>
            ${isMe ? '<span class="you-badge">You</span>' : ''}
          </div>
          <div class="pcard-status">
            ${p.bust ? '💀 Bankrupt' : isCur ? '🎯 Playing' : '⏳ Waiting'}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div class="pcard-money">₹${p.money.toLocaleString()}</div>
          <div style="font-size:.66rem;color:#6b7a96">${p.props.length} props</div>
        </div>
      </div>
      <div class="pcard-pos">📍 ${sqName}</div>
      ${dots ? `<div class="pcpropdots">${dots}</div>` : ''}
      ${tradeBtn}`;
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
    const sq   = SQUARES_FULL[sid];
    const b    = state.buildings?.[sid];
    const bldg = b ? (b.hotel ? ' 🏨' : ' 🏠'.repeat(b.houses)) : '';
    const d = document.createElement('div');
    d.className = 'mpi';
    d.title = 'Click to view card';
    d.innerHTML = `<div class="mpidot" style="background:${sq?.group || '#555'};box-shadow:0 0 5px ${sq?.group || '#555'}88"></div>
      <span>${sq?.name || '?'}${bldg}</span>`;
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
  document.getElementById('roll-btn').disabled = !(myIdx === state.cur && !state.rolled);
}

function updateTurnBanner(state) {
  const cur    = state.players[state.cur];
  const isMe   = state.cur === myIdx;
  const banner = document.getElementById('turn-banner');
  document.getElementById('turn-dot').style.background = cur?.color || '#fff';
  document.getElementById('turn-text').textContent = isMe
    ? `${av(cur?.avatar)} 🎯 Your Turn — Roll!`
    : `${av(cur?.avatar)} ${cur?.name}'s Turn`;
  banner.classList.toggle('my-turn', isMe);
  const rb = document.getElementById('room-badge');
  if (rb && myRoomId) rb.textContent = myRoomId;
  if (state.turnDeadline) startTimerBar(state.turnDeadline);
}

function startTimerBar(deadline) {
  clearInterval(timerIv);
  const TOTAL = 90;
  function tick() {
    const rem  = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
    const fill = document.getElementById('timer-fill');
    document.getElementById('timer-sec').textContent = rem + 's';
    if (fill) {
      fill.style.width = ((rem / TOTAL) * 100) + '%';
      fill.style.background = rem < 20 ? '#ff5252' : rem < 40 ? '#FF9800' : '#f0b429';
    }
    if (rem <= 0) clearInterval(timerIv);
  }
  tick(); timerIv = setInterval(tick, 1000);
}

// ── Dice roll ────────────────────────────────────────────────
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

function showRollResult(v1, v2) {
  const el = document.getElementById('roll-result');
  el.textContent = `🎲 ${v1} + ${v2} = ${v1+v2}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ── Event modal ──────────────────────────────────────────────
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

// ── Property card ────────────────────────────────────────────
function showPropCard(sqId, opts = {}) {
  const sq = SQUARES_FULL[sqId];
  if (!sq || !sq.price) return;

  const groupColor = sq.group || '#607D8B';
  const hdr = document.getElementById('pc-header');
  hdr.style.background = `linear-gradient(135deg,${groupColor}cc,${groupColor}66)`;
  hdr.style.boxShadow  = `0 4px 20px ${groupColor}55`;

  const typeLabels = { property:'Property', transport:'Transport', utility:'Utility' };
  document.getElementById('pc-type-badge').textContent = typeLabels[sq.type] || 'Property';
  document.getElementById('pc-icon').textContent = sq.icon || '🏙️';
  document.getElementById('pc-name').textContent = sq.name;

  const ownerBar = document.getElementById('pc-owner-bar');
  if (G && G.ownership[sqId] !== undefined && G.ownership[sqId] !== null) {
    const owner = G.players[G.ownership[sqId]];
    if (owner) {
      document.getElementById('pc-owner-dot').style.background = owner.color;
      document.getElementById('pc-owner-dot').style.boxShadow  = `0 0 6px ${owner.color}`;
      document.getElementById('pc-owner-name').textContent = `${av(owner.avatar)} Owned by ${owner.name}`;
      ownerBar.classList.remove('hidden');
    }
  } else { ownerBar.classList.add('hidden'); }

  document.getElementById('pc-price').textContent    = `₹${sq.price.toLocaleString()}`;
  document.getElementById('pc-mortgage').textContent = `₹${Math.floor(sq.price/2).toLocaleString()}`;

  const rentTable     = document.getElementById('pc-rent-table');
  rentTable.innerHTML = '';
  const b             = G?.buildings?.[sqId];
  const curHouses     = b?.hotel ? 5 : (b?.houses ?? 0);

  if (sq.type === 'property') {
    const tiers = [
      {label:'Base Rent',    val:sq.rent[0], tier:0},
      {label:'1 🏠',         val:sq.rent[1], tier:1},
      {label:'2 🏠🏠',       val:sq.rent[2], tier:2},
      {label:'3 🏠🏠🏠',     val:sq.rent[3], tier:3},
      {label:'4 🏠🏠🏠🏠',   val:sq.rent[4] ?? sq.rent[3], tier:4},
    ];
    if (sq.rent.length >= 5) tiers.push({label:'Hotel 🏨', val:sq.rent[sq.rent.length-1], tier:5});
    tiers.forEach(t => {
      if (t.val === undefined) return;
      const isCur = t.tier === curHouses;
      const row = document.createElement('div');
      row.className = 'pc-rent-row' + (isCur ? ' highlight' : '');
      row.innerHTML = `<span class="pc-rent-label">${t.label}</span>
        <span class="pc-rent-val${isCur?' current':''}">₹${t.val.toLocaleString()}</span>`;
      rentTable.appendChild(row);
    });
  } else if (sq.type === 'transport') {
    ['1 Transport','2 Transports','3 Transports','4 Transports'].forEach((lbl,i) => {
      if (sq.rent[i] === undefined) return;
      const row = document.createElement('div');
      row.className = 'pc-rent-row';
      row.innerHTML = `<span class="pc-rent-label">${lbl}</span><span class="pc-rent-val">₹${sq.rent[i].toLocaleString()}</span>`;
      rentTable.appendChild(row);
    });
  } else if (sq.type === 'utility') {
    ['1 Utility owned','2 Utilities owned'].forEach((lbl,i) => {
      if (sq.rent[i] === undefined) return;
      const row = document.createElement('div');
      row.className = 'pc-rent-row';
      row.innerHTML = `<span class="pc-rent-label">${lbl}</span><span class="pc-rent-val">₹${sq.rent[i].toLocaleString()}</span>`;
      rentTable.appendChild(row);
    });
  }

  const bldDiv   = document.getElementById('pc-buildings');
  const bldIcons = document.getElementById('pc-bld-icons');
  if (b && sq.type === 'property') {
    bldDiv.classList.remove('hidden');
    bldIcons.textContent = b.hotel ? '🏨' : b.houses > 0 ? '🏠'.repeat(b.houses) : '—';
  } else { bldDiv.classList.add('hidden'); }

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

// ── CHAT ─────────────────────────────────────────────────────
function sendChat() {
  const input = document.getElementById('chat-input');
  const text  = (input.value || '').trim();
  if (!text) return;
  socket.emit('sendMessage', { text });
  input.value = '';
}

function isChatVisible() {
  // Desktop (> 1100px) = always visible; mobile = check .open class
  if (window.innerWidth > 1100) return true;
  return document.getElementById('right-panel').classList.contains('open');
}

function renderChatMsg(msg) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const el = document.createElement('div');

  if (msg.type === 'system') {
    el.className = 'chat-msg-system';
    el.textContent = msg.text;
  } else {
    const myName = G?.players[myIdx]?.name;
    const isMe   = myName && msg.sender === myName;
    el.className = `chat-msg-player${isMe ? ' me' : ''}`;
    const timeStr = new Date(msg.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    el.innerHTML = `
      <div class="chat-av">${av(msg.avatar)}</div>
      <div>
        <div class="chat-bubble">
          ${!isMe ? `<div class="chat-sender" style="color:${msg.color||'#aaa'}">${msg.sender}</div>` : ''}
          <div class="chat-text">${msg.text}</div>
          <div class="chat-time">${timeStr}</div>
        </div>
      </div>`;

    // Unread badge when chat not visible
    if (!isChatVisible()) {
      chatUnread++;
      const badge = document.getElementById('chat-fab-badge');
      badge.textContent = chatUnread > 9 ? '9+' : chatUnread;
      badge.classList.remove('hidden');
    }
  }

  container.appendChild(el);
  scrollChat();
}

function scrollChat() {
  const c = document.getElementById('chat-messages');
  if (c) c.scrollTop = c.scrollHeight;
}

function loadChatHistory(msgs) {
  const container = document.getElementById('chat-messages');
  if (!container || !msgs?.length) return;
  container.innerHTML = '';
  msgs.forEach(m => {
    const el = document.createElement('div');
    if (m.type === 'system') {
      el.className = 'chat-msg-system';
      el.textContent = m.text;
    } else {
      const myName = G?.players[myIdx]?.name;
      const isMe   = myName && m.sender === myName;
      el.className = `chat-msg-player${isMe ? ' me' : ''}`;
      const timeStr = new Date(m.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      el.innerHTML = `
        <div class="chat-av">${av(m.avatar)}</div>
        <div>
          <div class="chat-bubble">
            ${!isMe ? `<div class="chat-sender" style="color:${m.color||'#aaa'}">${m.sender}</div>` : ''}
            <div class="chat-text">${m.text}</div>
            <div class="chat-time">${timeStr}</div>
          </div>
        </div>`;
    }
    container.appendChild(el);
  });
  scrollChat();
}

// ── Trade modal (initiator) ──────────────────────────────────
function openTradeModal(targetIdx) {
  if (!G) return;
  const me     = G.players[myIdx];
  const target = G.players[targetIdx];
  if (!me || !target || me.bust || target.bust) return;
  tradeTargetIdx = targetIdx;

  document.getElementById('trade-target-info').innerHTML = `
    <span style="font-size:1.3rem">${av(target.avatar)}</span>
    <span style="color:${target.color};font-weight:700">${target.name}</span>
    <span style="color:#6b7a96;font-size:.78rem;margin-left:auto">₹${target.money.toLocaleString()}</span>`;

  const myList = document.getElementById('trade-my-props');
  myList.innerHTML = '';
  if (!me.props.length) {
    myList.innerHTML = '<div style="color:#6b7a96;font-size:.74rem;padding:6px">No properties owned</div>';
  } else {
    me.props.forEach(sid => {
      const sq = SQUARES_FULL[sid];
      const d  = document.createElement('div');
      d.className = 'trade-prop-item';
      d.dataset.sid = sid;
      d.innerHTML = `<div class="trade-prop-dot" style="background:${sq?.group||'#555'}"></div><span>${sq?.name}</span>`;
      d.addEventListener('click', () => d.classList.toggle('selected'));
      myList.appendChild(d);
    });
  }

  const theirList = document.getElementById('trade-their-props');
  theirList.innerHTML = '';
  if (!target.props.length) {
    theirList.innerHTML = '<div style="color:#6b7a96;font-size:.74rem;padding:6px">They own no properties</div>';
  } else {
    target.props.forEach(sid => {
      const sq = SQUARES_FULL[sid];
      const d  = document.createElement('div');
      d.className = 'trade-prop-item';
      d.dataset.sid = sid;
      d.innerHTML = `<div class="trade-prop-dot" style="background:${sq?.group||'#555'}"></div><span>${sq?.name}</span>`;
      d.addEventListener('click', () => d.classList.toggle('selected'));
      theirList.appendChild(d);
    });
  }

  document.getElementById('trade-offer-money').value   = '';
  document.getElementById('trade-request-money').value = '';
  document.getElementById('trade-err').textContent     = '';
  document.getElementById('trade-modal').classList.remove('hidden');
}
function closeTradeModal(e) {
  if (e && e.target !== document.getElementById('trade-modal')) return;
  document.getElementById('trade-modal').classList.add('hidden');
  tradeTargetIdx = null;
}
function submitTrade() {
  if (tradeTargetIdx === null) return;
  const offerProps   = [...document.querySelectorAll('#trade-my-props .trade-prop-item.selected')].map(el => parseInt(el.dataset.sid));
  const requestProps = [...document.querySelectorAll('#trade-their-props .trade-prop-item.selected')].map(el => parseInt(el.dataset.sid));
  const offerMoney   = parseInt(document.getElementById('trade-offer-money').value)   || 0;
  const requestMoney = parseInt(document.getElementById('trade-request-money').value) || 0;

  if (!offerProps.length && !requestProps.length && offerMoney === 0 && requestMoney === 0) {
    document.getElementById('trade-err').textContent = '⚠ Add something to the offer.'; return;
  }
  if (offerMoney > (G?.players[myIdx]?.money || 0)) {
    document.getElementById('trade-err').textContent = '⚠ Not enough funds.'; return;
  }
  socket.emit('createTrade', { targetIdx: tradeTargetIdx, offerProps, offerMoney, requestProps, requestMoney });
  closeTradeModal();
}

// ── Trade modal (receiver) ───────────────────────────────────
function showIncomingTrade(data) {
  pendingTrade = data;
  const { trade, fromName, fromAvatar, fromColor, offerPropNames, requestPropNames } = data;

  document.getElementById('trade-from-info').innerHTML = `
    <span style="font-size:1.3rem">${av(fromAvatar)}</span>
    <span style="color:${fromColor};font-weight:700">${fromName}</span>
    <span style="color:#6b7a96;font-size:.78rem;margin-left:auto">wants to trade!</span>`;

  const offerList = document.getElementById('incoming-offer-props');
  offerList.innerHTML = offerPropNames.length
    ? offerPropNames.map((n,i) => {
        const sq = SQUARES_FULL[trade.offerProps[i]];
        return `<div class="trade-incoming-item"><div class="trade-prop-dot" style="background:${sq?.group||'#555'}"></div><span>${n}</span></div>`;
      }).join('')
    : '<div style="color:#6b7a96;font-size:.74rem;padding:4px">No properties</div>';

  document.getElementById('incoming-offer-money').textContent =
    trade.offerMoney > 0 ? `💵 ₹${trade.offerMoney.toLocaleString()} cash` : '';

  const reqList = document.getElementById('incoming-request-props');
  reqList.innerHTML = requestPropNames.length
    ? requestPropNames.map((n,i) => {
        const sq = SQUARES_FULL[trade.requestProps[i]];
        return `<div class="trade-incoming-item"><div class="trade-prop-dot" style="background:${sq?.group||'#555'}"></div><span>${n}</span></div>`;
      }).join('')
    : '<div style="color:#6b7a96;font-size:.74rem;padding:4px">No properties</div>';

  document.getElementById('incoming-request-money').textContent =
    trade.requestMoney > 0 ? `💵 ₹${trade.requestMoney.toLocaleString()} cash` : '';

  document.getElementById('trade-incoming-modal').classList.remove('hidden');
}
function respondTrade(decision) {
  if (!pendingTrade) return;
  if (decision === 'accept') socket.emit('acceptTrade', { pairKey: pendingTrade.trade.pairKey });
  else                       socket.emit('rejectTrade', { pairKey: pendingTrade.trade.pairKey });
  document.getElementById('trade-incoming-modal').classList.add('hidden');
  pendingTrade = null;
}

// ── Exit ────────────────────────────────────────────────────
function openExitDialog()  { document.getElementById('exit-overlay').classList.remove('hidden'); }
function closeExitDialog() { document.getElementById('exit-overlay').classList.add('hidden'); }
function confirmExit() {
  closeExitDialog();
  socket.emit('player-exit');
  clearSession();
  hideCountdown();
  showScreen('screen-enter');
}

// ── Reconnect ────────────────────────────────────────────────
function tryReconnect() {
  const roomId    = localStorage.getItem('bi_room');
  const sessionId = localStorage.getItem('bi_session');
  if (roomId && sessionId) {
    document.getElementById('reconnect-banner').classList.remove('hidden');
    socket.emit('reconnect-room', { roomId, sessionId });
  }
}

// ═══════════════════════════════════════════════════════════
// SOCKET EVENTS
// ═══════════════════════════════════════════════════════════

socket.on('connect', () => {
  document.getElementById('reconnect-banner').classList.add('hidden');
  if (!myRoomId) tryReconnect();
});
socket.on('disconnect', () => {
  if (myRoomId) document.getElementById('reconnect-banner').classList.remove('hidden');
});
socket.on('reconnect', () => {
  document.getElementById('reconnect-banner').classList.add('hidden');
  if (myRoomId && mySession) socket.emit('reconnect-room', { roomId: myRoomId, sessionId: mySession });
});

socket.on('error', ({ msg }) => {
  const active = document.querySelector('.screen.active')?.id;
  if (active === 'screen-enter')  setErr('enter-err', '⚠ ' + msg);
  else if (active === 'screen-lobby') setErr('lobby-err', '⚠ ' + msg);
  else toast('⚠ ' + msg, 'bad');
  if (msg.includes('Room expired') || msg.includes('Session not found')) {
    clearSession();
    document.getElementById('reconnect-banner').classList.add('hidden');
    showScreen('screen-enter');
  }
});

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

socket.on('reconnected', ({ roomId, playerIdx, state, lobbyPlayers, isHost: iH, sessionId, chatHistory }) => {
  document.getElementById('reconnect-banner').classList.add('hidden');
  myRoomId = roomId; myIdx = playerIdx; isHost = iH; mySession = sessionId;
  localStorage.setItem('bi_room', roomId); localStorage.setItem('bi_session', sessionId);
  if (state) {
    G = state;
    document.getElementById('room-badge').textContent = roomId;
    showScreen('screen-game');
    renderAll(G);
    if (chatHistory?.length) loadChatHistory(chatHistory);
    toast('✅ Reconnected!', 'good');
  } else {
    document.getElementById('lobby-roomcode').textContent = roomId;
    renderLobby(lobbyPlayers);
    showScreen('screen-lobby');
  }
});

socket.on('game-started', (state) => {
  G = state;
  if (myIdx === null) myIdx = 0;
  showScreen('screen-game');
  document.getElementById('room-badge').textContent = myRoomId;
  document.getElementById('chat-messages').innerHTML = '';
  renderAll(G);
  toast('🎲 Game started! Good luck!', 'info');
});

// ── DICE ROLLED ──────────────────────────────────────────────
socket.on('dice-rolled', ({ v1, v2, steps, G: newG, result, winner }) => {
  G = newG;
  const d1 = document.getElementById('d1');
  const d2 = document.getElementById('d2');
  d1.textContent = FACES[v1-1]; d2.textContent = FACES[v2-1];
  d1.classList.remove('spinning'); d2.classList.remove('spinning');
  showRollResult(v1, v2);

  const p      = G.players[G.cur];
  const sqName = SQUARES[p.pos]?.name || '?';
  const isMe   = G.cur === myIdx;
  renderAll(G);

  if (winner) {
    hideCountdown();
    const wP = G.players.find(pl => pl.name === winner);
    document.getElementById('winner-avatar').textContent = av(wP?.avatar);
    document.getElementById('winner-name').textContent   = `🏆 ${winner} Wins!`;
    document.getElementById('winner-modal').classList.remove('hidden');
    return;
  }

  switch (result.action) {
    case 'buy':
      if (isMe) { showPropCard(result.sqId, { canBuy: true }); return; }
      toast(`${av(p.avatar)} ${p.name} is deciding on ${sqName}…`, 'info');
      return;
    case 'cannot_buy':
      toast(isMe ? `💸 Not enough funds to buy ${sqName}.` : `${av(p.avatar)} ${p.name} can't afford ${sqName}.`, 'bad', 2500); break;
    case 'rent':
      toast(`${av(p.avatar)} ${p.name} paid ₹${result.paid.toLocaleString()} rent to ${result.ownerName}.`, isMe ? 'bad' : 'info'); break;
    case 'tax':
      toast(`${av(p.avatar)} ${p.name} paid ₹${result.amount.toLocaleString()} tax.`, isMe ? 'bad' : 'info'); break;
    case 'start_collect':
      toast(`${av(p.avatar)} ${p.name} landed on START! +₹1,500 🟢`, isMe ? 'good' : 'info'); break;
    case 'rest':
      toast(`${av(p.avatar)} ${p.name} at REST HOUSE – paid ₹${result.amount}.`, isMe ? 'bad' : 'info'); break;
    case 'club':
      toast(`${av(p.avatar)} ${p.name} entered CLUB – paid ₹${result.amount}.`, isMe ? 'bad' : 'info'); break;
    case 'jail':
      toast(`⛓️ ${av(p.avatar)} ${p.name} landed in JAIL! Paid ₹${result.amount || 500} fine.`, 'bad'); break;
    case 'card':
      toast(`${av(p.avatar)} ${p.name}: ${result.result}`, 'info', 3500); break;
    case 'build':
      toast(`${av(p.avatar)} ${p.name} is on their own property.`, 'info', 2000); break;
    default:
      toast(`${av(p.avatar)} ${p.name} moved to ${sqName}.`, 'info', 2000);
  }
  showCountdown(2, 'Next turn in');
});

socket.on('turn-changed', (state) => {
  G = state;
  hideCountdown();
  renderAll(G);
  const cur  = G.players[G.cur];
  const isMe = G.cur === myIdx;
  toast(isMe ? `🎯 Your turn! Roll the dice.` : `${av(cur.avatar)} ${cur.name}'s turn.`, isMe ? 'good' : 'info', 2500);
});

socket.on('state-update', (state) => { G = state; renderAll(G); });

socket.on('property-bought', ({ playerName, sqId, G: newG }) => {
  G = newG; hideCountdown(); renderAll(G);
  toast(`🏙️ ${playerName} bought ${SQUARES[sqId]?.name}!`, 'good');
  const cur  = G.players[G.cur];
  const isMe = G.cur === myIdx;
  setTimeout(() => toast(isMe ? `🎯 Your turn!` : `${av(cur.avatar)} ${cur.name}'s turn.`, isMe ? 'good' : 'info', 2000), 500);
});

socket.on('receiveMessage', (msg) => renderChatMsg(msg));

socket.on('receiveTrade', (data) => {
  showIncomingTrade(data);
  toast(`📬 Trade offer from ${data.fromName}!`, 'info', 5000);
});
socket.on('tradeSent', ({ msg }) => toast(msg, 'info'));
socket.on('tradeCompleted', ({ from, to, G: newG }) => {
  G = newG; renderAll(G);
  toast(`🤝 ${from} ↔ ${to} completed a trade!`, 'good', 4000);
});
socket.on('tradeRejected', ({ by }) => toast(`❌ ${by} rejected your offer.`, 'bad', 4000));

socket.on('player-left', ({ name, reconnectable }) => {
  toast(`${name} ${reconnectable ? 'disconnected' : 'left the game'}.`, 'bad', 4000);
  if (G) renderPlayers(G);
});
socket.on('player-reconnected', ({ name }) => {
  toast(`${name} reconnected!`, 'good');
  if (G) renderPlayers(G);
});

socket.on('game-over', ({ winner }) => {
  hideCountdown();
  const wP = G?.players?.find(p => p.name === winner);
  document.getElementById('winner-avatar').textContent = av(wP?.avatar);
  document.getElementById('winner-name').textContent   = `🏆 ${winner} Wins!`;
  document.getElementById('winner-modal').classList.remove('hidden');
  clearSession();
});

socket.on('game-restarted', (state) => {
  G = state;
  hideCountdown();
  document.getElementById('winner-modal').classList.add('hidden');
  document.getElementById('chat-messages').innerHTML = '';
  renderAll(G);
  toast('🎲 New game started!', 'info');
});

// ── Winner → home ────────────────────────────────────────────
function goToNewGame() {
  document.getElementById('winner-modal').classList.add('hidden');
  hideCountdown();
  clearSession();
  showScreen('screen-enter');
}

// ── Keyboard shortcuts ───────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closePropCard();
    closeEvt();
    closeTradeModal();
    document.getElementById('trade-incoming-modal').classList.add('hidden');
    closeMobileChat();
  }
  if (e.key === 'Enter') {
    const activeId = document.querySelector('.screen.active')?.id;
    if (activeId === 'screen-enter') {
      document.getElementById('inp-room').value.trim() ? joinRoom() : createRoom();
    }
    if (activeId === 'screen-game' && document.activeElement?.id === 'chat-input') {
      sendChat();
    }
  }
});

// ── Board tile click → property card ─────────────────────────
document.querySelectorAll('.prop, .special').forEach(tile => {
  tile.addEventListener('click', () => {
    if (!G) return;
    const sqId = parseInt(tile.dataset.sq, 10);
    if (isNaN(sqId)) return;
    const sq = SQUARES_FULL[sqId];
    if (!sq || !sq.price) return;
    showPropCard(sqId, { viewOnly: true });
  });
});
