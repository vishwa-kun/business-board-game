// ============================================================
// BUSINESS INDIA – PREMIUM GAME ENGINE v2.0
// ============================================================

const COLORS = ['#E53935','#1E88E5','#43A047','#FFB300','#8E24AA','#FB8C00','#00ACC1','#D81B60'];
const TOTAL_SQ = 37;
const START_MONEY = 1500;
const HOUSE_COST = 1000;
const HOTEL_COST = 2000;
const MAX_HOUSES = 4;

// City landmark emojis
const LANDMARKS = {
  1:'🌴',2:'🚤',3:'⚓',4:'🏯',6:'💻',8:'🛕',
  10:'🕌',11:'🌉',12:'✈️',13:'🍵',14:'🏞️',15:'🏭',
  17:'🏰',18:'🏔️',20:'⛩️',21:'⛰️',22:'🚌',
  23:'💡',24:'🌿',26:'🕌',27:'🏯',29:'🌸',
  31:'🌮',33:'💎',34:'🚂',35:'💧',36:'🏛️'
};

const SQUARES = [
  {id:0,  name:'START',           type:'corner'},
  {id:1,  name:'Goa',             type:'property', price:4000,  rent:[400,800,1600,2400,3200],   group:'#4CAF50'},
  {id:2,  name:'Motor Boat',      type:'transport',price:5500,  rent:[500,1000,1500,2000]},
  {id:3,  name:'Cochin',          type:'property', price:3000,  rent:[300,600,1200,1800,2400],   group:'#4CAF50'},
  {id:4,  name:'Mysore',          type:'property', price:2500,  rent:[250,500,1000,1500,2000],   group:'#4CAF50'},
  {id:5,  name:'Wealth Tax',      type:'tax',      amount:750},
  {id:6,  name:'Bengaluru',       type:'property', price:4000,  rent:[400,800,1600,2400,3200],   group:'#9C27B0'},
  {id:7,  name:'Community Chest', type:'chest'},
  {id:8,  name:'Chennai',         type:'property', price:7000,  rent:[700,1400,2800,4200,5600],  group:'#9C27B0'},
  {id:9,  name:'REST HOUSE',      type:'corner'},
  {id:10, name:'Hyderabad',       type:'property', price:3500,  rent:[350,700,1400,2100,2800],   group:'#F44336'},
  {id:11, name:'Kolkata',         type:'property', price:6500,  rent:[650,1300,2600,3900,5200],  group:'#F44336'},
  {id:12, name:'Air India',       type:'transport',price:10500, rent:[1000,2000,3000,4000]},
  {id:13, name:'Darjeeling',      type:'property', price:2500,  rent:[250,500,1000,1500,2000],   group:'#00BCD4'},
  {id:14, name:'Patna',           type:'property', price:2000,  rent:[200,400,800,1200,1600],    group:'#00BCD4'},
  {id:15, name:'Kanpur',          type:'property', price:4000,  rent:[400,800,1600,2400,3200],   group:'#00BCD4'},
  {id:16, name:'Chance',          type:'chance'},
  {id:17, name:'Agra',            type:'property', price:2500,  rent:[250,500,1000,1500,2000],   group:'#FF9800'},
  {id:18, name:'Srinagar',        type:'property', price:5000,  rent:[500,1000,2000,3000,4000],  group:'#FF9800'},
  {id:19, name:'CLUB',            type:'corner'},
  {id:20, name:'Amritsar',        type:'property', price:3300,  rent:[330,660,1320,1980,2640],   group:'#3F51B5'},
  {id:21, name:'Shimla',          type:'property', price:3500,  rent:[350,700,1400,2100,2800],   group:'#3F51B5'},
  {id:22, name:'BEST',            type:'property', price:2200,  rent:[220,440,880,1320,1760],    group:'#3F51B5'},
  {id:23, name:'Electric Co.',    type:'utility',  price:2500,  rent:[150,300]},
  {id:24, name:'Chandigarh',      type:'property', price:2500,  rent:[250,500,1000,1500,2000],   group:'#795548'},
  {id:25, name:'Community Chest', type:'chest'},
  {id:26, name:'Lucknow',         type:'property', price:3000,  rent:[300,600,1200,1800,2400],   group:'#795548'},
  {id:27, name:'Delhi',           type:'property', price:6000,  rent:[600,1200,2400,3600,4800],  group:'#795548'},
  {id:28, name:'JAIL',            type:'corner'},
  {id:29, name:'Jaipur',          type:'property', price:3000,  rent:[300,600,1200,1800,2400],   group:'#E91E63'},
  {id:30, name:'Chance',          type:'chance'},
  {id:31, name:'Indore',          type:'property', price:1500,  rent:[150,300,600,900,1200],     group:'#E91E63'},
  {id:32, name:'Income Tax',      type:'tax',      amount:1000},
  {id:33, name:'Ahmedabad',       type:'property', price:4000,  rent:[400,800,1600,2400,3200],   group:'#FF5722'},
  {id:34, name:'Railways',        type:'transport',price:9500,  rent:[2500,3500,4500,5500]},
  {id:35, name:'Water Works',     type:'utility',  price:3200,  rent:[150,300]},
  {id:36, name:'Mumbai',          type:'property', price:8500,  rent:[850,1700,3400,5100,6800],  group:'#FF5722'}
];


const CHANCE_CARDS = [
  {txt:'🎰 Lottery Prize!',        fn:(p)=>{p.money+=2500;  return '+₹2,500 lottery winnings!'}},
  {txt:'🏆 Crossword Champion!',   fn:(p)=>{p.money+=1000;  return '+₹1,000 from crossword!'}},
  {txt:'🎲 Jackpot!',              fn:(p)=>{p.money+=2000;  return '+₹2,000 jackpot!'}},
  {txt:'📈 Stock Market Profit!',  fn:(p)=>{p.money+=3000;  return '+₹3,000 from stocks!'}},
  {txt:'💰 Tax Refund!',           fn:(p)=>{p.money+=2000;  return '+₹2,000 tax refund!'}},
  {txt:'🏅 Export Excellence Award!',fn:(p)=>{p.money+=3000;return '+₹3,000 award!'}},
  {txt:'🚀 Advance to START!',     fn:(p)=>{p.pos=0;p.inJail=false;p.money+=1500;return 'Moved to START! +₹1,500 bonus!'}},
  {txt:'💸 Market Regulation Fine!',fn:(p)=>{p.money=Math.max(0,p.money-500); return '-₹500 fine!'}},
  {txt:'🏠 Emergency House Repairs!',fn:(p)=>{p.money=Math.max(0,p.money-1500);return '-₹1,500 for repairs!'}},
  {txt:'🔥 Godown Fire Loss!',     fn:(p)=>{p.money=Math.max(0,p.money-3000);return '-₹3,000 loss!'}}
];

