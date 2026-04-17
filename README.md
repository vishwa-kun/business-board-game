# 🎲 Business India – Multiplayer Board Game

A real-time multiplayer Indian-themed Monopoly-style board game built with **Node.js + Express + Socket.io**.

## 🚀 Features
- 2–8 player real-time multiplayer rooms
- Full board with 37 squares (Indian cities, railways, utilities, taxes)
- Turn-based dice rolling, property buying, rent payment
- Chance & Community Chest cards (server-drawn, cheat-proof)
- Corner fees: JAIL ₹500 · REST HOUSE ₹300 · CLUB ₹100
- Auto-reconnect with localStorage session persistence
- Exit Game button with property transfer back to bank
- Auto turn-advance on disconnect
- 90-second turn timer
- Winner detection

## 📁 Project Structure
```
gamebb/
├── server.js          ← Node.js + Socket.io backend
├── package.json
├── .gitignore
└── public/
    ├── index.html     ← Game UI
    ├── style.css      ← Styles
    └── client.js      ← Socket.io client logic
```

## 🛠️ Local Setup
```bash
npm install
node server.js
# Open http://localhost:3000
```

## ☁️ Deploy on Render

1. Push this repo to GitHub (see below)
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Set these settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Port**: Render auto-detects `process.env.PORT`
5. Click **Deploy**

## 📤 Push to GitHub

```bash
# First time setup:
git init
git add .
git commit -m "Initial commit: Business India multiplayer game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main

# Future updates:
git add .
git commit -m "Your update message"
git push
```

## 🎮 How to Play

1. Open the game URL
2. Enter your name → Create Room or Join with Room Code
3. Share the Room Code with friends
4. All players click Ready → Host clicks Start
5. Roll dice on your turn → Buy properties → Pay rent → End turn
6. Last player standing (not bankrupt) wins!
