// ============================================================
// BUSINESS INDIA – PRODUCTION SERVER  v4.0
// Node.js + Express + Socket.io
// Features: Chat, Avatars, Trades, Full Game Logic
// ============================================================
'use strict';
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const path     = require('path');
const crypto   = require('crypto');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ── CONSTANTS ──────────────────────────────────────────────
const COLORS      = ['#E53935','#1E88E5','#43A047','#FFB300','#8E24AA','#FB8C00','#00ACC1','#D81B60'];
const START_MONEY = 1500;
const HOUSE_COST  = 1000;
const HOTEL_COST  = 2000;
const MAX_HOUSES  = 4;
const TOTAL_SQ    = 37;
const TURN_SECS   = 90;
const MAX_CHAT    = 50;
const MAX_MSG_LEN = 200;

const AVATARS = {
  businessman: '👔',
  robot:       '🤖',
  king:        '👑',
  queen:       '👸',
  tiger:       '🐯',
  lion:        '🦁',
  ninja:       '🥷',
  astronaut:   '🧑‍🚀'
};

const SQUARES = [
  {id:0, name:'START',          type:'corner'},
  {id:1, name:'Goa',            type:'property',price:4000, rent:[400,800,1600,2400,3200],  group:'#4CAF50'},
  {id:2, name:'Motor Boat',     type:'transport',price:5500,rent:[500,1000,1500,2000]},
  {id:3, name:'Cochin',         type:'property',price:3000, rent:[300,600,1200,1800,2400],  group:'#4CAF50'},
  {id:4, name:'Mysore',         type:'property',price:2500, rent:[250,500,1000,1500,2000],  group:'#4CAF50'},
  {id:5, name:'Wealth Tax',     type:'tax',     amount:750},
  {id:6, name:'Bengaluru',      type:'property',price:4000, rent:[400,800,1600,2400,3200],  group:'#9C27B0'},
  {id:7, name:'Community Chest',type:'chest'},
  {id:8, name:'Chennai',        type:'property',price:7000, rent:[700,1400,2800,4200,5600], group:'#9C27B0'},
  {id:9, name:'REST HOUSE',     type:'corner'},
  {id:10,name:'Hyderabad',      type:'property',price:3500, rent:[350,700,1400,2100,2800],  group:'#F44336'},
  {id:11,name:'Kolkata',        type:'property',price:6500, rent:[650,1300,2600,3900,5200], group:'#F44336'},
  {id:12,name:'Air India',      type:'transport',price:10500,rent:[1000,2000,3000,4000]},
  {id:13,name:'Darjeeling',     type:'property',price:2500, rent:[250,500,1000,1500,2000],  group:'#00BCD4'},
  {id:14,name:'Patna',          type:'property',price:2000, rent:[200,400,800,1200,1600],   group:'#00BCD4'},
  {id:15,name:'Kanpur',         type:'property',price:4000, rent:[400,800,1600,2400,3200],  group:'#00BCD4'},
  {id:16,name:'Chance',         type:'chance'},
  {id:17,name:'Agra',           type:'property',price:2500, rent:[250,500,1000,1500,2000],  group:'#FF9800'},
  {id:18,name:'Srinagar',       type:'property',price:5000, rent:[500,1000,2000,3000,4000], group:'#FF9800'},
  {id:19,name:'CLUB',           type:'corner'},
  {id:20,name:'Amritsar',       type:'property',price:3300, rent:[330,660,1320,1980,2640],  group:'#3F51B5'},
  {id:21,name:'Shimla',         type:'property',price:3500, rent:[350,700,1400,2100,2800],  group:'#3F51B5'},
  {id:22,name:'BEST',           type:'property',price:2200, rent:[220,440,880,1320,1760],   group:'#3F51B5'},
  {id:23,name:'Electric Co.',   type:'utility', price:2500, rent:[150,300]},
  {id:24,name:'Chandigarh',     type:'property',price:2500, rent:[250,500,1000,1500,2000],  group:'#795548'},
  {id:25,name:'Community Chest',type:'chest'},
  {id:26,name:'Lucknow',        type:'property',price:3000, rent:[300,600,1200,1800,2400],  group:'#795548'},
  {id:27,name:'Delhi',          type:'property',price:6000, rent:[600,1200,2400,3600,4800], group:'#795548'},
  {id:28,name:'JAIL',           type:'corner'},
  {id:29,name:'Jaipur',         type:'property',price:3000, rent:[300,600,1200,1800,2400],  group:'#E91E63'},
  {id:30,name:'Chance',         type:'chance'},
  {id:31,name:'Indore',         type:'property',price:1500, rent:[150,300,600,900,1200],    group:'#E91E63'},
  {id:32,name:'Income Tax',     type:'tax',     amount:1000},
  {id:33,name:'Ahmedabad',      type:'property',price:4000, rent:[400,800,1600,2400,3200],  group:'#FF5722'},
  {id:34,name:'Railways',       type:'transport',price:9500,rent:[2500,3500,4500,5500]},
  {id:35,name:'Water Works',    type:'utility', price:3200, rent:[150,300]},
  {id:36,name:'Mumbai',         type:'property',price:8500, rent:[850,1700,3400,5100,6800], group:'#FF5722'}
];

