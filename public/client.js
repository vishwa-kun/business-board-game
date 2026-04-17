// ============================================================
// BUSINESS INDIA — CLIENT v4.0
// Chat, Avatars, Trading + Full Game Logic
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
let chatUnread = 0, activeTab = 'game';
let pendingTrade = null;   // incoming trade offer
let tradeTargetIdx = null; // player we're offering to

// ── Avatar map ─────────────────────────────────────────────
const AVATAR_EMOJI = {
  businessman: '👔', robot: '🤖', king: '👑', queen: '👸',
  tiger: '🐯', lion: '🦁', ninja: '🥷', astronaut: '🧑‍🚀'
};

function av(key) { return AVATAR_EMOJI[key] || '👤'; }

// ── Session helpers ────────────────────────────────────────
function clearSession() {
  localStorage.removeItem('bi_room');
  localStorage.removeItem('bi_session');
  myRoomId = null; mySession = null; myIdx = null;
  isHost = false; isReady = false; G = null;
}

const FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

// Full square data (mirrors server.js SQUARES)
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
const SQUARES = SQUARES_FULL.map(s => ({id: s.id, name: s.name}));

// ── Screens ────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Toast ──────────────────────────────────────────────────
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

// ── Mobile tabs ────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tab-game').classList.toggle('hidden', tab !== 'game');
  document.getElementById('tab-chat').classList.toggle('hidden', tab !== 'chat');
  document.getElementById('mtab-game').classList.toggle('active', tab === 'game');
  document.getElementById('mtab-chat').classList.toggle('active', tab === 'chat');
  if (tab === 'chat') {
    chatUnread = 0;
    const badge = document.getElementById('chat-badge');
    badge.textContent = '0';
    badge.classList.add('hidden');
    scrollChat();
  }
}

// ── Avatar selection ───────────────────────────────────────
document.getElementById('avatar-grid').querySelectorAll('.av-option').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.av-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    selectedAvatar = el.dataset.av;
  });
});

// ── Enter screen ───────────────────────────────────────────
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
    row.innerHTML = `
      <span style="font-size:1.2rem">${av(p.avatar)}</span>
      <div class="player-dot" style="background:${p.color}"></div>
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
    const sq    = SQUARES[p.pos] || { name: '?' };
    const isCur = i === state.cur;
    const isMe  = i === myIdx;
    const card  = document.createElement('div');
    card.className = 'pcard' + (isCur ? ' active' : '') + (p.bust ? ' bust' : '');

    const dots = p.props.map(sid => {
      const sq2 = SQUARES_FULL[sid];
      return `<div class="pdot" style="background:${sq2?.group || '#555'}"></div>`;
    }).join('');

    let tradeHTML = '';
    if (!isMe && !p.bust && G && !G.players[myIdx]?.bust) {
      tradeHTML = `<button class="trade-btn" onclick="openTradeModal(${i})">🤝 Trade with ${p.name}</button>`;
    }

    // Online indicator
    const onlineDot = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${p.bust ? '#555' : '#00E676'};margin-left:4px;vertical-align:middle"></span>`;

    card.innerHTML = `
      <div class="pcr">
        <span class="pc-avatar">${av(p.avatar)}</span>
        <div class="pcdot" style="background:${p.color}"></div>
        <span class="pcname">${p.name}${onlineDot}</span>
        ${isMe ? '<span class="you-badge">You</span>' : ''}
      </div>
      <div class="pcmoney">₹${p.money.toLocaleString()}</div>
      <div class="pcpos">📍 ${sq.name} &nbsp;|&nbsp; 🏙️ ${p.props.length} props</div>
      <div class="pcst ${p.bust ? 'bust-txt' : 'ok'}">${p.bust ? '💀 Bankrupt' : isCur ? '🎯 Active' : '⏳ Waiting'}</div>
      ${dots ? `<div class="pcpropdots">${dots}</div>` : ''}
      ${tradeHTML}`;
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
    d.title = 'Click to view property card';
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
  text.textContent = isMe
    ? `${av(cur?.avatar)} 🎯 Your Turn — Roll the Dice!`
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
      fill.style.background = rem < 20 ? '#EF5350' : rem < 40 ? '#FF9800' : '#FFD600';
    }
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

