# 🎭 HeadGame — Multiplayer Party Guessing Game

[![Deploy](https://github.com/xzhangfox/headgame/actions/workflows/deploy.yml/badge.svg)](https://github.com/xzhangfox/headgame/actions)

> A real-time multiplayer party game for 2–8 players. Each player has a card on their head that everyone else can see but they can't — ask questions, gather clues, and be the first to guess what's on your head!

## 🎮 How to Play

1. **Create or join a room** — the host creates a room and shares the 6-character code with friends
2. **Configure the game** — choose a category (Animals, Food, Movies, etc.) and display mode (text or emoji)
3. **Cards are dealt** — each player gets a random item assigned to their head; you can see everyone else's but not your own
4. **Take turns asking questions** — on your turn, ask any other player a yes/no question to gather clues
5. **Guess at any time** — submit a guess whenever you're ready; wrong guesses cost a life (−10 pts)
6. **Scoring**
   - 1st to guess correctly: **100 pts** + speed bonus
   - 2nd: **85 pts**, 3rd: **70 pts** — drops by 15 per rank (minimum 10 pts)
   - Wrong guess: **−10 pts**
7. The game ends when all players have guessed or run out of lives — highest score wins!

## ✨ Features

- 🌐 **Real-time multiplayer** — Socket.io WebSocket, low-latency state sync
- 🎯 **10 categories** — Animals, Food, Movies, Celebrities, Countries, Sports, Brands, Occupations, Fantasy, Everyday Objects (30 items each)
- 🖼️ **Two display modes** — emoji/image mode or text-only mode
- 🎤 **Voice input** — hold the mic button and speak (Chrome / Edge)
- ❤️ **Lives system** — configurable 1 / 2 / 3 / 5 lives
- ⏱️ **Turn timer** — configurable 30 / 60 / 90 / 120-second limit
- 🎨 **Polished UI** — glassmorphism, neon glow effects, Framer Motion animations
- 🏆 **Live scoreboard** — real-time scores + end-game awards ceremony

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion |
| Backend | Node.js · Express · Socket.io |
| Deploy (frontend) | GitHub Pages via GitHub Actions |
| Deploy (backend) | Railway (free tier) |

```
headgame/
├── client/
│   └── src/
│       ├── pages/          # Home, Lobby, Game, Results
│       ├── hooks/          # useSocket, useSpeech
│       └── types/          # Shared type definitions
└── server/
    └── src/
        ├── GameManager.ts  # Core game state machine
        ├── categories.ts   # All category data
        └── index.ts        # Socket event handlers
```

## 🚀 Local Development

**Requirements:** Node.js 18+

```bash
# 1. Clone the repo
git clone https://github.com/xzhangfox/headgame.git
cd headgame

# 2. Install & start the server (terminal 1)
cd server && npm install && npm run dev
# → http://localhost:3001

# 3. Install & start the client (terminal 2)
cd client && npm install && npm run dev
# → http://localhost:5173
```

## 📦 Deployment

### Frontend → GitHub Pages

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/xzhangfox/headgame.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   Repository → Settings → Pages → Source: **GitHub Actions**

3. **Add secret** (if you have a separate backend)
   Repository → Settings → Secrets → New: `VITE_SERVER_URL` = `https://headgame-server-production.up.railway.app`

4. Every push to `main` triggers an automatic build and deploy to:
   `https://xzhangfox.github.io/headgame/`

### Backend → Railway (free)

1. Sign in to [railway.app](https://railway.app) with GitHub
2. **New Project** → Deploy from GitHub repo → select this repo
3. Set the root directory to `server` — Railway auto-detects and runs it
4. Copy the generated URL (e.g. `https://headgame-server-production.up.railway.app`) and add it as the `VITE_SERVER_URL` secret above

### Environment Variables

**Server** (set in Railway dashboard):
```
PORT=3001
CLIENT_ORIGIN=https://xzhangfox.github.io
```

**Client** (GitHub Secret or local `.env.local`):
```
VITE_SERVER_URL=https://headgame-server-production.up.railway.app
VITE_BASE_URL=/headgame/
```

## 🔌 Socket.io API

| Client → Server | Description |
|---|---|
| `create_room` | Create a new room |
| `join_room` | Join by room code |
| `start_game` | Start the game (host only) |
| `update_settings` | Update game settings (host only) |
| `send_message` | Send a question or answer |
| `make_guess` | Submit a guess for your own head item |
| `end_turn` | End your current turn |

| Server → Client | Description |
|---|---|
| `room_updated` | Full room state broadcast |

## 📝 License

MIT