const CHEST_CARDS = [
  {txt:'🎂 Birthday Celebrations!',fn:(p,ps)=>{let t=0;ps.forEach(o=>{if(o.id!==p.id&&!o.bust){o.money=Math.max(0,o.money-500);t+=500;}});p.money+=t;return `Collected ₹${t} in birthday gifts!`}},
  {txt:'💰 Income Tax Refund!',    fn:(p)=>{p.money+=100;   return '+₹100 tax refund!'}},
  {txt:'🏨 Hotel Revenue Bonus!',  fn:(p)=>{p.money+=1500;  return '+₹1,500 hotel income!'}},
  {txt:'💒 Marriage Celebration!', fn:(p)=>{p.money+=2000;  return '+₹2,000 celebration!'}},
  {txt:'🏆 Annual Performance Bonus!',fn:(p)=>{p.money+=2500;return '+₹2,500 bonus!'}},
  {txt:'🔒 Go to Jail!',           fn:(p)=>{p.pos=28;p.inJail=true; return 'Sent to JAIL! ⛓️'}},
  {txt:'🏥 Medical Emergency!',    fn:(p)=>{p.money=Math.max(0,p.money-1000);return '-₹1,000 medical fees!'}},
  {txt:'💊 Insurance Premium Due!',fn:(p)=>{p.money=Math.max(0,p.money-1500);return '-₹1,500 insurance!'}}
];

// ---- STATE ----
let G = { players:[], cur:0, rolled:false, buildings:{}, ownership:{} };

let socket = null;
try { socket = (typeof io !== 'undefined') ? io() : null; } catch(e) { socket = null; }

let MP = {
  roomId: null, isHost: false, mySocketId: null, myName: '',
  myPlayerIdx: null, lobbyPlayers: [], isReady: false,
  online: !!socket, sessionId: null
};

// ── Connection status ──────────────────────────────────────
function _setConnStatus(online, text) {
  const badge = document.getElementById('connBadge');
  if (!badge) return;
  badge.classList.toggle('online', online);
  const label = document.getElementById('connText');
  if (label) label.textContent = text;
}

// ── Turn timer countdown ───────────────────────────────────
let _timerInterval = null;
function _startTimerCountdown(deadline) {
  clearInterval(_timerInterval);
  const el = document.getElementById('turnTimer');
  if (!el || !deadline) return;
  function tick() {
    const secs = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    el.textContent = secs > 0 ? `\u23f1 ${secs}s remaining` : '\u23f1 Time up!';
    el.className = secs <= 15 ? 'urgent' : '';
    if (secs <= 0) clearInterval(_timerInterval);
  }
  tick(); _timerInterval = setInterval(tick, 1000);
}

// ── Card log renderer ──────────────────────────────────────
function _renderCardLog(cardLog) {
  const el = document.getElementById('card-log');
  if (!el || !cardLog) return;
  el.style.display = 'flex';
  const header = el.querySelector('[data-header]') || el.firstElementChild;
  el.innerHTML = '';
  const hdr = document.createElement('div');
  hdr.setAttribute('data-header','1');
  hdr.style.cssText = 'color:rgba(255,193,7,.5);font-size:.44rem;font-weight:700;margin-bottom:2px';
  hdr.textContent = '\ud83c\udccf CARD LOG';
  el.appendChild(hdr);
  cardLog.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'cl-entry';
    div.innerHTML = `<span class="cl-deck ${entry.deck}">${entry.deck==='chance'?'\ud83c\udcd4':'\ud83d\udce6'}</span>
      <div><div class="cl-who">${entry.player}</div><div class="cl-text">${entry.result}</div></div>`;
    el.appendChild(div);
  });
}

// ── Session persistence ────────────────────────────────────
function _saveSession(r, s) { try { localStorage.setItem('bi_sess', JSON.stringify({r,s,t:Date.now()})); } catch(e){} }
function _loadSession()     { try { const d=JSON.parse(localStorage.getItem('bi_sess')||'null'); return d&&(Date.now()-d.t<3600000)?d:null; } catch(e){return null;} }
function _clearSession()    { try { localStorage.removeItem('bi_sess'); } catch(e){} }