// ── Dice result ────────────────────────────────────────────
function showRollResult(v1, v2) {
  const el = document.getElementById('roll-result');
  el.textContent = `🎲 ${v1} + ${v2} = ${v1+v2}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ── showEvent ──────────────────────────────────────────────
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
function showPropCard(sqId, opts = {}) {
  const sq = SQUARES_FULL[sqId];
  if (!sq || !sq.price) return;

  const hdr        = document.getElementById('pc-header');
  const groupColor = sq.group || '#607D8B';
  hdr.style.background = `linear-gradient(135deg, ${groupColor}dd, ${groupColor}88)`;
  hdr.style.boxShadow  = `0 4px 20px ${groupColor}66`;

  const typeBadge  = document.getElementById('pc-type-badge');
  const typeLabels = { property:'Property', transport:'Transport', utility:'Utility' };
  typeBadge.textContent = typeLabels[sq.type] || 'Property';

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
  document.getElementById('pc-mortgage').textContent = `₹${Math.floor(sq.price / 2).toLocaleString()}`;

  const rentTable    = document.getElementById('pc-rent-table');
  rentTable.innerHTML = '';
  const b            = G?.buildings?.[sqId];
  const currentHouses= b?.hotel ? 5 : (b?.houses ?? 0);

  if (sq.type === 'property') {
    const tiers = [
      { label:'Base Rent', val:sq.rent[0], tier:0 },
      { label:'1 🏠',      val:sq.rent[1], tier:1 },
      { label:'2 🏠🏠',    val:sq.rent[2], tier:2 },
      { label:'3 🏠🏠🏠',  val:sq.rent[3], tier:3 },
      { label:'4 🏠🏠🏠🏠',val:sq.rent[4] ?? sq.rent[3], tier:4 },
    ];
    if (sq.rent.length >= 5) tiers.push({ label:'Hotel 🏨', val:sq.rent[sq.rent.length-1], tier:5 });
    tiers.forEach(t => {
      if (t.val === undefined) return;
      const isCur = (t.tier === currentHouses);
      const row   = document.createElement('div');
      row.className = 'pc-rent-row' + (isCur ? ' highlight' : '');
      row.innerHTML = `<span class="pc-rent-label">${t.label}</span>
        <span class="pc-rent-val${isCur ? ' current' : ''}">₹${t.val.toLocaleString()}</span>`;
      rentTable.appendChild(row);
    });
  } else if (sq.type === 'transport') {
    const tl = ['1 Transport','2 Transports','3 Transports','4 Transports'];
    sq.rent.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'pc-rent-row';
      row.innerHTML = `<span class="pc-rent-label">${tl[i]}</span><span class="pc-rent-val">₹${r.toLocaleString()}</span>`;
      rentTable.appendChild(row);
    });
  } else if (sq.type === 'utility') {
    const ul = ['1 Utility owned','2 Utilities owned'];
    sq.rent.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'pc-rent-row';
      row.innerHTML = `<span class="pc-rent-label">${ul[i]}</span><span class="pc-rent-val">₹${r.toLocaleString()}</span>`;
      rentTable.appendChild(row);
    });
  }

  const bldDiv  = document.getElementById('pc-buildings');
  const bldIcons= document.getElementById('pc-bld-icons');
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

// ── Chat ───────────────────────────────────────────────────
function sendChat() {
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text) return;
  socket.emit('sendMessage', { text });
  input.value = '';
}

function renderChatMsg(msg) {
  const container = document.getElementById('chat-messages');
  const el = document.createElement('div');

  if (msg.type === 'system') {
    el.className = 'chat-msg-system';
    el.textContent = msg.text;
  } else {
    const isMe = (G && G.players[myIdx]?.name === msg.sender) ||
                 (msg.sender && myIdx !== null && G?.players[myIdx]?.name === msg.sender);
    el.className = 'chat-msg-player' + (isMe ? ' me' : '');
    const timeStr = new Date(msg.time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    el.innerHTML = `
      <div class="chat-av">${av(msg.avatar)}</div>
      <div>
        <div class="chat-bubble">
          ${!isMe ? `<div class="chat-sender" style="color:${msg.color || '#aaa'}">${msg.sender}</div>` : ''}
          <div class="chat-text">${msg.text}</div>
          <div class="chat-time">${timeStr}</div>
        </div>
      </div>`;
  }
  container.appendChild(el);
  scrollChat();

  // Badge if not on chat tab
  if (activeTab !== 'chat' && msg.type !== 'system') {
    chatUnread++;
    const badge = document.getElementById('chat-badge');
    badge.textContent = chatUnread > 9 ? '9+' : chatUnread;
    badge.classList.remove('hidden');
  }
}

function scrollChat() {
  const c = document.getElementById('chat-messages');
  if (c) c.scrollTop = c.scrollHeight;
}

function loadChatHistory(msgs) {
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  if (!msgs?.length) return;
  msgs.forEach(m => {
    // Render without badge increment for history
    const el = document.createElement('div');
    if (m.type === 'system') {
      el.className = 'chat-msg-system';
      el.textContent = m.text;
    } else {
      const isMe = G?.players[myIdx]?.name === m.sender;
      el.className = 'chat-msg-player' + (isMe ? ' me' : '');
      const timeStr = new Date(m.time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      el.innerHTML = `
        <div class="chat-av">${av(m.avatar)}</div>
        <div>
          <div class="chat-bubble">
            ${!isMe ? `<div class="chat-sender" style="color:${m.color || '#aaa'}">${m.sender}</div>` : ''}
            <div class="chat-text">${m.text}</div>
            <div class="chat-time">${timeStr}</div>
          </div>
        </div>`;
    }
    container.appendChild(el);
  });
  scrollChat();
}

// ── Trade Modal (initiator) ────────────────────────────────
function openTradeModal(targetIdx) {
  if (!G) return;
  const me     = G.players[myIdx];
  const target = G.players[targetIdx];
  if (!me || !target || me.bust || target.bust) return;

  tradeTargetIdx = targetIdx;

  // Target info
  const info = document.getElementById('trade-target-info');
  info.innerHTML = `<span style="font-size:1.3rem">${av(target.avatar)}</span>
    <span style="color:${target.color};font-weight:700">${target.name}</span>
    <span style="color:#9aa5b4;font-size:.8rem;margin-left:auto">₹${target.money.toLocaleString()} available</span>`;

  // My properties
  const myList = document.getElementById('trade-my-props');
  myList.innerHTML = '';
  if (!me.props.length) {
    myList.innerHTML = '<div style="color:#9aa5b4;font-size:.76rem;padding:6px">You own no properties</div>';
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

  // Target properties
  const theirList = document.getElementById('trade-their-props');
  theirList.innerHTML = '';
  if (!target.props.length) {
    theirList.innerHTML = '<div style="color:#9aa5b4;font-size:.76rem;padding:6px">They own no properties</div>';
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
  const offerProps = [...document.querySelectorAll('#trade-my-props .trade-prop-item.selected')]
    .map(el => parseInt(el.dataset.sid));
  const requestProps = [...document.querySelectorAll('#trade-their-props .trade-prop-item.selected')]
    .map(el => parseInt(el.dataset.sid));
  const offerMoney   = parseInt(document.getElementById('trade-offer-money').value)   || 0;
  const requestMoney = parseInt(document.getElementById('trade-request-money').value) || 0;

  if (!offerProps.length && !requestProps.length && offerMoney === 0 && requestMoney === 0) {
    document.getElementById('trade-err').textContent = '⚠ Add something to the trade offer.'; return;
  }
  const me = G?.players[myIdx];
  if (offerMoney > (me?.money || 0)) {
    document.getElementById('trade-err').textContent = '⚠ Not enough funds.'; return;
  }

  socket.emit('createTrade', {
    targetIdx:    tradeTargetIdx,
    offerProps,
    offerMoney,
    requestProps,
    requestMoney
  });
  closeTradeModal();
}

// ── Trade Incoming Modal ───────────────────────────────────
function showIncomingTrade(data) {
  pendingTrade = data;
  const { trade, fromName, fromAvatar, fromColor, offerPropNames, requestPropNames } = data;

  document.getElementById('trade-from-info').innerHTML = `
    <span style="font-size:1.3rem">${av(fromAvatar)}</span>
    <span style="color:${fromColor};font-weight:700">${fromName}</span>
    <span style="color:#9aa5b4;font-size:.8rem;margin-left:auto">wants to trade with you!</span>`;

  // Offer props
  const offerList = document.getElementById('incoming-offer-props');
  offerList.innerHTML = '';
  if (offerPropNames.length) {
    offerPropNames.forEach((n, i) => {
      const sq = SQUARES_FULL[trade.offerProps[i]];
      const d  = document.createElement('div');
      d.className = 'trade-incoming-item';
      d.innerHTML = `<div class="trade-prop-dot" style="background:${sq?.group||'#555'}"></div><span>${n}</span>`;
      offerList.appendChild(d);
    });
  } else { offerList.innerHTML = '<div style="color:#9aa5b4;font-size:.76rem;padding:4px">No properties</div>'; }

  // Offer money
  document.getElementById('incoming-offer-money').textContent =
    trade.offerMoney > 0 ? `💵 ₹${trade.offerMoney.toLocaleString()} cash` : '';

  // Request props
  const reqList = document.getElementById('incoming-request-props');
  reqList.innerHTML = '';
  if (requestPropNames.length) {
    requestPropNames.forEach((n, i) => {
      const sq = SQUARES_FULL[trade.requestProps[i]];
      const d  = document.createElement('div');
      d.className = 'trade-incoming-item';
      d.innerHTML = `<div class="trade-prop-dot" style="background:${sq?.group||'#555'}"></div><span>${n}</span>`;
      reqList.appendChild(d);
    });
  } else { reqList.innerHTML = '<div style="color:#9aa5b4;font-size:.76rem;padding:4px">No properties</div>'; }

  document.getElementById('incoming-request-money').textContent =
    trade.requestMoney > 0 ? `💵 ₹${trade.requestMoney.toLocaleString()} cash` : '';

  document.getElementById('trade-incoming-modal').classList.remove('hidden');
}

function respondTrade(decision) {
  if (!pendingTrade) return;
  if (decision === 'accept') {
    socket.emit('acceptTrade', { pairKey: pendingTrade.trade.pairKey });
  } else {
    socket.emit('rejectTrade', { pairKey: pendingTrade.trade.pairKey });
  }
  document.getElementById('trade-incoming-modal').classList.add('hidden');
  pendingTrade = null;
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
  if (active === 'screen-enter')   setErr('enter-err', '⚠ ' + msg);
  else if (active === 'screen-lobby') setErr('lobby-err', '⚠ ' + msg);
  else toast('⚠ ' + msg, 'bad');
  if (msg.includes('Room expired') || msg.includes('Session not found')) {
    clearSession();
    document.getElementById('reconnect-banner').classList.add('hidden');
    showScreen('screen-enter');
  }
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

// Game started
socket.on('game-started', (state) => {
  G = state;
  if (myIdx === null) myIdx = 0;
  showScreen('screen-game');
  document.getElementById('room-badge').textContent = myRoomId;
  renderAll(G);
  // Clear chat for new game
  document.getElementById('chat-messages').innerHTML = '';
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

  const p     = G.players[G.cur];
  const sqName= SQUARES[p.pos]?.name || '?';
  const isMe  = G.cur === myIdx;
  renderAll(G);

  if (winner) {
    hideCountdown();
    const winPlayer = G.players.find(pl => pl.name === winner);
    document.getElementById('winner-avatar').textContent = av(winPlayer?.avatar);
    document.getElementById('winner-name').textContent   = `🏆 ${winner} Wins!`;
    document.getElementById('winner-modal').classList.remove('hidden');
    return;
  }

  switch (result.action) {
    case 'buy':
      if (isMe) {
        showPropCard(result.sqId, { canBuy: true });
      } else {
        toast(`${av(p.avatar)} ${p.name} is deciding on ${sqName}…`, 'info');
      }
      return;
    case 'cannot_buy':
      toast(isMe ? `💸 Not enough funds to buy ${sqName}.` : `${av(p.avatar)} ${p.name} can't afford ${sqName}.`, 'bad', 2500);
      break;
    case 'rent':
      toast(`${av(p.avatar)} ${p.name} paid ₹${result.paid.toLocaleString()} rent to ${result.ownerName}.`, isMe ? 'bad' : 'info'); break;
    case 'tax':
      toast(`${av(p.avatar)} ${p.name} paid ₹${result.amount.toLocaleString()} tax (${result.name}).`, isMe ? 'bad' : 'info'); break;
    case 'start_collect':
      toast(`${av(p.avatar)} ${p.name} landed on START! +₹1,500 🟢`, isMe ? 'good' : 'info'); break;
    case 'rest':
      toast(`${av(p.avatar)} ${p.name} at REST HOUSE – paid ₹${result.amount}. 🏠`, isMe ? 'bad' : 'info'); break;
    case 'club':
      toast(`${av(p.avatar)} ${p.name} entered CLUB – paid ₹${result.amount}. 🎰`, isMe ? 'bad' : 'info'); break;
    case 'jail':
      toast(`⛓️ ${av(p.avatar)} ${p.name} is in JAIL! Fine ₹500.`, 'bad'); break;
    case 'card':
      toast(`${av(p.avatar)} ${p.name} drew ${result.deck.toUpperCase()}: ${result.result}`, 'info', 3500); break;
    case 'build':
      toast(`${av(p.avatar)} ${p.name} is on their own property.`, 'info', 2000); break;
    default:
      toast(`${av(p.avatar)} ${p.name} moved to ${sqName}.`, 'info', 2000);
  }
  showCountdown(2, 'Next turn in');
});

