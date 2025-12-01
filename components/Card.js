// components/Card.js - FINAL VERSION (Clean Stats Display)
import { motion } from 'framer-motion';

export default function Card({ card, revealed=false, selected=false }){
  if (!card) return <div className="w-44 h-72 bg-slate-800 rounded-xl" />;
  return (
    <motion.div initial={{ rotateY: -20, opacity:0 }} animate={{ rotateY:0, opacity:1 }} transition={{duration:0.4}} 
      className={`w-44 h-72 bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl overflow-hidden card-shadow border ${selected? 'border-yellow-400' : 'border-transparent'}`}
    >
      <div className="h-44 overflow-hidden"><img src={card.image} alt={card.name} className="w-full h-full object-cover object-top" /></div>
      <div className="p-2"><div className="font-semibold text-sm truncate">{card.name}</div>
        <div className="mt-2 space-y-1">{Object.entries(card.stats).map(([k,v])=> (
          <div key={k} className="text-xs"><div className="flex justify-between"><div className="capitalize">{k}</div><div>{Math.floor(v)}</div></div>
            <div className="h-2 bg-slate-700 rounded mt-1 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.floor(v)}%` }} transition={{ duration: 0.8 }} className="h-full bg-gradient-to-r from-emerald-400 to-green-600" /></div>
          </div>
        ))}</div>
      </div>
    </motion.div>
  );
}