if (socket) {
  socket.on('connect',          () => _setConnStatus(true,  '\ud83d\udfe2 Connected'));
  socket.on('disconnect',       () => _setConnStatus(false, '\ud83d\udd34 Disconnected'));
  socket.on('reconnect_attempt',() => _setConnStatus(false, '\ud83d\udfe1 Reconnecting\u2026'));
  socket.on('reconnect',        () => { _setConnStatus(true, '\ud83d\udfe2 Reconnected'); });

  // Auto-rejoin on connect if session saved
  socket.on('connect', () => {
    const saved = _loadSession();
    if (saved?.r && saved?.s) socket.emit('reconnect-room', { roomId:saved.r, sessionId:saved.s });
  });

  socket.on('room-created', ({ roomId, sessionId }) => {
    MP.roomId=roomId; MP.isHost=true; MP.mySocketId=socket.id; MP.sessionId=sessionId;
    _saveSession(roomId, sessionId); _showWaiting();
  });

  socket.on('room-joined', ({ roomId, sessionId }) => {
    MP.roomId=roomId; MP.isHost=false; MP.mySocketId=socket.id; MP.sessionId=sessionId;
    _saveSession(roomId, sessionId); _showWaiting();
  });

  socket.on('reconnected', ({ roomId, playerIdx, state, lobbyPlayers, isHost }) => {
    MP.roomId=roomId; MP.isHost=isHost; MP.myPlayerIdx=playerIdx;
    MP.lobbyPlayers=lobbyPlayers||[];
    msg(`\u2705 Reconnected to room ${roomId}!`);
    if (state) _launchGame(state); else _showWaiting();
    if (isHost) { document.getElementById('startBtnW').style.display='block'; }
  });

  socket.on('lobby-update', (players) => {
    MP.lobbyPlayers=players;
    const me=players.findIndex(p=>p.socketId===socket.id);
    if (me!==-1) MP.myPlayerIdx=me;
    _renderWaitList();
  });

  socket.on('host-assigned', () => {
    MP.isHost=true;
    document.getElementById('startBtnW').style.display='block';
    const rb=document.getElementById('restartBtn'); if(rb) rb.style.display='';
    msg('\ud83d\udc51 You are now the HOST!');
  });

  socket.on('game-started', (gs) => {
    const me=MP.lobbyPlayers.findIndex(p=>p.socketId===socket.id);
    MP.myPlayerIdx=me; _launchGame(gs);
    if (MP.isHost) { const rb=document.getElementById('restartBtn'); if(rb) rb.style.display=''; }
    if (gs.turnDeadline) _startTimerCountdown(gs.turnDeadline);
  });

  socket.on('dice-rolled', ({ v1, v2, steps, G: newG, result, winner }) => {
    const FACES=['⚀','⚁','⚂','⚃','⚄','⚅'];
    const d1el=document.getElementById('d1'), d2el=document.getElementById('d2');
    if (d1el){ d1el.textContent=FACES[v1-1]; d1el.classList.remove('spinning'); }
    if (d2el){ d2el.textContent=FACES[v2-1]; d2el.classList.remove('spinning'); }
    const curIdx = G.cur !== undefined ? G.cur : newG.cur;
    const p = G.players?.[curIdx];
    const oldPos = p ? p.pos : 0;
    let step=0;
    function nextStep() {
      step++;
      const tmpPos=(oldPos+step)%TOTAL_SQ;
      if (G.players?.[curIdx]) G.players[curIdx].pos=tmpPos;
      renderTokens(); flashTile(tmpPos);
      if (step<steps) setTimeout(nextStep,120);
      else {
        G=newG; renderAll(); setTurnLabel(); updateRollBtn();
        if (newG.cardLog) _renderCardLog(newG.cardLog);
        if (newG.turnDeadline) _startTimerCountdown(newG.turnDeadline);
        _handleResult(result, winner);
      }
    }
    if (p && steps>0) nextStep();
    else { G=newG; renderAll(); setTurnLabel(); updateRollBtn(); _handleResult(result,winner); }
  });

  socket.on('state-update', (newG) => {
    G=newG; renderAll(); setTurnLabel(); updateRollBtn();
    if (newG.cardLog) _renderCardLog(newG.cardLog);
    if (newG.turnDeadline) _startTimerCountdown(newG.turnDeadline);
  });

  socket.on('game-restarted', (newG) => {
    G=newG; msg('\ud83d\udd04 Game restarted!'); renderAll(); setTurnLabel(); updateRollBtn();
    if (newG.turnDeadline) _startTimerCountdown(newG.turnDeadline);
  });

  socket.on('player-left', ({ name, reconnectable }) => {
    msg(`${name} left.${reconnectable?' (may rejoin)':''}`);
  });
  socket.on('player-reconnected', ({ name }) => { msg(`${name} reconnected \u2705`); });
  socket.on('error', ({ msg: e }) => { msg(`\u26a0\ufe0f ${e}`); });
}

// ── _handleResult: card is now applied server-side ─────────
function _doEndTurn() { if (socket) socket.emit('end-turn'); else endTurn(); }

function _handleResult(result, winner) {
  if (winner) {
    _clearSession();
    showEvent('\ud83c\udfc6 WINNER & CHAMPION!',
      `${winner} wins Business India!\n\nBalance: \u20b9${G.players.find(p=>p.name===winner)?.money.toLocaleString()}`,
      [{label:'\ud83c\udf8a Play Again', primary:true, fn:()=>location.reload()}]);
    return;
  }
  if (!result) { _doEndTurn(); return; }
  switch (result.action) {
    case 'buy':
      showEvent(`\ud83c\udfd9\ufe0f ${SQUARES[result.sqId]?.name} \u2013 For Sale!`,
        `Price: \u20b9${result.price?.toLocaleString()}\nWould you like to buy it?`,
        [
          {label:`\ud83c\udfe0 Buy (\u20b9${result.price?.toLocaleString()})`, primary:true,
           fn:()=>{ if(socket) socket.emit('buy-property',{sqId:result.sqId}); else {buyProp(G.players[G.cur],SQUARES[result.sqId]);endTurn();}}},
          {label:'Skip', primary:false, fn:_doEndTurn}
        ]); break;
    case 'cannot_buy':
      msg(`\u274c Can't afford ${SQUARES[result.sqId]?.name}.`); _doEndTurn(); break;
    case 'build': {
      const sq=SQUARES[result.sqId], p=G.players[G.cur];
      const b=G.buildings[result.sqId], houses=b?.houses||0;
      if (b?.hotel) { _doEndTurn(); break; }
      if (houses<MAX_HOUSES)
        showEvent(`${LANDMARKS[result.sqId]||'\ud83c\udfd9\ufe0f'} ${sq.name}`,
          `Build a house? \ud83c\udfe0 ${houses}/4 built.\nCost: \u20b9${HOUSE_COST.toLocaleString()} | Balance: \u20b9${p.money.toLocaleString()}`,
          [
            {label: p.money>=HOUSE_COST?`\ud83c\udfe0 Build House (\u20b9${HOUSE_COST.toLocaleString()})`:'\u274c Not enough', primary:true,
             fn:()=>{ if(p.money>=HOUSE_COST){ if(socket) socket.emit('build-house',{sqId:result.sqId}); else addHouse(result.sqId);} _doEndTurn();}},
            {label:'Skip', primary:false, fn:_doEndTurn}
          ]);
      else
        showEvent(`${LANDMARKS[result.sqId]||'\ud83c\udfd9\ufe0f'} ${sq.name} \u2013 Hotel!`,
          `4 houses built! Upgrade to Hotel?\nCost: \u20b9${HOTEL_COST.toLocaleString()} | Balance: \u20b9${p.money.toLocaleString()}`,
          [
            {label: p.money>=HOTEL_COST?`\ud83c\udfe2 Build Hotel (\u20b9${HOTEL_COST.toLocaleString()})`:'\u274c Not enough', primary:true,
             fn:()=>{ if(p.money>=HOTEL_COST){ if(socket) socket.emit('build-hotel',{sqId:result.sqId}); else addHotel(result.sqId);} _doEndTurn();}},
            {label:'Skip', primary:false, fn:_doEndTurn}
          ]);
      break;
    }
    case 'card': // Server applied card effect; show animated popup
      showCardAnim(result.deck==='chance', result.card, result.result, _doEndTurn); break;
    case 'rent':
      showEvent('\ud83d\udcb8 Rent Due!',`Paid \u20b9${result.paid?.toLocaleString()} to ${result.ownerName}.`,
        [{label:'OK',primary:true,fn:_doEndTurn}]); break;
    case 'tax':
      showEvent(`\ud83d\udcb8 ${result.name}!`,`Paid \u20b9${result.amount?.toLocaleString()} in tax.`,
        [{label:'OK',primary:true,fn:_doEndTurn}]); break;
    case 'rest':
      showEvent('\ud83c\udfe0 REST HOUSE',`Paid \u20b9${result.amount} rest charges.`,
        [{label:'OK',primary:true,fn:_doEndTurn}]); break;
    case 'club':
      showEvent('\ud83c\udfb0 CLUB Fee',`Paid \u20b9${result.amount} entry.`,
        [{label:'OK',primary:true,fn:_doEndTurn}]); break;
    case 'jail':
      showEvent('\u26d3\ufe0f GO TO JAIL!','You are sent to JAIL!',
        [{label:'OK',primary:true,fn:_doEndTurn}]); break;
    case 'start_collect':
      msg('\u2705 Landed on START! +\u20b91,500'); _doEndTurn(); break;
    default: _doEndTurn();
  }
}