// ── CARD DEFINITIONS ─────────────────────────────────────────
const CHANCE_CARDS = [
  {id:'lottery',  txt:'🎰 Lottery Prize!',          type:'gain',    amount:2500},
  {id:'crossword',txt:'🏆 Crossword Champion!',       type:'gain',    amount:1000},
  {id:'jackpot',  txt:'🎲 Jackpot!',                 type:'gain',    amount:2000},
  {id:'stocks',   txt:'📈 Stock Market Profit!',      type:'gain',    amount:3000},
  {id:'taxref',   txt:'💰 Tax Refund!',               type:'gain',    amount:2000},
  {id:'export',   txt:'🏅 Export Excellence Award!',  type:'gain',    amount:3000},
  {id:'advance',  txt:'🚀 Advance to START!',         type:'advance', dest:0, bonus:1500},
  {id:'fine',     txt:'💸 Market Regulation Fine!',   type:'lose',    amount:500},
  {id:'repairs',  txt:'🏠 Emergency House Repairs!',  type:'lose',    amount:1500},
  {id:'fire',     txt:'🔥 Godown Fire Loss!',         type:'lose',    amount:3000}
];

const CHEST_CARDS = [
  {id:'birthday', txt:'🎂 Birthday Celebrations!',   type:'birthday',amount:500},
  {id:'taxref2',  txt:'💰 Income Tax Refund!',        type:'gain',    amount:100},
  {id:'hotel',    txt:'🏨 Hotel Revenue Bonus!',      type:'gain',    amount:1500},
  {id:'wedding',  txt:'💒 Marriage Celebration!',     type:'gain',    amount:2000},
  {id:'bonus',    txt:'🏆 Performance Bonus!',        type:'gain',    amount:2500},
  {id:'jail',     txt:'🔒 Go to Jail!',               type:'jail'},
  {id:'medical',  txt:'🏥 Medical Emergency!',        type:'lose',    amount:1000},
  {id:'insurance',txt:'💊 Insurance Premium Due!',    type:'lose',    amount:1500}
];

// ── CHAT HELPER ──────────────────────────────────────────────
function sanitize(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;')
    .slice(0, MAX_MSG_LEN);
}

function addChat(room, msg) {
  if (!room.chatMessages) room.chatMessages = [];
  room.chatMessages.push(msg);
  if (room.chatMessages.length > MAX_CHAT) room.chatMessages.shift();
}

function sysMsg(room, text) {
  const msg = { type:'system', text, time: Date.now() };
  addChat(room, msg);
  return msg;
}

function applyCard(card, pidx, G) {
  const p = G.players[pidx];
  let result = card.txt;
  switch (card.type) {
    case 'gain':
      p.money += card.amount;
      result = `${card.txt} → +₹${card.amount.toLocaleString()}`;
      break;
    case 'lose':
      p.money = Math.max(0, p.money - card.amount);
      result = `${card.txt} → -₹${card.amount.toLocaleString()}`;
      if (p.money <= 0) bankruptPlayer(p, G);
      break;
    case 'advance':
      p.pos = card.dest;
      p.inJail = false;
      p.money += (card.bonus || 0);
      result = `${card.txt} → Moved to START! +₹${card.bonus}`;
      break;
    case 'birthday': {
      let total = 0;
      G.players.forEach((o, i) => {
        if (i !== pidx && !o.bust) {
          const pay = Math.min(o.money, card.amount);
          o.money = Math.max(0, o.money - card.amount);
          total += pay;
        }
      });
      p.money += total;
      result = `${card.txt} → Collected ₹${total} in gifts!`;
      break;
    }
    case 'jail':
      p.pos = 28;
      p.inJail = true;
      result = `${card.txt} → Sent to JAIL! ⛓️`;
      break;
  }
  return result;
}

