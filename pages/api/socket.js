// pages/api/socket.js - FINAL STABLE SERVER CODE
import { Server } from 'socket.io';
import { init as initDb, getDb } from '../../lib/db';
import GameLogic from '../../lib/game'; 
const { generateCards, ATTRS, CARDS_PER_PLAYER, MAX_PLAYERS } = GameLogic;

// --- Bot Turn Function ---
async function runBotTurn(io, lobbyId){
    const db = await getDb(); const l = db.data.lobbies[lobbyId]; 
    if (!l || l.state !== 'playing') return; 
    
    const cur = l.players[l.currentPlayerIndex]; 
    if (!cur || !cur.isBot) return; 
    
    const top = cur.hand[0]; 
    if (!top) return; 
    
    let bestAttr = ATTRS[0], bestVal = top.stats[bestAttr]; 
    for (const a of ATTRS) if (top.stats[a] > bestVal){ bestAttr = a; } 
    
    // Play the turn
    const reveals = l.players.map(p => p.hand && p.hand.length? p.hand[0] : null); 
    const topCards = l.players.map(p => p.hand && p.hand.length? p.hand.shift() : null); 
    
    let best = -Infinity, winnerIndex=-1; 
    for (let i=0;i<l.players.length;i++){ const c = topCards[i]; if (!c) continue; const v = c.stats[bestAttr] || 0; if (v > best){ best = v; winnerIndex = i; } }
    
    // Score
    l.players[winnerIndex].totalWins = (l.players[winnerIndex].totalWins||0)+1;
    
    // Update History
    l.history.push({ round: l.round, attr: bestAttr, reveals: topCards, winnerId: l.players[winnerIndex].id });
    l.currentPlayerIndex = winnerIndex; 
    
    // --- GAME END CHECK ---
    const cardsRemaining = l.players.reduce((sum, p) => sum + (p.hand ? p.hand.length : 0), 0);
    
    if (cardsRemaining === 0) {
        l.state = 'finished';
        l.winner = l.players.reduce((prev, current) => (prev.totalWins > current.totalWins) ? prev : current);
    } else {
        l.round++; 
    }
    
    await db.write(); 
    io.to(lobbyId).emit('roundResult', { attr: bestAttr, reveals: topCards, winnerId: l.players[winnerIndex].id, lobby: l });
    
    const next = l.players[l.currentPlayerIndex]; 
    if (next && next.isBot && l.state === 'playing') setTimeout(()=> runBotTurn(io, lobbyId), 600);
}