function createRoom() {
  const name=(document.getElementById('lobbyName').value.trim()||'').slice(0,14);
  if (!name){alert('Enter your name first!');return;} MP.myName=name;
  if (socket) socket.emit('create-room',{name});
  else alert('Server not available.\nRun: npm start  then open http://localhost:3000');
}
function joinRoom() {
  const name=(document.getElementById('lobbyName').value.trim()||'').slice(0,14);
  const rid=document.getElementById('joinId').value.trim().toUpperCase();
  if (!name){alert('Enter your name first!');return;} if (!rid){alert('Enter a Room ID!');return;}
  MP.myName=name;
  if (socket) socket.emit('join-room',{roomId:rid,name});
  else alert('Server not available.\nRun: npm start  then open http://localhost:3000');
}
function toggleReady() {
  MP.isReady=!MP.isReady;
  const btn=document.getElementById('readyBtn');
  btn.textContent=MP.isReady?'\u274c Unready':'\u2705 I\'m Ready';
  btn.classList.toggle('is-ready',MP.isReady);
  if (socket) socket.emit('player-ready',{ready:MP.isReady});
}
function hostStart() { if (MP.isHost&&socket) socket.emit('start-game'); }
function restartGame() {
  if (!MP.isHost||!socket) return;
  if (confirm('\u26a0\ufe0f Restart the game for all players?')) socket.emit('restart-game');
}

function _launchGame(gs) {
  G = JSON.parse(JSON.stringify(gs));
  document.getElementById('waiting').style.display   = 'none';
  document.getElementById('lobby').style.display     = 'none';
  document.getElementById('game').style.display      = 'flex';
  document.getElementById('gameTitle').style.display = 'block';
  document.getElementById('left-panel').style.display = 'flex';
  document.getElementById('right-panel').style.display = 'flex';
  document.getElementById('bottom-ui').style.display  = 'flex';
  renderAll();
  msg(`Welcome to Business India! ${G.players[0].name} goes first! 🎲`);
  setTurnLabel();
}

function _broadcast() {
  // In online mode, server handles state; no client broadcast needed
  // In local mode, this is a no-op (renderAll already called)
}

function _showWaiting() {
  document.getElementById('lobby').style.display   = 'none';
  document.getElementById('waiting').style.display = 'flex';
  document.getElementById('roomIdDisplay').textContent = MP.roomId;
  if (MP.isHost) document.getElementById('startBtnW').style.display = 'block';
  _renderWaitList();
}

function _renderWaitList() {
  const el = document.getElementById('waitPlayerList');
  el.innerHTML = '';
  MP.lobbyPlayers.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'wait-player' + (p.ready ? ' ready' : '');
    div.innerHTML = `
      <div class="wp-dot" style="background:${p.color};box-shadow:0 0 6px ${p.color}"></div>
      <span class="wp-name">${p.name}</span>
      ${p.isHost ? '<span class="wp-host">HOST</span>' : ''}
      <span class="wp-status ${p.ready?'yes':'no'}">${p.ready ? '✅ Ready' : '⏳ Waiting'}</span>`;
    el.appendChild(div);
  });
}

function copyRoomId() {
  navigator.clipboard.writeText(MP.roomId).catch(()=>{});
  const btn = event.target;
  btn.textContent = '✅ Copied!';
  setTimeout(()=>btn.textContent='📋 Copy', 1500);
}

// ---- LOCAL FALLBACK SETUP (hot-seat, no server needed) ----

let selCount = 4;
const cntRow = document.getElementById('cntRow');
const piDiv  = document.getElementById('player-inputs');

[2,3,4,5,6,7,8].forEach(n => {
  const b = document.createElement('button');
  b.className = 'cnt-btn' + (n === selCount ? ' sel' : '');
  b.textContent = n;
  b.dataset.count = n;
  b.onclick = () => {
    selCount = n;
    document.querySelectorAll('.cnt-btn').forEach(x => x.classList.toggle('sel', +x.dataset.count === n));
    buildInputs();
  };
  cntRow.appendChild(b);
});

