// ═══════════════════════════════════════════════════════════════
//  loader.js — Lädt alle JSON-Daten nativ aus /data/
// ═══════════════════════════════════════════════════════════════

var WORLD     = [];
var BUILDINGS = {};
var PKMN      = {};
var MOVES     = {};
var ITEM_DEFS = {};

var TYPE_COLORS = {
  Normal:"#a8a77a", Feuer:"#ee8130",  Wasser:"#6390f0", Elektro:"#f7d02c",
  Pflanze:"#7ac74c",Eis:"#96d9d6",    Kampf:"#c22e28",  Gift:"#a33ea1",
  Boden:"#e2bf65",  Flug:"#a98ff3",   Psycho:"#f95587", Käfer:"#a6b91a",
  Gestein:"#b6a136",Geist:"#735797",  Drachen:"#6f35fc"
};

var TYPE_CHART = {
  Normal:  {Gestein:0.5, Geist:0},
  Feuer:   {Feuer:0.5, Wasser:0.5, Pflanze:2, Eis:2, Käfer:2, Gestein:0.5, Drachen:0.5},
  Wasser:  {Feuer:2, Wasser:0.5, Pflanze:0.5, Boden:2, Gestein:2, Drachen:0.5},
  Pflanze: {Feuer:0.5, Wasser:2, Pflanze:0.5, Gift:0.5, Boden:2, Flug:0.5, Käfer:0.5, Gestein:2, Drachen:0.5},
  Elektro: {Wasser:2, Pflanze:0.5, Elektro:0.5, Boden:0, Flug:2, Drachen:0.5},
  Eis:     {Wasser:0.5, Pflanze:2, Eis:0.5, Boden:2, Flug:2, Drachen:2},
  Kampf:   {Normal:2, Eis:2, Gift:0.5, Flug:0.5, Psycho:0.5, Käfer:0.5, Gestein:2, Geist:0},
  Gift:    {Pflanze:2, Gift:0.5, Boden:0.5, Käfer:2, Gestein:0.5, Geist:0.5},
  Boden:   {Feuer:2, Elektro:2, Pflanze:0.5, Gift:2, Flug:0, Käfer:0.5, Gestein:2},
  Flug:    {Pflanze:2, Elektro:0.5, Kampf:2, Käfer:2, Gestein:0.5},
  Psycho:  {Kampf:2, Gift:2, Psycho:0.5, Geist:0},
  Käfer:   {Feuer:0.5, Pflanze:2, Kampf:0.5, Flug:0.5, Psycho:2, Geist:0.5},
  Gestein: {Feuer:2, Eis:2, Kampf:0.5, Boden:0.5, Flug:2, Käfer:2},
  Geist:   {Normal:0, Psycho:0},
  Drachen: {Drachen:2}
};

async function loadAllData() {
  const base = "./data/";
  const [world, buildings, pokemon, moves, items] = await Promise.all([
    fetch(base + "world.json").then(r => r.json()),
    fetch(base + "buildings.json").then(r => r.json()),
    fetch(base + "pokemon.json").then(r => r.json()),
    fetch(base + "moves.json").then(r => r.json()),
    fetch(base + "items.json").then(r => r.json()),
  ]);

  WORLD = world; BUILDINGS = buildings;
  PKMN  = pokemon; MOVES = moves; ITEM_DEFS = items;

  _resolveBuildings();

  console.log("[Loader] ✅", WORLD.length, "Zonen |",
    Object.keys(PKMN).length, "Pokémon |",
    Object.keys(MOVES).length, "Attacken");

  document.dispatchEvent(new CustomEvent("dataReady"));
}

function _resolveBuildings() {
  WORLD.forEach(zone => {
    if (!zone.gebaeude || zone.gebaeude.length === 0) return;
    zone._gebaeudeDaten = zone.gebaeude
      .map(id => BUILDINGS[id] ? { _id: id, ...BUILDINGS[id] } : null)
      .filter(Boolean);
    zone._shopItems = [];
    zone._gebaeudeDaten.forEach(b => {
      if (b.typ === "shop" && b.stock) {
        b.stock.forEach(s => {
          const def = ITEM_DEFS[s.id] || {};
          zone._shopItems.push({ ...s, name: def.name || s.id });
        });
      }
    });
  });
}

function getZone(id) { return WORLD.find(z => z.id === id) || null; }
function getPkmn(id) { return PKMN[String(id)] || null; }
function getMove(id) { return MOVES[id] || null; }
function getItem(id) { return ITEM_DEFS[id] || null; }

// FIX: state.flags statt state.eventFlags
function checkBedingung(cond, state) {
  if (!cond || !state) return true;
  if (cond.minBadges !== undefined && state.orden < cond.minBadges) return false;
  if (cond.hasBadge  !== undefined && !(state.ordenIds||[]).includes(cond.hasBadge)) return false;
  if (cond.hasItem   !== undefined && !((state.items||{})[cond.hasItem] > 0)) return false;
  if (cond.eventFlag !== undefined && !(state.flags||{})[cond.eventFlag]) return false;
  return true;
}

function getEffektivitaet(angriffTyp, vertTypen) {
  let mult = 1;
  const chart = TYPE_CHART[angriffTyp] || {};
  (vertTypen || []).forEach(t => { if (chart[t] !== undefined) mult *= chart[t]; });
  return mult;
}

// FIX: Kein doppelter Encounter-Check — app.js macht den Rate-Check bereits
function rollWildPkmn(zone) {
  if (!zone.wildePkmn || zone.wildePkmn.length === 0) return null;
  const total = zone.wildePkmn.reduce((s, e) => s + e.rate, 0);
  let roll = Math.random() * total;
  for (const e of zone.wildePkmn) {
    roll -= e.rate;
    if (roll < 0) {
      const lv = e.lvMin + Math.floor(Math.random() * (e.lvMax - e.lvMin + 1));
      return { dexId: e.id, level: lv, shiny: Math.random() < 1/250 };
    }
  }
  return null;
}

loadAllData();