// ── TURN CHANGED ─────────────────────────────────────────────
socket.on('turn-changed', (state) => {
  G = state;
  hideCountdown();
  renderAll(G);
  const cur  = G.players[G.cur];
  const isMe = G.cur === myIdx;
  toast(
    isMe
      ? `🎯 Your turn, ${cur.name}! Roll the dice!`
      : `${av(cur.avatar)} ${cur.name}'s turn.`,
    isMe ? 'good' : 'info', 2500
  );
});

// ── STATE UPDATE ─────────────────────────────────────────────
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
  const cur = G.players[G.cur];
  const isMe = G.cur === myIdx;
  setTimeout(() => {
    toast(isMe ? `🎯 Your turn! Roll the dice.` : `${av(cur.avatar)} ${cur.name}'s turn.`, isMe ? 'good' : 'info', 2200);
  }, 500);
});

// ── CHAT EVENTS ──────────────────────────────────────────────
socket.on('receiveMessage', (msg) => {
  renderChatMsg(msg);
});

// ── TRADE EVENTS ─────────────────────────────────────────────
socket.on('receiveTrade', (data) => {
  showIncomingTrade(data);
  toast(`📬 Trade offer from ${data.fromName}!`, 'info', 5000);
});

socket.on('tradeSent', ({ msg }) => {
  toast(msg, 'info');
});