function buildInputs() {
  piDiv.innerHTML = '';
  for (let i = 0; i < selCount; i++) {
    const row = document.createElement('div');
    row.className = 'pinput';
    row.innerHTML = `<div class="pcolor-dot" style="background:${COLORS[i]};box-shadow:0 0 8px ${COLORS[i]}"></div>
      <input class="pname-in" id="pname${i}" value="Player ${i+1}" maxlength="14"/>`;
    piDiv.appendChild(row);
  }
}
buildInputs();

function showLocalSetup() {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('setup').style.display = 'flex';
}

function startGame() {
  G.players = [];
  G.buildings = {};
  G.ownership = {};
  for (let i = 0; i < selCount; i++) {
    const nm = document.getElementById('pname' + i).value.trim() || `Player ${i+1}`;
    G.players.push({ id:i, name:nm, color:COLORS[i], money:START_MONEY, pos:0, props:[], bust:false, inJail:false });
  }
  G.cur = 0; G.rolled = false;
  document.getElementById('setup').style.display = 'none';
  _launchGame(G);
}

// ---- RENDER ----
function renderAll() {
  renderTokens();
  renderPanel();
  updateRollBtn();
  renderBuildings();
  renderOwnership();
}

function renderTokens() {
  document.querySelectorAll('.tok-area').forEach(el => el.innerHTML = '');
  G.players.forEach((p, i) => {
    if (p.bust) return;
    const area = document.getElementById('sq' + p.pos);
    if (!area) return;
    const t = document.createElement('div');
    t.className = 'token';
    t.style.background = p.color;
    t.style.boxShadow = `0 2px 8px rgba(0,0,0,.7), 0 0 6px ${p.color}, inset 0 1px 2px rgba(255,255,255,.35)`;
    t.textContent = i + 1;
    area.appendChild(t);
  });
}

function renderPanel() {
  const panel = document.getElementById('left-panel');
  panel.innerHTML = '<div class="panel-title">👥 Players</div>';
  G.players.forEach((p, i) => {
    const sq = SQUARES[p.pos];
    const card = document.createElement('div');
    card.className = 'pcard' + (i === G.cur && !p.bust ? ' active' : '') + (p.bust ? ' bust' : '');

    let deedsHTML = '';
    if (p.props.length > 0) {
      deedsHTML = `<div class="pc-deeds"><div class="pc-deeds-title">🏙️ Properties</div>`;
      p.props.forEach(sid => {
        const sq2 = SQUARES[sid];
        if (!sq2) return;
        const icon  = LANDMARKS[sid] || '🏙️';
        const band  = sq2.group || '#607D8B';
        const b     = G.buildings[sid];
        let bldTxt  = '';
        if (b && b.hotel)        bldTxt = '🏢';
        else if (b && b.houses)  bldTxt = '🏠'.repeat(b.houses);
        const rentIdx = b && !b.hotel ? Math.min(b.houses, (sq2.rent||[]).length-1) : (b&&b.hotel ? (sq2.rent||[]).length-1 : 0);
        const curRent = Array.isArray(sq2.rent) ? sq2.rent[rentIdx] : (sq2.rent||0);
        deedsHTML += `
          <div class="mini-deed" onclick="tileClick(${sid})" title="${sq2.name}">
            <div class="mini-deed-band" style="background:${band}"></div>
            <div class="mini-deed-body">
              <div style="display:flex;align-items:center;gap:3px">
                <span class="mini-deed-icon">${icon}</span>
                <span class="mini-deed-name">${sq2.name}</span>
              </div>
              <div class="mini-deed-info">
                <span>₹${(sq2.price||0).toLocaleString()}</span>
                ${bldTxt ? `<span class="mini-deed-bld">${bldTxt}</span>` : ''}
                <span style="color:#7af">rent:₹${curRent.toLocaleString()}</span>
              </div>
            </div>
          </div>`;
      });
      deedsHTML += `</div>`;
    }

    // Status label with jail indicator
    let statusTxt, statusCls;
    if (p.bust)          { statusTxt = '💀 Bankrupt';  statusCls = 'bust-txt'; }
    else if (p.inJail)   { statusTxt = '⛓️ In Jail';    statusCls = 'jail-txt'; }
    else if (i===G.cur)  { statusTxt = '🎯 Active Turn'; statusCls = 'ok'; }
    else                  { statusTxt = '⏳ Waiting';    statusCls = 'ok'; }

    card.innerHTML = `
      <div class="pc-top">
        <div class="pc-dot" style="background:${p.color};box-shadow:0 0 6px ${p.color}"></div>
        <span class="pc-name">${p.name}</span>
      </div>
      <div class="pc-money">₹${p.money.toLocaleString()}</div>
      <div class="pc-props">🏘️ ${p.props.length} propert${p.props.length===1?'y':'ies'}</div>
      <div class="pc-pos">📍 ${sq.name}</div>
      <div class="pc-status ${statusCls}">${statusTxt}</div>
      ${deedsHTML}`;
    panel.appendChild(card);
  });
}


function renderBuildings() {
  SQUARES.forEach(sq => {
    const bldEl = document.getElementById('bld' + sq.id);
    if (!bldEl) return;
    bldEl.innerHTML = '';
    const b = G.buildings[sq.id];
    if (!b) return;
    if (b.hotel) {
      const h = document.createElement('span');
      h.className = 'bh';
      h.textContent = '🏢';
      bldEl.appendChild(h);
    } else if (b.houses > 0) {
      for (let i = 0; i < b.houses; i++) {
        const h = document.createElement('span');
        h.className = 'bh';
        h.textContent = '🏠';
        bldEl.appendChild(h);
      }
    }
  });
}

function renderOwnership() {
  // Clear all
  document.querySelectorAll('.owner-bar').forEach(el => el.style.background = 'transparent');
  document.querySelectorAll('.owner-ring').forEach(el => {
    el.style.borderColor = 'transparent';
    el.style.boxShadow = 'none';
  });
  // Apply
  G.players.forEach(p => {
    p.props.forEach(sid => {
      const ob = document.getElementById('ob' + sid);
      if (ob) ob.style.background = p.color;
      const or = document.getElementById('or' + sid);
      if (or) {
        or.style.borderColor = p.color;
        or.style.boxShadow = `inset 0 0 8px ${p.color}44, 0 0 4px ${p.color}66`;
      }
    });
  });
}