// ── GAME HELPERS ─────────────────────────────────────────────
function calcRent(G, sq) {
  const b = G.buildings[sq.id];
  if (!b || sq.type !== 'property') return Array.isArray(sq.rent) ? sq.rent[0] : (sq.rent || 0);
  if (b.hotel) return Array.isArray(sq.rent) ? sq.rent[sq.rent.length - 1] : (sq.rent || 0);
  return sq.rent[Math.min(b.houses, sq.rent.length - 1)];
}

function bankruptPlayer(p, G) {
  p.bust = true;
  p.money = 0;
  p.props.forEach(sid => { G.ownership[sid] = undefined; delete G.buildings[sid]; });
  p.props = [];
}

function processLanding(G, p) {
  const sq = SQUARES[p.pos];
  switch (sq.type) {
    case 'property':
    case 'transport':
    case 'utility': {
      const ownerId = G.ownership[sq.id];
      if (ownerId === undefined)
        return p.money >= sq.price ? { action:'buy', sqId:sq.id, price:sq.price } : { action:'cannot_buy', sqId:sq.id };
      if (ownerId === p.id) return { action:'build', sqId:sq.id };
      const rent = calcRent(G, sq);
      const paid = Math.min(p.money, rent);
      p.money = Math.max(0, p.money - rent);
      G.players[ownerId].money += paid;
      if (p.money <= 0) bankruptPlayer(p, G);
      return { action:'rent', ownerName:G.players[ownerId].name, paid };
    }
    case 'tax':
      p.money = Math.max(0, p.money - sq.amount);
      if (p.money <= 0) bankruptPlayer(p, G);
      return { action:'tax', name:sq.name, amount:sq.amount };
    case 'corner':
      if (sq.id === 0)  { p.money += 1500; return { action:'start_collect' }; }
      if (sq.id === 9)  { p.money = Math.max(0, p.money - 300); return { action:'rest',  amount:300 }; }
      if (sq.id === 19) { p.money = Math.max(0, p.money - 100); return { action:'club',  amount:100 }; }
      if (sq.id === 28) { p.inJail = true; return { action:'jail' }; }
      return { action:'none' };
    case 'chance': {
      const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
      const result = applyCard(card, p.id, G);
      return { action:'card', deck:'chance', card: card.txt, result };
    }
    case 'chest': {
      const card = CHEST_CARDS[Math.floor(Math.random() * CHEST_CARDS.length)];
      const result = applyCard(card, p.id, G);
      return { action:'card', deck:'chest', card: card.txt, result };
    }
    default: return { action:'none' };
  }
}

function checkWin(G) {
  const alive = G.players.filter(p => !p.bust);
  return alive.length === 1 ? alive[0] : null;
}

function advanceTurn(G) {
  let next = (G.cur + 1) % G.players.length;
  let loops = 0;
  while (G.players[next].bust && loops < G.players.length) { next = (next + 1) % G.players.length; loops++; }
  G.cur = next;
  G.rolled = false;
}

function genRoomId()  { return 'BI-' + crypto.randomBytes(2).toString('hex').toUpperCase(); }
function genSession() { return crypto.randomBytes(16).toString('hex'); }
function genTradeId() { return crypto.randomBytes(8).toString('hex'); }

// ── TURN TIMER ───────────────────────────────────────────────
function startTimer(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  clearTimer(roomId);
  room.state.turnDeadline = Date.now() + TURN_SECS * 1000;
  room._timer = setTimeout(() => {
    if (!rooms[roomId]?.state) return;
    console.log(`[auto end-turn] room ${roomId}`);
    advanceTurn(rooms[roomId].state);
    rooms[roomId].state.turnDeadline = Date.now() + TURN_SECS * 1000;
    io.to(roomId).emit('state-update', rooms[roomId].state);
    startTimer(roomId);
  }, TURN_SECS * 1000);
}
function clearTimer(roomId) {
  if (rooms[roomId]?._timer) { clearTimeout(rooms[roomId]._timer); rooms[roomId]._timer = null; }
}

// ── ROOM STATE ───────────────────────────────────────────────
const rooms = {};