export default async function handler(req, res) {
  if (!res.socket.server.io) {
    await initDb();
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', socket => {
      console.log('socket connected', socket.id);

      socket.on('createLobby', async ({ name, theme }, cb) => {
        const db = await getDb();
        const id = Math.random().toString(36).slice(2,7).toUpperCase();
        const cached = db.data.apiCache[theme?.toLowerCase()];
        const cards = await generateCards(theme || 'One Piece', cached);
        if (!cached) db.data.apiCache[theme?.toLowerCase()] = null;
        const lobby = { id, theme, deck: cards, players: [], maxPlayers: MAX_PLAYERS, state:'waiting', currentPlayerIndex:0, round:1, history:[] };
        lobby.players.push({ id: Math.random().toString(36).slice(2,8), name: name || 'Host', socketId: socket.id, isBot:false, hand:[], wins: {}, totalWins:0 });
        db.data.lobbies[id] = lobby; await db.write();
        socket.join(id); cb({ ok:true, lobby }); io.to(id).emit('lobbyUpdate', lobby);
      });

      // SESSION RECOVERY LOGIC IN JOIN
      socket.on('joinLobby', async ({ lobbyId, name }, cb) => {
        const db = await getDb(); const l = db.data.lobbies[lobbyId];
        if (!l) return cb({ ok:false, err:'no lobby' });

        const existingPlayer = l.players.find(p => p.name === name);
        if (existingPlayer) {
             existingPlayer.socketId = socket.id; 
             socket.join(lobbyId); 
             cb({ ok:true, lobby: l }); 
             io.to(lobbyId).emit('lobbyUpdate', l);
             return;
        }

        if (l.players.length >= l.maxPlayers) return cb({ ok:false, err:'full' });
        if (l.state !== 'waiting') return cb({ ok:false, err:'game in progress' });

        const player = { id: Math.random().toString(36).slice(2,8), name: name || 'Player', socketId: socket.id, isBot:false, hand:[], wins: {}, totalWins:0 };
        l.players.push(player); await db.write(); socket.join(lobbyId); cb({ ok:true, lobby: l }); io.to(lobbyId).emit('lobbyUpdate', l);
      });

      socket.on('addBot', async ({ lobbyId }, cb) => {
        const db = await getDb(); const l = db.data.lobbies[lobbyId];
        if (!l) return cb({ ok:false, err:'no lobby' });
        if (l.players.length >= l.maxPlayers) return cb({ ok:false, err:'full' });
        const bot = { id: Math.random().toString(36).slice(2,8), name: 'BOT-'+Math.random().toString(36).slice(2,5), socketId: null, isBot:true, hand:[], wins: {}, totalWins:0 };
        l.players.push(bot); await db.write(); io.to(lobbyId).emit('lobbyUpdate', l); cb({ ok:true, lobby: l });
      });

      socket.on('startGame', async ({ lobbyId }, cb) => {
        const db = await getDb(); const l = db.data.lobbies[lobbyId]; if (!l) return cb({ ok:false, err:'no lobby' }); if (l.players.length < 2) return cb({ ok:false, err:'need players' });
        while (l.players.length < l.maxPlayers) l.players.push({ id: Math.random().toString(36).slice(2,8), name: 'BOT-'+Math.random().toString(36).slice(2,5), socketId: null, isBot:true, hand:[], wins: {}, totalWins:0 });
        const deck = [...l.deck]; for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
        for (const p of l.players) p.hand = [];
        for (let i=0;i<CARDS_PER_PLAYER;i++){ for (let j=0;j<l.players.length;j++){ if (deck.length) l.players[j].hand.push(deck.shift()); } }
        l.kitty = deck; l.state = 'playing'; l.round = 1; l.currentPlayerIndex = 0; await db.write(); io.to(lobbyId).emit('gameStarted', l);
        const cur = l.players[l.currentPlayerIndex]; if (cur && cur.isBot) setTimeout(()=> runBotTurn(io, lobbyId), 400);
        cb({ ok:true, lobby: l });
      });

      socket.on('chooseAttribute', async ({ lobbyId, playerId, attr }, cb) => {
          const db = await getDb(); const l = db.data.lobbies[lobbyId]; if (!l || l.state !== 'playing') return cb({ ok:false, err:'no active game' });
          const activeIdx = l.currentPlayerIndex; const active = l.players[activeIdx]; if (active.id !== playerId && !active.isBot) return cb({ ok:false, err:'not your turn' });
          
          const reveals = l.players.map(p => p.hand && p.hand.length? p.hand[0] : null);
          const topCards = l.players.map(p => p.hand && p.hand.length? p.hand.shift() : null);
          
          let best = -Infinity, winnerIndex=-1;
          for (let i=0;i<l.players.length;i++){ const c = topCards[i]; if (!c) continue; const v = c.stats[attr] || 0; if (v > best){ best = v; winnerIndex = i; } }
          
          l.players[winnerIndex].totalWins = (l.players[winnerIndex].totalWins||0)+1;

          l.history.push({ round: l.round, attr, reveals: topCards, winnerId: l.players[winnerIndex].id });
          l.currentPlayerIndex = winnerIndex; 
          
          const cardsRemaining = l.players.reduce((sum, p) => sum + (p.hand ? p.hand.length : 0), 0);
          
          if (cardsRemaining === 0) {
              l.state = 'finished';
              l.winner = l.players.reduce((prev, current) => (prev.totalWins > current.totalWins) ? prev : current);
          } else {
              l.round++;
          }
          
          await db.write(); io.to(lobbyId).emit('roundResult', { attr, reveals: topCards, winnerId: l.players[winnerIndex].id, lobby: l });
          const next = l.players[l.currentPlayerIndex]; 
          if (next && next.isBot && l.state === 'playing') setTimeout(()=> runBotTurn(io, lobbyId), 600);
          cb({ ok:true, lobby: l });
      });

      socket.on('leaveLobby', async ({ lobbyId }, cb) => {
        const db = await getDb(); const l = db.data.lobbies[lobbyId]; if (!l) return cb({ ok:false }); 
        if (l.state === 'waiting') {
            l.players = l.players.filter(p => p.socketId !== socket.id); 
        }
        if (l.players.length === 0 && l.state === 'waiting') {
             delete db.data.lobbies[lobbyId];
        }
        await db.write(); socket.leave(lobbyId); io.to(lobbyId).emit('lobbyUpdate', l); cb({ ok:true });
      });

    }); 
  }
  res.end();
}