function setTurnLabel() {
  const p = G.players[G.cur];
  document.getElementById('turnLabel').innerHTML =
    `<span style="color:${p.color};text-shadow:0 0 8px ${p.color}">●</span> ${p.name}'s Turn`;
}

function updateRollBtn() {
  document.getElementById('rollBtn').disabled = G.rolled;
}

function msg(text) {
  document.getElementById('msg-bar').textContent = text;
}

// ---- DICE ----
const FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

function rollDice() {
  if (G.rolled) return;
  G.rolled = true;
  updateRollBtn();
  closePropCard();

  const d1el = document.getElementById('d1');
  const d2el = document.getElementById('d2');
  d1el.classList.add('spinning');
  d2el.classList.add('spinning');

  let ticks = 0;
  const iv = setInterval(() => {
    d1el.textContent = FACES[Math.floor(Math.random()*6)];
    d2el.textContent = FACES[Math.floor(Math.random()*6)];
    if (++ticks >= 14) {
      clearInterval(iv);
      if (socket) {
        // Server rolls the dice and sends dice-rolled event
        socket.emit('roll-dice');
        // dice display updated when server responds
      } else {
        d1el.classList.remove('spinning');
        d2el.classList.remove('spinning');
        const v1 = Math.ceil(Math.random()*6);
        const v2 = Math.ceil(Math.random()*6);
        d1el.textContent = FACES[v1-1];
        d2el.textContent = FACES[v2-1];
        doMove(v1 + v2);
      }
    }
  }, 55);
}

// ---- MOVEMENT (step-by-step animated) ----
function doMove(steps) {
  const p = G.players[G.cur];
  const oldPos = p.pos;
  const newPos = (oldPos + steps) % TOTAL_SQ;
  const passedStart = oldPos + steps >= TOTAL_SQ && newPos !== 0;

  if (passedStart) {
    p.money += 1500;
    msg(`${p.name} passed START! +₹1,500 💰`);
  }

  // Animate one step at a time
  let step = 0;
  function next() {
    step++;
    p.pos = (oldPos + step) % TOTAL_SQ;
    renderTokens();
    flashTile(p.pos);
    if (step < steps) {
      setTimeout(next, 120);
    } else {
      renderPanel();
      setTimeout(() => landOn(p), 250);
    }
  }
  next();
}

function flashTile(sqId) {
  const el = document.querySelector(`[data-sq="${sqId}"]`);
  if (!el) return;
  el.style.outline = '3px solid #FFD600';
  el.style.outlineOffset = '-2px';
  el.style.zIndex = '30';
  el.style.transition = 'outline .1s';
  setTimeout(() => {
    el.style.outline = '';
    el.style.outlineOffset = '';
    el.style.zIndex = '';
  }, 300);
}

// ---- SQUARE EFFECTS ----
function landOn(p) {
  const sq = SQUARES[p.pos];
  msg(`${p.name} landed on ${sq.name}`);

  switch (sq.type) {
    case 'corner': {
      const CFEES = {
        0:{collect:true, amount:1500,icon:'🟢',label:'Landed on START!',desc:'Collect ₹1,500 bonus!'},
        9:{collect:false,amount:300, icon:'🏠',label:'REST HOUSE',desc:'Pay ₹300 resting charges.'},
        19:{collect:false,amount:100,icon:'🎰',label:'CLUB Entry Fee', desc:'Pay ₹100 club admission.'},
        28:{collect:false,amount:500,icon:'⛓️',label:'JAIL Fine!',     desc:'Pay ₹500 bail fee.'}
      };
      const cf = CFEES[sq.id];
      if (cf) {
        if (cf.collect) {
          p.money += cf.amount;
          renderPanel();
          showEvent(`${cf.icon} ${cf.label}`, cf.desc, [{label:'Collect ₹'+cf.amount.toLocaleString(),primary:true,fn:endTurn}]);
        } else {
          const actual = Math.min(p.money, cf.amount);
          p.money = Math.max(0, p.money - cf.amount);
          renderPanel();
          showEvent(`${cf.icon} ${cf.label}`, `${p.name} pays ₹${actual.toLocaleString()}. ${cf.desc}`, [
            {label:'Pay ₹'+actual.toLocaleString(),primary:true,fn:()=>{checkBankruptcy(p);endTurn();}}
          ]);
        }
      } else {endTurn();}
      break;
    }
    case 'tax':
      p.money = Math.max(0, p.money - sq.amount);
      renderPanel();
      showEvent(`💸 ${sq.name}!`, `${p.name} pays ₹${sq.amount.toLocaleString()}.`, [{label:'OK',primary:true,fn:endTurn}]);
      break;

    case 'chance':
      drawCard(CHANCE_CARDS, p);
      break;
    case 'chest':
      drawCard(CHEST_CARDS, p);
      break;

    case 'property':
    case 'transport':
    case 'utility': {
      const ownerId = G.ownership[sq.id];
      if (ownerId === undefined) {
        if (p.money >= sq.price) {
          showEvent(`🏙️ ${sq.name}`,
            `Buy for ₹${sq.price.toLocaleString()}?\nBalance: ₹${p.money.toLocaleString()}`,
            [
              {label:`🏠 Buy ₹${sq.price.toLocaleString()}`,primary:true,fn:()=>{buyProp(p,sq);endTurn();}},
              {label:'Skip',primary:false,fn:endTurn}
            ]);
        } else {
          msg(`${p.name} can't afford ${sq.name} (₹${sq.price}).`);
          endTurn();
        }
      } else if (ownerId === p.id) {
        // Player landed on their OWN property – offer one build action
        if (sq.type === 'property') {
          const b = G.buildings[sq.id];
          const houses = b ? b.houses : 0;
          const hasHotel = b && b.hotel;
          if (hasHotel) {
            // Already max – just safe
            msg(`${p.name} owns ${sq.name} with Hotel. Safe! ✅`);
            showEvent(`🏢 ${sq.name}`, `${p.name} landed on their own property.\nAlready has a 🏢 Hotel – maximum level!`, [
              {label:'OK ✅', primary:true, fn:endTurn}
            ]);
          } else if (houses < MAX_HOUSES) {
            // Offer to build one house
            const canBuild = p.money >= HOUSE_COST;
            const icon = LANDMARKS[sq.id] || '🏙️';
            showEvent(
              `${icon} ${sq.name} – Your Property!`,
              `You landed here! Build a house?\n🏠 ${houses}/4 houses built.\nCost: ₹${HOUSE_COST.toLocaleString()} | Balance: ₹${p.money.toLocaleString()}`,
              [
                {label: canBuild ? `🏠 Build House (₹${HOUSE_COST.toLocaleString()})` : '❌ Not enough money', primary:true,
                  fn: () => { if (canBuild) { addHouse(sq.id); } endTurn(); }},
                {label:'Skip', primary:false, fn:endTurn}
              ]
            );
          } else {
            // 4 houses – offer hotel upgrade
            const canHotel = p.money >= HOTEL_COST;
            const icon = LANDMARKS[sq.id] || '🏙️';
            showEvent(
              `${icon} ${sq.name} – Upgrade Available!`,
              `4 houses built! Upgrade to Hotel?\n🏢 Hotel gives maximum rent!\nCost: ₹${HOTEL_COST.toLocaleString()} | Balance: ₹${p.money.toLocaleString()}`,
              [
                {label: canHotel ? `🏢 Build Hotel (₹${HOTEL_COST.toLocaleString()})` : '❌ Not enough money', primary:true,
                  fn: () => { if (canHotel) { addHotel(sq.id); } endTurn(); }},
                {label:'Skip', primary:false, fn:endTurn}
              ]
            );
          }
        } else {
          msg(`${p.name} owns ${sq.name}. Safe! ✅`);
          endTurn();
        }
      } else {
        const owner = G.players[ownerId];
        const rent = calcRent(sq);
        const paid = Math.min(p.money, rent);
        p.money = Math.max(0, p.money - rent);
        owner.money += paid;
        renderPanel();
        showEvent(`💸 Rent Due!`,
          `${p.name} pays ₹${paid.toLocaleString()} to ${owner.name} for ${sq.name}.`,
          [{label:'OK',primary:true,fn:()=>{checkBankruptcy(p);endTurn();}}]);
      }
      break;
    }
    default: endTurn();
  }
}

