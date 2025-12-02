// lib/game.js - FINAL STABLE (No Nanoid Error + Integer Stats)
const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args));
const crypto = require('crypto');
const _ = require('lodash');

const ATTRS = ['rank','strength','speed','iq'];
const CARDS_PER_PLAYER = 6;
const MAX_PLAYERS = 4;
const TOTAL_CARDS = CARDS_PER_PLAYER * MAX_PLAYERS;

// Helper to replace nanoid without errors
function generateId() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function generatePlausibleStats(name, theme){
    const statData = await new Promise(resolve => {
        const stats = {};
        ATTRS.forEach(attr => {
            const base = (name.length * theme.length) % 90 + 10;
            const randomVariance = Math.random() * 20;
            stats[attr] = Math.floor((base + randomVariance) % 99 + 1); 
        });
        resolve(stats);
    });
    return statData;
}

async function fetchCharactersJikan(theme){
  try{
    const q = encodeURIComponent(theme);
    const s = await fetch(`https://api.jikan.moe/v4/anime?q=${q}&limit=1`);
    if (!s.ok) throw new Error('search err');
    const js = await s.json();
    if (!js.data || js.data.length===0) throw new Error('no anime');
    const id = js.data[0].mal_id;
    const c = await fetch(`https://api.jikan.moe/v4/anime/${id}/characters`);
    if (!c.ok) throw new Error('chars err');
    const ch = await c.json();
    if (!ch.data || ch.data.length===0) throw new Error('no chars');
    const arr = ch.data.map(x=>({ name: x.character.name, image: x.character.images?.jpg?.image_url || null }));
    return _.uniqBy(arr,'name');
  }catch(e){ console.warn('jikan fail', e.message); return null; }
}

async function generateCards(theme, cached){
  const chars = cached || await fetchCharactersJikan(theme);
  const cards = [];
  
  const charList = (chars && chars.length > 0) ? chars : 
      Array(TOTAL_CARDS).fill().map((_, i) => ({ 
          name: `${theme} #${i+1}`, 
          image: `https://picsum.photos/seed/${encodeURIComponent(theme+'|'+i)}/320/420` 
      }));

  for (let i = 0; i < TOTAL_CARDS; i++){
    const base = charList[i % charList.length];
    const name = charList.length >= TOTAL_CARDS ? base.name : `${base.name}${i < charList.length ? '' : ' #' + Math.floor(i/charList.length)}`;
    const image = base.image || `https://picsum.photos/seed/${encodeURIComponent(theme+'|'+name)}/320/420`;
    
    const stats = await generatePlausibleStats(name, theme);
    
    cards.push({ id: generateId(), name, image, stats });
  }
  return cards;
}

module.exports = { ATTRS, CARDS_PER_PLAYER, MAX_PLAYERS, TOTAL_CARDS, generateCards };