// ── SOCKET.IO ────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // ── RECONNECT ──
  socket.on('reconnect-room', ({ roomId, sessionId }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error', { msg: 'Room expired or not found.' });
    const session = room.sessions?.[sessionId];
    if (!session) return socket.emit('error', { msg: 'Session not found. Join as new player.' });

    const pidx   = session.playerIdx;
    const oldSid = room.players[pidx]?.socketId;

    if (oldSid && room.socketMap[oldSid] !== undefined) delete room.socketMap[oldSid];
    room.socketMap[socket.id] = pidx;
    room.players[pidx].socketId     = socket.id;
    room.players[pidx].disconnected = false;
    socket.roomId = roomId;
    socket.join(roomId);

    socket.emit('reconnected', {
      roomId,
      playerIdx: pidx,
      state:     room.state,
      lobbyPlayers: room.players,
      isHost:    room.hostSocketId === oldSid ? true : (room.hostSocketId === socket.id),
      sessionId,
      chatHistory: room.chatMessages || []
    });
    if (room.hostSocketId === oldSid) room.hostSocketId = socket.id;

    const m = sysMsg(room, `🔄 ${room.players[pidx].name} reconnected.`);
    io.to(roomId).emit('receiveMessage', m);
    io.to(roomId).emit('player-reconnected', { name: room.players[pidx].name });
    console.log(`[reconnect] ${room.players[pidx].name} rejoined ${roomId}`);
  });

  // ── CREATE ROOM ──
  socket.on('create-room', ({ name, avatar }) => {
    if (!name?.trim()) return socket.emit('error', { msg: 'Enter your name first.' });
    const av = AVATARS[avatar] ? avatar : 'businessman';
    const roomId    = genRoomId();
    const sessionId = genSession();
    rooms[roomId] = {
      hostSocketId: socket.id,
      state: null,
      socketMap: { [socket.id]: 0 },
      sessions: { [sessionId]: { playerIdx: 0, name } },
      chatMessages: [],
      activeTrades: {},
      players: [{
        socketId: socket.id, name, color: COLORS[0],
        avatar: av, ready: false, isHost: true, disconnected: false
      }]
    };
    socket.roomId = roomId;
    socket.join(roomId);
    socket.emit('room-created', { roomId, sessionId });
    io.to(roomId).emit('lobby-update', rooms[roomId].players);
    const m = sysMsg(rooms[roomId], `👋 ${name} created this room.`);
    io.to(roomId).emit('receiveMessage', m);
  });

  // ── JOIN ROOM ──
  socket.on('join-room', ({ roomId, name, avatar }) => {
    const rid  = roomId?.toUpperCase();
    const room = rooms[rid];
    if (!room)                   return socket.emit('error', { msg: 'Room not found. Check the Room ID.' });
    if (room.state)              return socket.emit('error', { msg: 'Game already in progress.' });
    if (room.players.length >= 8) return socket.emit('error', { msg: 'Room is full (max 8 players).' });
    if (!name?.trim())           return socket.emit('error', { msg: 'Enter your name first.' });

    const av        = AVATARS[avatar] ? avatar : 'businessman';
    const sessionId = genSession();
    const idx       = room.players.length;
    room.players.push({
      socketId: socket.id, name, color: COLORS[idx],
      avatar: av, ready: false, isHost: false, disconnected: false
    });
    room.socketMap[socket.id] = idx;
    room.sessions[sessionId]  = { playerIdx: idx, name };
    socket.roomId = rid;
    socket.join(rid);
    socket.emit('room-joined', { roomId: rid, sessionId });
    io.to(rid).emit('lobby-update', room.players);
    const m = sysMsg(room, `👋 ${name} joined the room.`);
    io.to(rid).emit('receiveMessage', m);
  });

  // ── GET MY INDEX ──
  socket.on('get-my-idx', () => {
    const room = rooms[socket.roomId];
    if (!room) return;
    const idx = room.socketMap[socket.id];
    if (idx !== undefined) socket.emit('my-idx', { idx });
  });

  // ── PLAYER READY ──
  socket.on('player-ready', ({ ready }) => {
    const room = rooms[socket.roomId];
    if (!room) return;
    const idx = room.socketMap[socket.id];
    if (idx === undefined) return;
    room.players[idx].ready = !!ready;
    io.to(socket.roomId).emit('lobby-update', room.players);
  });

  // ── START GAME ──
  socket.on('start-game', () => {
    const room = rooms[socket.roomId];
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.players.length < 2) return socket.emit('error', { msg: 'Need at least 2 players to start.' });
    room.state = {
      players: room.players.map((lp, i) => ({
        id: i, name: lp.name, color: lp.color, avatar: lp.avatar,
        money: START_MONEY, pos: 0, props: [], bust: false, inJail: false
      })),
      cur: 0, rolled: false, buildings: {}, ownership: {},
      cardLog: [],
      turnDeadline: Date.now() + TURN_SECS * 1000
    };
    io.to(socket.roomId).emit('game-started', room.state);
    const m = sysMsg(room, '🎲 Game started! Good luck everyone!');
    io.to(socket.roomId).emit('receiveMessage', m);
    startTimer(socket.roomId);
  });

  // ── ROLL DICE ──
  socket.on('roll-dice', () => {
    const room = rooms[socket.roomId];
    if (!room?.state) return;
    const G   = room.state;
    const idx = room.socketMap[socket.id];
    if (idx !== G.cur) return socket.emit('error', { msg: "It's not your turn." });
    if (G.rolled)      return socket.emit('error', { msg: 'You already rolled this turn.' });

    clearTimer(socket.roomId);
    G.rolled = true;
    const v1 = Math.ceil(Math.random() * 6);
    const v2 = Math.ceil(Math.random() * 6);
    const steps  = v1 + v2;
    const p      = G.players[G.cur];
    const oldPos = p.pos;

    p.pos = (oldPos + steps) % TOTAL_SQ;
    if (oldPos + steps >= TOTAL_SQ && p.pos !== 0) { p.money += 1500; }

    const result = processLanding(G, p);
    const winner = checkWin(G);

    if (result.action === 'card') {
      if (!G.cardLog) G.cardLog = [];
      G.cardLog.unshift({ deck: result.deck, card: result.card, result: result.result, player: p.name });
      if (G.cardLog.length > 5) G.cardLog.pop();
    }

    io.to(socket.roomId).emit('dice-rolled', { v1, v2, steps, G, result, winner: winner?.name || null });

    if (winner) {
      clearTimer(socket.roomId);
      const m = sysMsg(room, `🏆 ${winner.name} wins the game!`);
      io.to(socket.roomId).emit('receiveMessage', m);
      const capturedRoomId = socket.roomId;
      setTimeout(() => { delete rooms[capturedRoomId]; console.log(`[room purged] ${capturedRoomId}`); }, 5000);
      return;
    }

    if (result.action !== 'buy') {
      const capturedRoomId = socket.roomId;
      setTimeout(() => {
        const r = rooms[capturedRoomId];
        if (!r?.state) return;
        advanceTurn(r.state);
        r.state.turnDeadline = Date.now() + TURN_SECS * 1000;
        io.to(capturedRoomId).emit('turn-changed', r.state);
        startTimer(capturedRoomId);
      }, 2500);
    }
  });

  // ── BUY PROPERTY ──
  socket.on('buy-property', ({ sqId }) => {
    const roomId = socket.roomId;
    const room   = rooms[roomId];
    if (!room?.state) return;
    const G = room.state, idx = room.socketMap[socket.id];
    if (idx !== G.cur) return socket.emit('error', { msg: 'Not your turn.' });
    const sq = SQUARES[sqId], p = G.players[G.cur];
    if (!sq || G.ownership[sqId] !== undefined || p.money < sq.price)
      return socket.emit('error', { msg: 'Cannot buy this property.' });
    const buyerName = p.name;
    p.money -= sq.price;
    p.props.push(sqId);
    G.ownership[sqId] = idx;
    clearTimer(roomId);
    advanceTurn(G);
    G.turnDeadline = Date.now() + TURN_SECS * 1000;
    io.to(roomId).emit('property-bought', { playerName: buyerName, sqId, G });
    const m = sysMsg(room, `🏙️ ${buyerName} bought ${SQUARES[sqId].name}!`);
    io.to(roomId).emit('receiveMessage', m);
    startTimer(roomId);
  });

  // ── SKIP BUY ──
  socket.on('skip-buy', () => {
    const roomId = socket.roomId;
    const room   = rooms[roomId];
    if (!room?.state) return;
    const G = room.state, idx = room.socketMap[socket.id];
    if (idx !== G.cur) return;
    clearTimer(roomId);
    advanceTurn(G);
    G.turnDeadline = Date.now() + TURN_SECS * 1000;
    io.to(roomId).emit('turn-changed', G);
    startTimer(roomId);
  });

  // ── BUILD HOUSE ──
  socket.on('build-house', ({ sqId }) => {
    const room = rooms[socket.roomId];
    if (!room?.state) return;
    const G = room.state, idx = room.socketMap[socket.id];
    if (idx !== G.cur || G.ownership[sqId] !== G.cur)
      return socket.emit('error', { msg: 'Invalid build action.' });
    if (!G.buildings[sqId]) G.buildings[sqId] = { houses:0, hotel:false };
    const b = G.buildings[sqId], p = G.players[G.cur];
    if (b.houses >= MAX_HOUSES || b.hotel || p.money < HOUSE_COST)
      return socket.emit('error', { msg: 'Cannot build house here.' });
    p.money -= HOUSE_COST;
    b.houses++;
    io.to(socket.roomId).emit('state-update', G);
  });

  // ── BUILD HOTEL ──
  socket.on('build-hotel', ({ sqId }) => {
    const room = rooms[socket.roomId];
    if (!room?.state) return;
    const G = room.state, idx = room.socketMap[socket.id];
    if (idx !== G.cur || G.ownership[sqId] !== G.cur)
      return socket.emit('error', { msg: 'Invalid build action.' });
    if (!G.buildings[sqId]) G.buildings[sqId] = { houses:0, hotel:false };
    const b = G.buildings[sqId], p = G.players[G.cur];
    if (b.houses < MAX_HOUSES || b.hotel || p.money < HOTEL_COST)
      return socket.emit('error', { msg: 'Cannot build hotel here.' });
    p.money -= HOTEL_COST;
    b.hotel = true; b.houses = 0;
    io.to(socket.roomId).emit('state-update', G);
  });

  // ── END TURN (emergency) ──
  socket.on('end-turn', () => {
    const room = rooms[socket.roomId];
    if (!room?.state) return;
    const G = room.state, idx = room.socketMap[socket.id];
    const isCur  = idx === G.cur;
    const isHost = room.hostSocketId === socket.id;
    if (!isCur && !isHost) return;
    clearTimer(socket.roomId);
    advanceTurn(G);
    G.turnDeadline = Date.now() + TURN_SECS * 1000;
    io.to(socket.roomId).emit('turn-changed', G);
    startTimer(socket.roomId);
  });

  // ── CHAT ─────────────────────────────────────────────────
  socket.on('sendMessage', ({ text }) => {
    const room = rooms[socket.roomId];
    if (!room) return;
    const idx = room.socketMap[socket.id];
    if (idx === undefined) return;
    const clean = sanitize(text || '').trim();
    if (!clean) return;

    const player = room.players[idx];
    const msg = {
      type:   'player',
      sender: player.name,
      avatar: player.avatar,
      color:  player.color,
      text:   clean,
      time:   Date.now()
    };
    addChat(room, msg);
    io.to(socket.roomId).emit('receiveMessage', msg);
  });

  // ── TRADE: CREATE OFFER ─────────────────────────────────
  socket.on('createTrade', ({ targetIdx, offerProps, offerMoney, requestProps, requestMoney }) => {
    const room = rooms[socket.roomId];
    if (!room?.state) return socket.emit('error', { msg: 'Game not started.' });
    const G       = room.state;
    const fromIdx = room.socketMap[socket.id];
    if (fromIdx === undefined) return;
    if (fromIdx === targetIdx)    return socket.emit('error', { msg: 'Cannot trade with yourself.' });
    if (targetIdx >= G.players.length) return socket.emit('error', { msg: 'Invalid player.' });

    const from = G.players[fromIdx];
    const to   = G.players[targetIdx];
    if (from.bust || to.bust) return socket.emit('error', { msg: 'Cannot trade with/as bankrupt player.' });

    // Validate sender owns offered properties
    const oProps = (offerProps || []).filter(sid => from.props.includes(sid));
    // Validate receiver owns requested properties
    const rProps = (requestProps || []).filter(sid => to.props.includes(sid));

    const oMoney = Math.max(0, parseInt(offerMoney) || 0);
    const rMoney = Math.max(0, parseInt(requestMoney) || 0);

    if (oMoney > from.money) return socket.emit('error', { msg: 'Not enough funds to offer.' });

    // One active trade per pair
    const pairKey = [fromIdx, targetIdx].sort().join('-');
    if (room.activeTrades[pairKey]) return socket.emit('error', { msg: 'A trade is already pending between these players.' });

    const tradeId = genTradeId();
    const trade = {
      id: tradeId,
      fromIdx,
      targetIdx,
      offerProps:   oProps,
      offerMoney:   oMoney,
      requestProps: rProps,
      requestMoney: rMoney,
      pairKey
    };
    room.activeTrades[pairKey] = trade;

    // Send to target player
    const targetSocket = room.players[targetIdx]?.socketId;
    if (targetSocket) {
      io.to(targetSocket).emit('receiveTrade', {
        trade,
        fromName:  from.name,
        fromAvatar:from.avatar,
        fromColor: from.color,
        offerPropNames:   oProps.map(s => SQUARES[s]?.name || s),
        requestPropNames: rProps.map(s => SQUARES[s]?.name || s)
      });
    }
    socket.emit('tradeSent', { msg: `Trade offer sent to ${to.name}.` });
  });

  // ── TRADE: ACCEPT ───────────────────────────────────────
  socket.on('acceptTrade', ({ pairKey }) => {
    const room = rooms[socket.roomId];
    if (!room?.state) return;
    const G     = room.state;
    const trade = room.activeTrades[pairKey];
    if (!trade) return socket.emit('error', { msg: 'Trade not found or expired.' });

    const accepting = room.socketMap[socket.id];
    if (accepting !== trade.targetIdx) return socket.emit('error', { msg: 'Not your trade to accept.' });

    const from = G.players[trade.fromIdx];
    const to   = G.players[trade.targetIdx];

    // Re-validate
    if (trade.offerMoney > from.money) {
      delete room.activeTrades[pairKey];
      return socket.emit('error', { msg: 'Sender no longer has enough money.' });
    }
    if (trade.requestMoney > to.money) {
      delete room.activeTrades[pairKey];
      return socket.emit('error', { msg: "You don't have enough money." });
    }
    for (const sid of trade.offerProps) {
      if (!from.props.includes(sid)) { delete room.activeTrades[pairKey]; return socket.emit('error', { msg: 'Sender no longer owns offered property.' }); }
    }
    for (const sid of trade.requestProps) {
      if (!to.props.includes(sid)) { delete room.activeTrades[pairKey]; return socket.emit('error', { msg: 'You no longer own requested property.' }); }
    }

    // Execute transfer
    from.money -= trade.offerMoney;
    to.money   += trade.offerMoney;
    to.money   -= trade.requestMoney;
    from.money += trade.requestMoney;

    trade.offerProps.forEach(sid => {
      from.props = from.props.filter(s => s !== sid);
      to.props.push(sid);
      G.ownership[sid] = trade.targetIdx;
    });
    trade.requestProps.forEach(sid => {
      to.props = to.props.filter(s => s !== sid);
      from.props.push(sid);
      G.ownership[sid] = trade.fromIdx;
    });

    delete room.activeTrades[pairKey];

    io.to(socket.roomId).emit('tradeCompleted', { from: from.name, to: to.name, G });
    const m = sysMsg(room, `🤝 ${from.name} and ${to.name} completed a trade!`);
    io.to(socket.roomId).emit('receiveMessage', m);
  });

  // ── TRADE: REJECT ───────────────────────────────────────
  socket.on('rejectTrade', ({ pairKey }) => {
    const room = rooms[socket.roomId];
    if (!room?.state) return;
    const trade = room.activeTrades[pairKey];
    if (!trade) return;

    const rejecting = room.socketMap[socket.id];
    if (rejecting !== trade.targetIdx) return;

    const from  = room.state.players[trade.fromIdx];
    const to    = room.state.players[trade.targetIdx];
    delete room.activeTrades[pairKey];

    const fromSock = room.players[trade.fromIdx]?.socketId;
    if (fromSock) io.to(fromSock).emit('tradeRejected', { by: to.name });
    const m = sysMsg(room, `❌ ${to.name} rejected ${from.name}'s trade offer.`);
    io.to(socket.roomId).emit('receiveMessage', m);
  });

  // ── PLAYER EXIT ─────────────────────────────────────────
  socket.on('player-exit', () => {
    const roomId = socket.roomId;
    const room   = rooms[roomId];
    if (!room) return;
    const pidx  = room.socketMap[socket.id];
    const G     = room.state;
    const pName = room.players[pidx]?.name || 'A player';

    if (G) {
      const gp = G.players[pidx];
      if (gp) {
        gp.props.forEach(sid => { G.ownership[sid] = undefined; delete G.buildings[sid]; });
        gp.props = []; gp.bust = true; gp.money = 0;
      }
      if (G.cur === pidx) { advanceTurn(G); startTimer(roomId); }
      const winner = checkWin(G);
      if (winner) {
        clearTimer(roomId);
        const m = sysMsg(room, `🏆 ${winner.name} wins the game!`);
        io.to(roomId).emit('receiveMessage', m);
        io.to(roomId).emit('game-over', { winner: winner.name });
        setTimeout(() => { delete rooms[roomId]; }, 5000);
      } else {
        const m = sysMsg(room, `👋 ${pName} left the game.`);
        io.to(roomId).emit('receiveMessage', m);
        io.to(roomId).emit('player-left', { name: pName, reconnectable: false });
        io.to(roomId).emit('state-update', G);
      }
    } else {
      room.players = room.players.filter(p => p.socketId !== socket.id);
      delete room.socketMap[socket.id];
      if (room.players.length === 0) { delete rooms[roomId]; return; }
      if (room.hostSocketId === socket.id && room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostSocketId = room.players[0].socketId;
        io.to(room.players[0].socketId).emit('host-assigned');
      }
      io.to(roomId).emit('lobby-update', room.players);
      const m = sysMsg(room, `👋 ${pName} left the lobby.`);
      io.to(roomId).emit('receiveMessage', m);
    }
    room.players[pidx] && (room.players[pidx].disconnected = true);
    socket.leave(roomId);
    socket.roomId = null;
  });

  // ── RESTART GAME ────────────────────────────────────────
  socket.on('restart-game', () => {
    const room = rooms[socket.roomId];
    if (!room || room.hostSocketId !== socket.id) return;
    clearTimer(socket.roomId);
    room.activeTrades = {};
    room.state = {
      players: room.players
        .filter(lp => !lp.disconnected)
        .map((lp, i) => ({ id:i, name:lp.name, color:lp.color, avatar:lp.avatar, money:START_MONEY, pos:0, props:[], bust:false, inJail:false })),
      cur:0, rolled:false, buildings:{}, ownership:{}, cardLog:[],
      turnDeadline: Date.now() + TURN_SECS * 1000
    };
    room.players.forEach((lp, idx) => { if (!lp.disconnected) room.socketMap[lp.socketId] = idx; });
    io.to(socket.roomId).emit('game-restarted', room.state);
    const m = sysMsg(room, '🔄 New game started!');
    io.to(socket.roomId).emit('receiveMessage', m);
    startTimer(socket.roomId);
  });

  // ── DISCONNECT ──────────────────────────────────────────
  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;
    const room  = rooms[roomId];
    const pidx  = room.socketMap[socket.id];
    const pName = room.players[pidx]?.name || 'A player';

    console.log(`[disconnect] ${pName} from ${roomId}`);

    if (!room.state) {
      room.players = room.players.filter(p => p.socketId !== socket.id);
      delete room.socketMap[socket.id];
      if (room.players.length === 0) { clearTimer(roomId); delete rooms[roomId]; return; }
      if (room.hostSocketId === socket.id) {
        const newHost = room.players[0];
        newHost.isHost = true;
        room.hostSocketId = newHost.socketId;
        io.to(newHost.socketId).emit('host-assigned');
      }
      io.to(roomId).emit('lobby-update', room.players);
    } else {
      if (pidx !== undefined) {
        room.players[pidx].disconnected = true;
        if (room.state.cur === pidx && !room.state.rolled) {
          advanceTurn(room.state);
          startTimer(roomId);
          io.to(roomId).emit('state-update', room.state);
        }
      }
      if (room.hostSocketId === socket.id) {
        const newHost = room.players.find(p => !p.disconnected);
        if (newHost) {
          newHost.isHost = true;
          room.hostSocketId = newHost.socketId;
          io.to(newHost.socketId).emit('host-assigned');
        }
      }
      const m = sysMsg(room, `⚠️ ${pName} disconnected. They can rejoin.`);
      io.to(roomId).emit('receiveMessage', m);
      io.to(roomId).emit('player-left', { name: pName, reconnectable: true });

      const allGone = room.players.every(p => p.disconnected);
      if (allGone) { clearTimer(roomId); delete rooms[roomId]; console.log(`[room purged] ${roomId}`); }
    }
  });
});

// Keep-alive for Render free tier
const https = require('https');
setInterval(() => {
  https.get('https://business-board-game.onrender.com').on('error', () => {});
}, 5 * 60 * 1000);

// ── START SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎲 Business India → http://localhost:${PORT}`));