function calcRent(sq) {
  const b = G.buildings[sq.id];
  if (!b || sq.type !== 'property') return Array.isArray(sq.rent) ? sq.rent[0] : sq.rent;
  if (b.hotel) return Array.isArray(sq.rent) ? sq.rent[sq.rent.length-1] : sq.rent;
  const idx = Math.min(b.houses, sq.rent.length - 1);
  return sq.rent[idx];
}

function buyProp(p, sq) {
  p.money -= sq.price;
  p.props.push(sq.id);
  G.ownership[sq.id] = p.id;
  msg(`${p.name} bought ${sq.name}! 🎉`);
  renderPanel();
  renderOwnership();
  _broadcast();
}

function drawCard(deck, p) {
  const card = deck[Math.floor(Math.random() * deck.length)];
  const result = card.fn(p, G.players);
  renderTokens();
  renderPanel();
  _broadcast();
  // Determine if chance or chest
  const isChance = deck === CHANCE_CARDS;
  showCardAnim(isChance, card.txt, result, endTurn);
}

function showCardAnim(isChance, title, result, cb) {
  const box  = document.getElementById('canimBox');
  const type = document.getElementById('canimType');
  const emoji= document.getElementById('canimEmoji');
  const tit  = document.getElementById('canimTitle');
  const res  = document.getElementById('canimResult');
  const ok   = document.getElementById('canimOk');
  if (isChance) {
    box.style.background = 'linear-gradient(145deg,#FF8F00,#FFD600)';
    box.style.color = '#1A237E';
    type.textContent = '🎴 CHANCE';
    emoji.textContent = '🎴';
    ok.style.background = 'linear-gradient(135deg,#1A237E,#3949AB)';
    ok.style.color = '#fff';
  } else {
    box.style.background = 'linear-gradient(145deg,#1B5E20,#43A047)';
    box.style.color = '#fff';
    type.textContent = '📦 COMMUNITY CHEST';
    emoji.textContent = '📦';
    ok.style.background = 'linear-gradient(135deg,#FFB300,#FFD600)';
    ok.style.color = '#111';
  }
  tit.textContent = title;
  res.textContent = result;
  ok.onclick = () => { closeCardAnim(); if(cb) cb(); };
  document.getElementById('cardAnim').classList.add('show');
}

function closeCardAnim() {
  document.getElementById('cardAnim').classList.remove('show');
}

function checkBankruptcy(p) {
  if (p.money <= 0) {
    p.bust = true;
    p.money = 0;
    p.props.forEach(sid => {
      G.ownership[sid] = undefined;
      delete G.buildings[sid];
    });
    p.props = [];
    renderAll();
    _broadcast();
    msg(`💀 ${p.name} is bankrupt!`);
    checkWin();
  }
}

function checkWin() {
  const alive = G.players.filter(p => !p.bust);
  if (alive.length === 1) {
    const w = alive[0];
    showEvent('🏆 WINNER & CHAMPION!',
      `${w.name} wins Business India!\n\nFinal Balance: ₹${w.money.toLocaleString()}\nProperties: ${w.props.length}`,
      [{label:'🎊 Play Again',primary:true,fn:()=>location.reload()}]);
  }
}

// ---- TURN ----
function endTurn() {
  let next = (G.cur + 1) % G.players.length;
  let loops = 0;
  while (G.players[next].bust && loops < G.players.length) {
    next = (next + 1) % G.players.length;
    loops++;
  }
  G.cur = next;
  G.rolled = false;
  renderAll();
  setTurnLabel();
  _broadcast();
  msg(`${G.players[G.cur].name}'s turn. Roll the dice! 🎲`);
}

