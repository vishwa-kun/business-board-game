// ============================================================
// BUSINESS INDIA – PRODUCTION SERVER  v3.0
// Node.js + Express + Socket.io
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
app.use(express.static(path.join(__dirname)));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── CONSTANTS ──────────────────────────────────────────────
const COLORS      = ['#E53935','#1E88E5','#43A047','#FFB300','#8E24AA','#FB8C00','#00ACC1','#D81B60'];
const START_MONEY = 1500;
const HOUSE_COST  = 1000;
const HOTEL_COST  = 2000;
const MAX_HOUSES  = 4;
const TOTAL_SQ    = 37;
const TURN_SECS   = 90; // seconds per turn before auto-advance

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

// ── CARD DEFINITIONS (server-side – applied on server) ──────
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
    case 'chance': { // Server draws & applies card immediately
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

function genRoomId() { return 'BI-' + crypto.randomBytes(2).toString('hex').toUpperCase(); }
function genSession() { return crypto.randomBytes(16).toString('hex'); }

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
// rooms[roomId] = { players, hostSocketId, state, socketMap, _timer, sessions }
// sessions[sessionId] = { playerIdx, name }

// ── SOCKET.IO ────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // ── RECONNECT (player rejoins after refresh) ──
  socket.on('reconnect-room', ({ roomId, sessionId }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error', { msg: 'Room expired or not found.' });
    const session = room.sessions?.[sessionId];
    if (!session) return socket.emit('error', { msg: 'Session not found. Join as new player.' });

    const pidx = session.playerIdx;
    const oldSid = room.players[pidx]?.socketId;

    // Update socket mapping
    if (oldSid && room.socketMap[oldSid] !== undefined) delete room.socketMap[oldSid];
    room.socketMap[socket.id] = pidx;
    room.players[pidx].socketId = socket.id;
    room.players[pidx].disconnected = false;
    socket.roomId = roomId;
    socket.join(roomId);

    socket.emit('reconnected', {
      roomId,
      playerIdx: pidx,
      state: room.state,
      lobbyPlayers: room.players,
      isHost: room.hostSocketId === oldSid ? true : (room.hostSocketId === socket.id),
      sessionId
    });
    // Update host if needed
    if (room.hostSocketId === oldSid) room.hostSocketId = socket.id;

    io.to(roomId).emit('player-reconnected', { name: room.players[pidx].name });
    console.log(`[reconnect] ${room.players[pidx].name} rejoined ${roomId}`);
  });

  // ── CREATE ROOM ──
  socket.on('create-room', ({ name }) => {
    if (!name?.trim()) return socket.emit('error', { msg: 'Enter your name first.' });
    const roomId    = genRoomId();
    const sessionId = genSession();
    rooms[roomId] = {
      hostSocketId: socket.id,
      state: null,
      socketMap: { [socket.id]: 0 },
      sessions: { [sessionId]: { playerIdx: 0, name } },
      players: [{ socketId:socket.id, name, color:COLORS[0], ready:false, isHost:true, disconnected:false }]
    };
    socket.roomId = roomId;
    socket.join(roomId);
    socket.emit('room-created', { roomId, sessionId });
    io.to(roomId).emit('lobby-update', rooms[roomId].players);
  });

  // ── JOIN ROOM ──
  socket.on('join-room', ({ roomId, name }) => {
    const room = rooms[roomId?.toUpperCase()];
    if (!room)                  return socket.emit('error', { msg: 'Room not found. Check the Room ID.' });
    if (room.state)             return socket.emit('error', { msg: 'Game already in progress.' });
    if (room.players.length >= 8) return socket.emit('error', { msg: 'Room is full (max 8 players).' });
    if (!name?.trim())          return socket.emit('error', { msg: 'Enter your name first.' });

    const sessionId = genSession();
    const idx = room.players.length;
    room.players.push({ socketId:socket.id, name, color:COLORS[idx], ready:false, isHost:false, disconnected:false });
    room.socketMap[socket.id] = idx;
    room.sessions[sessionId]  = { playerIdx: idx, name };
    socket.roomId = roomId.toUpperCase();
    socket.join(roomId.toUpperCase());
    socket.emit('room-joined', { roomId: roomId.toUpperCase(), sessionId });
    io.to(roomId.toUpperCase()).emit('lobby-update', room.players);
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

  // ── START GAME (host only) ──
  socket.on('start-game', () => {
    const room = rooms[socket.roomId];
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.players.length < 2) return socket.emit('error', { msg: 'Need at least 2 players to start.' });
    room.state = {
      players: room.players.map((lp, i) => ({
        id:i, name:lp.name, color:lp.color,
        money:START_MONEY, pos:0, props:[], bust:false, inJail:false
      })),
      cur:0, rolled:false, buildings:{}, ownership:{},
      cardLog: [],   // last 5 cards drawn
      turnDeadline: Date.now() + TURN_SECS * 1000
    };
    io.to(socket.roomId).emit('game-started', room.state);
    startTimer(socket.roomId);
  });

  // ── ROLL DICE ──
  socket.on('roll-dice', () => {
    const room = rooms[socket.roomId];
    if (!room?.state) return;
    const G   = room.state;
    const idx = room.socketMap[socket.id];
    if (idx !== G.cur)  return socket.emit('error', { msg: "It's not your turn." });
    if (G.rolled)       return socket.emit('error', { msg: 'You already rolled this turn.' });

    clearTimer(socket.roomId);
    G.rolled = true;
    const v1 = Math.ceil(Math.random() * 6);
    const v2 = Math.ceil(Math.random() * 6);
    const steps = v1 + v2;
    const p = G.players[G.cur];
    const oldPos = p.pos;

    p.pos = (oldPos + steps) % TOTAL_SQ;
    if (oldPos + steps >= TOTAL_SQ && p.pos !== 0) { p.money += 1500; } // passed START

    const result = processLanding(G, p);
    const winner = checkWin(G);

    // Add card to log if applicable
    if (result.action === 'card') {
      if (!G.cardLog) G.cardLog = [];
      G.cardLog.unshift({ deck: result.deck, card: result.card, result: result.result, player: p.name });
      if (G.cardLog.length > 5) G.cardLog.pop();
    }

    io.to(socket.roomId).emit('dice-rolled', { v1, v2, steps, G, result, winner: winner?.name || null });
  });

  // ── BUY PROPERTY ──
  socket.on('buy-property', ({ sqId }) => {
    const room = rooms[socket.roomId];
    if (!room?.state) return;
    const G = room.state, idx = room.socketMap[socket.id];
    if (idx !== G.cur) return socket.emit('error', { msg: 'Not your turn.' });
    const sq = SQUARES[sqId], p = G.players[G.cur];
    if (!sq || G.ownership[sqId] !== undefined || p.money < sq.price)
      return socket.emit('error', { msg: 'Cannot buy this property.' });
    p.money -= sq.price;
    p.props.push(sqId);
    G.ownership[sqId] = G.cur;
    io.to(socket.roomId).emit('state-update', G);
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

  // ── END TURN ──
  socket.on('end-turn', () => {
    const room = rooms[socket.roomId];
    if (!room?.state) return;
    const G = room.state, idx = room.socketMap[socket.id];
    if (idx !== G.cur) return socket.emit('error', { msg: 'Not your turn.' });
    clearTimer(socket.roomId);
    advanceTurn(G);
    io.to(socket.roomId).emit('state-update', G);
    startTimer(socket.roomId);
  });

  // ── RESTART GAME (host only) ──
  socket.on('restart-game', () => {
    const room = rooms[socket.roomId];
    if (!room || room.hostSocketId !== socket.id) return;
    clearTimer(socket.roomId);
    room.state = {
      players: room.players
        .filter(lp => !lp.disconnected)
        .map((lp, i) => ({ id:i, name:lp.name, color:lp.color, money:START_MONEY, pos:0, props:[], bust:false, inJail:false })),
      cur:0, rolled:false, buildings:{}, ownership:{}, cardLog:[],
      turnDeadline: Date.now() + TURN_SECS * 1000
    };
    // Rebuild socketMap for restarted game
    room.players.forEach((lp, idx) => { if (!lp.disconnected) room.socketMap[lp.socketId] = idx; });
    io.to(socket.roomId).emit('game-restarted', room.state);
    startTimer(socket.roomId);
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;
    const room   = rooms[roomId];
    const pidx   = room.socketMap[socket.id];
    const pName  = room.players[pidx]?.name || 'A player';

    console.log(`[disconnect] ${pName} from ${roomId}`);

    if (!room.state) {
      // Pre-game: fully remove player
      room.players = room.players.filter(p => p.socketId !== socket.id);
      delete room.socketMap[socket.id];
      if (room.players.length === 0) { clearTimer(roomId); delete rooms[roomId]; return; }
      // Reassign host if needed
      if (room.hostSocketId === socket.id) {
        const newHost = room.players[0];
        newHost.isHost = true;
        room.hostSocketId = newHost.socketId;
        io.to(newHost.socketId).emit('host-assigned');
      }
      io.to(roomId).emit('lobby-update', room.players);
    } else {
      // Mid-game: mark disconnected, keep their state
      if (pidx !== undefined) {
        room.players[pidx].disconnected = true;
        // If it was their turn, auto-advance
        if (room.state && room.state.cur === pidx && !room.state.rolled) {
          advanceTurn(room.state);
          startTimer(roomId);
          io.to(roomId).emit('state-update', room.state);
        }
      }
      // Reassign host if needed
      if (room.hostSocketId === socket.id) {
        const newHost = room.players.find(p => !p.disconnected);
        if (newHost) {
          newHost.isHost = true;
          room.hostSocketId = newHost.socketId;
          io.to(newHost.socketId).emit('host-assigned');
        }
      }
      io.to(roomId).emit('player-left', { name: pName, reconnectable: true });

      // Clean up room if all disconnected
      const allGone = room.players.every(p => p.disconnected);
      if (allGone) { clearTimer(roomId); delete rooms[roomId]; console.log(`[room purged] ${roomId}`); }
    }
  });
});

// ── START SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎲 Business India → http://localhost:${PORT}`));
