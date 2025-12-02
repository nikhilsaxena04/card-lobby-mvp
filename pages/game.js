// pages/game.js - PREMIUM GLASS GAMEPLAY
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Card from '../components/Card';
import { motion, AnimatePresence } from 'framer-motion';

let socket;

export default function Game() {
    const [lobby, setLobby] = useState(null);
    const [logs, setLogs] = useState([]);
    const [lastRound, setLastRound] = useState(null);
    const [name, setName] = useState(''); 
    const mySocket = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setName(localStorage.getItem('lastPlayerName') || 'Player');
        }

        socket = io();
        socket.on('connect', () => { mySocket.current = socket.id; setLogs(l => ['connected', ...l].slice(0, 50)); });
        socket.on('lobbyUpdate', l => { setLobby(l); setLogs(lg => ['lobby updated', ...lg].slice(0, 50)); });
        socket.on('gameStarted', l => { setLobby(l); setLogs(lg => ['game started', ...lg].slice(0, 50)); });
        socket.on('roundResult', data => { setLastRound(data); setLobby(data.lobby); setLogs(lg => [`round ${data.lobby.round - 1} ${data.attr}`, ...lg].slice(0, 50)); });
        socket.on('connect_error', e => setLogs(l => ['conn err ' + e.message, ...l].slice(0, 50)));

        if (typeof window !== 'undefined') {
            const storedLobbyId = localStorage.getItem('lastLobbyId');
            const storedName = localStorage.getItem('lastPlayerName') || 'Player';
            
            if (storedLobbyId) {
                socket.emit('joinLobby', { lobbyId: storedLobbyId, name: storedName }, res => {
                    if (res.ok) setLobby(res.lobby);
                    else { localStorage.removeItem('lastLobbyId'); window.location.href = '/'; }
                });
            } else { window.location.href = '/'; }
        }
        
        return () => socket?.disconnect();
    }, []);

    const chooseAttr = (attr) => {
        if (!lobby) return;
        const me = lobby.players.find(p => p.name === name);
        if (!me) return;
        
        socket.emit('chooseAttribute', { lobbyId: lobby.id, playerId: me.id, attr }, res => {
            if (!res.ok) console.error(res.err);
        });
    };
    
    const me = lobby?.players?.find(p => p.name === name);
    const isMyTurn = lobby?.state === 'playing' && lobby?.players[lobby.currentPlayerIndex]?.id === me?.id;
    const myTopCard = me?.hand?.[0];

    useEffect(() => {
        if (lobby && lobby.state !== 'playing' && lobby.state !== 'finished') { window.location.href = '/'; }
    }, [lobby]);

    if (!lobby || lobby.state === 'waiting') return <div className="min-h-screen bg-premium flex items-center justify-center text-white font-bold tracking-widest animate-pulse select-none">CONNECTING...</div>;

    if (lobby.state === 'finished' && lobby.winner) {
        return (
            <div className="min-h-screen bg-premium flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-black z-0" />
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-16 rounded-3xl text-center relative z-10 border border-yellow-500/30 shadow-[0_0_100px_rgba(234,179,8,0.2)]">
                    <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600 mb-6 drop-shadow-xl">VICTORY</h1>
                    <div className="text-4xl font-bold text-white mb-4">🏆 {lobby.winner.name} 🏆</div>
                    <div className="text-xl text-yellow-200/80 font-mono tracking-widest mb-10">WINS: {lobby.winner.totalWins} / 6</div>
                    <button onClick={() => window.location.href = '/'} className="px-8 py-4 bg-white text-black font-black tracking-widest rounded-full hover:scale-105 transition-transform shadow-xl cursor-pointer">PLAY AGAIN</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-premium p-6 flex flex-col gap-6 text-white font-sans overflow-hidden relative select-none">
            <header className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">META CLASH</h1>
                    <span className="bg-white/5 px-3 py-1 rounded text-xs font-mono tracking-widest text-slate-400 border border-white/10">ROUND {lobby.round} / 6</span>
                </div>
                <div className="font-mono text-sm text-slate-500 bg-black/40 px-3 py-1 rounded-lg">ID: {lobby.id}</div>
            </header>

            <div className="flex-1 flex gap-6 h-full relative z-10">
                {/* Left Panel */}
                <div className="w-80 flex flex-col gap-3">
                    {lobby.players.map(p => (
                        <motion.div key={p.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${p.id === lobby.players[lobby.currentPlayerIndex]?.id ? 'bg-indigo-900/30 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5'}`}>
                            <div className="flex justify-between items-center mb-2 relative z-10">
                                <div className="font-bold flex items-center gap-2">{p.name} {p.isBot && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20">BOT</span>}</div>
                                <div className="text-xl font-black text-indigo-300">{p.totalWins}</div>
                            </div>
                            <div className="h-1.5 bg-black/50 rounded-full overflow-hidden relative z-10"><motion.div initial={{ width: 0 }} animate={{ width: `${(p.totalWins / 6) * 100}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" /></div>
                        </motion.div>
                    ))}
                    <div className="mt-auto bg-black/20 rounded-2xl p-4 h-48 overflow-y-auto text-xs font-mono text-slate-400 border border-white/5 backdrop-blur-sm custom-scrollbar">
                        <div className="mb-3 text-white font-bold uppercase tracking-widest text-[10px] opacity-50">Battle Logs</div>
                        {logs.map((l, i) => <div key={i} className="mb-1.5 opacity-70 border-b border-white/5 pb-1.5 last:border-0 leading-relaxed">{l}</div>)}
                    </div>
                </div>

                {/* Center Arena */}
                <div className="flex-1 flex flex-col items-center justify-center relative z-20 pb-20">
                    <motion.div key={isMyTurn ? 'turn' : 'wait'} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-12 text-center relative z-10">
                        <h2 className={`text-5xl font-black uppercase tracking-tighter ${isMyTurn ? 'text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]' : 'text-slate-600'}`}>{isMyTurn ? "YOUR TURN" : `${lobby.players[lobby.currentPlayerIndex]?.name}'s Turn`}</h2>
                        <p className="text-slate-400 mt-3 font-mono text-xs tracking-[0.2em] uppercase opacity-70">{isMyTurn ? "Select an attack attribute" : "Waiting for opponent move..."}</p>
                    </motion.div>

                    <div className="relative group perspective-1000 z-0">
                        {myTopCard ? (
                            <motion.div layoutId="activeCard" className={`relative transition-all duration-500 ${isMyTurn ? 'scale-110 shadow-[0_0_60px_rgba(124,58,237,0.3)]' : 'scale-95 opacity-60 grayscale-[0.8]'}`}>
                                <Card card={myTopCard} selected={isMyTurn} />
                            </motion.div>
                        ) : (
                            <div className="w-56 h-80 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center text-slate-600 font-bold tracking-widest">EMPTY HAND</div>
                        )}
                    </div>

                    {/* BUTTONS: Relative Layout (mt-12) to ensure they are never blocked */}
                    <AnimatePresence>
                        {isMyTurn && myTopCard && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                exit={{ y: 20, opacity: 0 }} 
                                className="mt-12 flex gap-4 bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/20 shadow-2xl z-50 pointer-events-auto"
                            >
                                {Object.keys(myTopCard.stats).map(attr => (
                                    <button 
                                        key={attr} 
                                        onClick={() => chooseAttr(attr)} 
                                        className="px-8 py-4 rounded-xl bg-white/10 hover:bg-indigo-600 hover:scale-105 border border-white/10 hover:border-indigo-400 transition-all group cursor-pointer active:scale-95 select-none"
                                    >
                                        <span className="text-sm uppercase font-black text-slate-300 group-hover:text-white tracking-widest pointer-events-none">{attr}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Panel */}
                <div className="w-80 bg-black/20 rounded-2xl border border-white/5 p-5 flex flex-col backdrop-blur-sm">
                    <h3 className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mb-4">Last Round Result</h3>
                    {lastRound ? (
                        <div className="flex-1 flex flex-col">
                            <div className="mb-4 p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/20">
                                <div className="text-[10px] text-indigo-300 uppercase tracking-wider mb-1">Battle Attribute</div>
                                <div className="text-2xl font-black text-white capitalize">{lastRound.attr}</div>
                            </div>
                            <div className="mb-4 px-2">
                                <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">Round Winner</div>
                                <div className="font-bold text-emerald-400 flex items-center gap-2 text-lg"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />{lobby.players.find(p => p.id === lastRound.winnerId)?.name || 'Unknown'}</div>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {lastRound.reveals.map((c, i) => c && (
                                    <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden relative"><img src={c.image} className="w-full h-full object-cover" /></div>
                                        <div><div className="text-xs font-bold text-white truncate w-24">{c.name}</div><div className="text-sm font-mono font-bold text-slate-400">{Math.floor(c.stats[lastRound.attr])}</div></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30"><div className="text-4xl mb-2">⏱️</div><div className="text-xs font-bold uppercase tracking-widest">No history yet</div></div>
                    )}
                </div>
            </div>
        </div>
    );
}