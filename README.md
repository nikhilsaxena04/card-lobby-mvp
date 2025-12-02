# META CLASH — README.md

Meta Clash is a fast, theme-based card battle game. Type any universe — anime, manga, games — and instantly create a multiplayer lobby with cards, stats, bots, and real-time battles.

---

## 🖼️ Screenshots

### Lobby Creation

### Battle Screen

---

## 🚀 Features

* Create or join multiplayer lobbies (up to 4 players)
* Auto-fill bots if lobby isn’t full
* Generates 24 themed cards per game
* Card stats: Rank, Strength, Speed, IQ
* Turn-based attribute battles (Top-Trumps style)
* Smooth UI with animations
* Real-time gameplay via Socket.io

---

## 🧠 How It Works

1. Enter a universe (e.g., *One Piece*).
2. Server generates 24 cards.
3. Cards are divided among players/bots.
4. Players join the same room via Socket.io.
5. Active player chooses a stat.
6. All cards are compared; winner gains points.
7. After 6 rounds, the highest score wins.

---

## 🗂️ Project Structure

```
/app
  /create/page.jsx          → Create lobby
  /join/page.jsx            → Join lobby
  /lobby/[code]/page.jsx    → Main game screen
  /api
    /generate-cards/route.js → Generates themed cards
    /socket/server.js        → Socket.io backend

/components
  Card.jsx
  PlayerArea.jsx
  BotArea.jsx
  Scoreboard.jsx
  LobbyStatus.jsx

/lib
  lobbyStore.js
  generateStats.js

/hooks
  useSocket.js
```

---

## 🛠️ Tech Stack

* **Next.js (App Router)**
* **React**
* **TailwindCSS**
* **Framer Motion** for animations
* **Socket.io** for real-time multiplayer
* **In-memory store** for lobby/game state

---

## 📦 Installation & Running

Clone the repo:

```bash
git clone <your-repo-url>
cd meta-clash
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the game in browser:

```
http://localhost:3000
```

---

## 🎮 Gameplay Loop

* Player sees a card
* Selects an attribute
* Server compares stats for all players
* Winner gets a point
* Six rounds → final winner

---

## 📌 Notes

* MVP project: refreshing resets lobby
* Bots are simple but functional
* Stats are randomly generated

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the **Issues** page if you want to contribute.

1. **Fork** the project.
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`).
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4. **Push** to the branch (`git push origin feature/AmazingFeature`).
5. **Open** a Pull Request.

> **Note:** This project is governed by a **Personal Use License**. Please ensure any contributions adhere to non-commercial use.

**Give a ⭐️ if you like this project!**

---

## **💜 License**

Copyright (c) 2025 Nikhil Saxena. All rights reserved.

**PERMISSIONS**

Permission is hereby granted to any person obtaining a copy of this software 

to download, install, and execute it for PERSONAL, NON-COMMERCIAL purposes only.

**RESTRICTIONS**

1. COMMERCIAL USE IS FORBIDDEN: You may not use this software for any commercial purpose, 

   business, or revenue-generating activity.

2. NO REDISTRIBUTION: You may not modify, distribute, sublicense, or sell copies 

   of the software to third parties.

**NO WARRANTY**

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. THE AUTHOR SHALL 

NOT BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY.