socket.on('tradeCompleted', ({ from, to, G: newG }) => {
  G = newG;
  renderAll(G);
  toast(`🤝 Trade completed: ${from} ↔ ${to}!`, 'good', 4000);
});

socket.on('tradeRejected', ({ by }) => {
  toast(`❌ ${by} rejected your trade offer.`, 'bad', 4000);
});

// ── PLAYER LEFT / RECONNECTED ────────────────────────────────
socket.on('player-left', ({ name, reconnectable }) => {
  toast(`${name} has ${reconnectable ? 'disconnected' : 'left the game'}.`, 'bad', 4000);
  if (G) renderPlayers(G);
});
socket.on('player-reconnected', ({ name }) => {
  toast(`${name} reconnected!`, 'good');
  if (G) renderPlayers(G);
});

// ── GAME OVER ────────────────────────────────────────────────
socket.on('game-over', ({ winner }) => {
  hideCountdown();
  const winPlayer = G?.players.find(p => p.name === winner);
  document.getElementById('winner-avatar').textContent = av(winPlayer?.avatar);
  document.getElementById('winner-name').textContent   = `🏆 ${winner} Wins!`;
  document.getElementById('winner-modal').classList.remove('hidden');
  clearSession();
});

// ── GAME RESTARTED ───────────────────────────────────────────
socket.on('game-restarted', (state) => {
  G = state;
  hideCountdown();
  document.getElementById('winner-modal').classList.add('hidden');
  document.getElementById('chat-messages').innerHTML = '';
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
    closeTradeModal();
    document.getElementById('trade-incoming-modal').classList.add('hidden');
  }
  if (e.key === 'Enter') {
    const activeId = document.querySelector('.screen.active')?.id;
    if (activeId === 'screen-enter') {
      const code = document.getElementById('inp-room').value.trim();
      if (code) joinRoom(); else createRoom();
    }
    if (activeId === 'screen-game' && document.activeElement?.id === 'chat-input') {
      sendChat();
    }
  }
});

// ── BOARD TILE CLICKS ─────────────────────────────────────────
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
