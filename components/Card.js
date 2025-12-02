// components/Card.js - PREMIUM STYLE (Restored)
import { motion } from 'framer-motion';

export default function Card({ card, revealed = false, selected = false }) {
  if (!card) return <div className="w-64 h-96 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 animate-pulse" />;

  return (
    <motion.div 
      initial={{ rotateY: -10, opacity: 0 }} 
      animate={{ rotateY: 0, opacity: 1 }} 
      transition={{ duration: 0.4 }} 
      className={`relative w-64 h-96 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col transition-all duration-300 ${selected ? 'border-4 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.5)] scale-105 z-10' : 'border border-white/10 bg-black/40'}`}
    >
      {/* Image Section - The "Donny" Look */}
      <div className="h-[60%] w-full relative bg-slate-900">
        <img src={card.image} alt={card.name} className="w-full h-full object-cover object-top" />
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Stats Section */}
      <div className="flex-1 bg-black/60 p-4 flex flex-col justify-center border-t border-white/10 relative z-20">
        <div className="font-bold text-white text-xl mb-3 truncate drop-shadow-md">{card.name}</div>
        
        <div className="space-y-1.5">
          {Object.entries(card.stats).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center text-xs">
              <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">{k}</div>
              <div className="font-mono font-bold text-white text-sm">{Math.floor(v)}</div>
              {/* Stat Bar */}
              <div className="w-20 h-1.5 bg-white/10 rounded-full ml-2 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.floor(v)}%` }} transition={{ duration: 1 }} className={`h-full ${selected ? 'bg-yellow-400' : 'bg-purple-500'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}