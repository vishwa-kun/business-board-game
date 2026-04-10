# 🎲 Business India — Multiplayer Board Game

A real-time, full-stack multiplayer board game inspired by the classic Monopoly format, reimagined with an Indian theme. Built with Node.js, Express, Socket.IO, and vanilla HTML/CSS/JavaScript.

---

## 🚀 Features

- 🧑‍🤝‍🧑 **2–8 Player Multiplayer** — Real-time via Socket.IO
- 🏙️ **27 Indian Properties** — Cities and landmarks across India
- 🎴 **Chance & Community Chest Cards** — With odd/even roll modifiers
- 🏗️ **Building System** — Buy houses and hotels on properties
- 🔄 **Trading System** — Trade properties between players
- ⏱️ **Turn Timers** — Keep the game moving
- 💸 **Auction Mechanics** — For unclaimed properties
- 🏆 **Winner Statistics Dashboard**
- 🌐 **Room Management** — Create & join game rooms
- ✅ **Server-side Game Validation** — Prevents cheating

---

## 🛠️ Tech Stack

| Layer      | Technology              |
|------------|------------------------|
| Frontend   | HTML5, CSS3, Vanilla JS |
| Backend    | Node.js, Express.js    |
| Real-time  | Socket.IO              |
| Runtime    | Node.js >= 18.0.0      |

---

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/gamebb.git
cd gamebb
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

### 4. Open in browser

```
http://localhost:3000
```

---

## 🌐 Deployment

This project is ready to deploy on **[Render](https://render.com)**:

1. Push this repo to GitHub
2. Create a new **Web Service** on Render
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Set **Environment**: `Node`

---

## 📁 Project Structure

```
gamebb/
├── index.html        # Main game UI (frontend)
├── game.js           # Client-side game logic
├── server.js         # Node.js + Socket.IO server
├── package.json      # Project metadata & scripts
└── .gitignore        # Git exclusions
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