// ---- PROPERTY CARD UI ----
function tileClick(sqId) {
  const sq = SQUARES[sqId];
  if (!sq || (sq.type !== 'property' && sq.type !== 'transport' && sq.type !== 'utility')) {
    closePropCard();
    return;
  }

  const card = document.getElementById('prop-card');
  const header = document.getElementById('pc-header');
  const ownerId = G.ownership[sqId];
  const owner = ownerId !== undefined ? G.players[ownerId] : null;

  // Header color = group color or tile color
  const hColor = sq.group || '#1A237E';
  header.style.background = `linear-gradient(145deg, ${hColor}, ${hColor}cc)`;

  document.getElementById('pc-landmark').textContent = LANDMARKS[sqId] || '🏙️';
  document.getElementById('pc-city').textContent = sq.name.toUpperCase();
  document.getElementById('pc-price').textContent = `₹${sq.price.toLocaleString()}`;

  // Rent rows
  const rentRows = document.getElementById('pc-rent-rows');
  rentRows.innerHTML = '';
  const b = G.buildings[sqId];

  if (sq.type === 'property' && Array.isArray(sq.rent)) {
    const labels = ['Base Rent','🏠 1 House','🏠🏠 2 Houses','🏠🏠🏠 3 Houses','🏠🏠🏠🏠 4 Houses'];
    sq.rent.slice(0, sq.rent.length - 1).forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'pc-rent-row';
      const active = (b && !b.hotel && b.houses === i) || (!b && i === 0);
      row.style.background = active ? '#e3f2ff' : (i%2===0?'#f5f5f5':'#fff');
      row.innerHTML = `<span class="rl">${labels[i]}</span><span class="rv">₹${r.toLocaleString()}</span>`;
      rentRows.appendChild(row);
    });
    // Hotel row
    const hotelRent = sq.rent[sq.rent.length - 1];
    const hRow = document.createElement('div');
    hRow.className = 'pc-rent-row pc-hotel-row';
    if (b && b.hotel) hRow.style.outline = '2px solid #fff';
    hRow.innerHTML = `<span class="rl">🏢 Hotel</span><span class="rv">₹${hotelRent.toLocaleString()}</span>`;
    rentRows.appendChild(hRow);
  } else if (Array.isArray(sq.rent)) {
    const transportLabels = ['Own 1','Own 2','Own 3','Own 4'];
    sq.rent.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'pc-rent-row';
      row.innerHTML = `<span class="rl">${transportLabels[i]||'Rent'}</span><span class="rv">₹${r.toLocaleString()}</span>`;
      rentRows.appendChild(row);
    });
  } else {
    const row = document.createElement('div');
    row.className = 'pc-rent-row';
    row.innerHTML = `<span class="rl">Rent</span><span class="rv">₹${(sq.rent||0).toLocaleString()}</span>`;
    rentRows.appendChild(row);
  }

  // Costs
  const costs = document.getElementById('pc-costs');
  if (sq.type === 'property') {
    costs.innerHTML = `
      <div class="pc-cost-item"><span class="pc-cost-val">₹${HOUSE_COST.toLocaleString()}</span>🏠 House</div>
      <div class="pc-cost-item"><span class="pc-cost-val">₹${HOTEL_COST.toLocaleString()}</span>🏢 Hotel</div>
      <div class="pc-cost-item"><span class="pc-cost-val" style="color:${owner?owner.color:'#999'}">${owner?owner.name:'Unowned'}</span>👤 Owner</div>`;
  } else {
    costs.innerHTML = `<div class="pc-cost-item"><span class="pc-cost-val" style="color:${owner?owner.color:'#999'}">${owner?owner.name:'Unowned'}</span>👤 Owner</div>`;
  }

  // Build buttons – removed. Building only allowed by landing on the tile.
  // Show a small note if it's the current player's own property
  const buildBtns = document.getElementById('pc-build-btns');
  buildBtns.innerHTML = '';
  if (sq.type === 'property' && G.ownership[sqId] === G.cur) {
    const b2 = G.buildings[sqId];
    const houses = b2 ? b2.houses : 0;
    const hasHotel = b2 && b2.hotel;
    const note = document.createElement('div');
    note.style.cssText = 'font-size:.48rem;color:#aac;text-align:center;padding:6px 4px;line-height:1.5;border-top:1px solid #eee;margin-top:4px';
    if (hasHotel) {
      note.innerHTML = '🏢 Hotel built — max level!<br><span style="color:#888">Land here again to manage.</span>';
    } else {
      note.innerHTML = `🏠 ${houses}/${MAX_HOUSES} houses built<br><span style="color:#888">Land here again to build +1 house</span>`;
    }
    buildBtns.appendChild(note);
  }

  card.style.display = 'block';
}

function closePropCard() {
  document.getElementById('prop-card').style.display = 'none';
}

function addHouse(sqId) {
  const cur = G.players[G.cur];
  if (!G.buildings[sqId]) G.buildings[sqId] = {houses:0, hotel:false};
  if (G.buildings[sqId].houses < MAX_HOUSES && !G.buildings[sqId].hotel) {
    cur.money -= HOUSE_COST;
    G.buildings[sqId].houses++;
    renderPanel();
    renderBuildings();
    _broadcast();
    msg(`🏠 ${cur.name} built a house on ${SQUARES[sqId].name}!`);
  }
}

function addHotel(sqId) {
  const cur = G.players[G.cur];
  if (!G.buildings[sqId]) G.buildings[sqId] = {houses:0, hotel:false};
  if (G.buildings[sqId].houses >= MAX_HOUSES && !G.buildings[sqId].hotel) {
    cur.money -= HOTEL_COST;
    G.buildings[sqId].hotel = true;
    G.buildings[sqId].houses = 0;
    renderPanel();
    renderBuildings();
    _broadcast();
    msg(`🏢 ${cur.name} built a hotel on ${SQUARES[sqId].name}!`);
  }
}

// ---- EVENT MODAL ----
function showEvent(title, body, buttons) {
  document.getElementById('evtTitle').textContent = title;
  document.getElementById('evtBody').textContent = body;
  const btnRow = document.getElementById('evtBtns');
  btnRow.innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'ebtn ' + (b.primary ? 'primary' : 'secondary');
    btn.textContent = b.label;
    btn.onclick = () => {
      document.getElementById('evtModal').classList.remove('show');
      if (b.fn) b.fn();
    };
    btnRow.appendChild(btn);
  });
  document.getElementById('evtModal').classList.add('show');
}
