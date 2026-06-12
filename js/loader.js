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

// ── Ladefunktion ──────────────────────────────────────────────
function _setLadeStatus(text) {
  var el = document.getElementById("loadStatus");
  if (el) el.textContent = text;
  console.log("[Loader]", text);
}

async function loadAllData() {
  _setLadeStatus("Lade Spieldaten...");

  const base = "./data/";
  const dateien = [
    { name: "world.json",     key: "world" },
    { name: "buildings.json", key: "buildings" },
    { name: "pokemon.json",   key: "pokemon" },
    { name: "moves.json",     key: "moves" },
    { name: "items.json",     key: "items" },
  ];

  const ergebnisse = {};
  for (const d of dateien) {
    try {
      _setLadeStatus("Lade " + d.name + "...");
      const resp = await fetch(base + d.name);
      if (!resp.ok) throw new Error("HTTP " + resp.status + " für " + d.name);
      ergebnisse[d.key] = await resp.json();
      console.log("[Loader] ✅ " + d.name + " geladen");
    } catch (err) {
      console.error("[Loader] ❌ Fehler bei " + d.name + ":", err);
      _setLadeStatus("❌ Fehler beim Laden: " + d.name + "\n" + err.message);
      // Nicht abbrechen – mit leeren Daten weitermachen
      ergebnisse[d.key] = d.key === "world" ? [] : {};
    }
  }

  WORLD     = ergebnisse.world;
  BUILDINGS = ergebnisse.buildings;
  PKMN      = ergebnisse.pokemon;
  MOVES     = ergebnisse.moves;
  ITEM_DEFS = ergebnisse.items;

  _resolveBuildings();

  console.log("[Loader] ✅ Fertig:", WORLD.length, "Zonen |",
    Object.keys(PKMN).length, "Pokémon |",
    Object.keys(MOVES).length, "Attacken");

  _setLadeStatus("Bereit!");
  document.dispatchEvent(new CustomEvent("dataReady"));
}

// ── Gebäude-IDs auflösen ──────────────────────────────────────
function _resolveBuildings() {
  WORLD.forEach(zone => {
    if (!zone.gebaeude || zone.gebaeude.length === 0) return;
    zone._gebaeudeDaten = zone.gebaeude
      .map(id => {
        if (!BUILDINGS[id]) {
          console.warn("[Loader] Unbekanntes Gebäude:", id, "in Zone", zone.id);
          return null;
        }
        return { _id: id, ...BUILDINGS[id] };
      })
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

// ── Hilfsfunktionen ───────────────────────────────────────────
function getZone(id) { return WORLD.find(z => z.id === id) || null; }
function getPkmn(id) { return PKMN[String(id)] || null; }
function getMove(id) { return MOVES[id] || null; }
function getItem(id) { return ITEM_DEFS[id] || null; }

function checkBedingung(cond, state) {
  if (!cond || !state) return true;
  if (cond.minBadges !== undefined && state.orden < cond.minBadges) return false;
  if (cond.maxBadges !== undefined && state.orden > cond.maxBadges) return false;
  if (cond.hasBadge  !== undefined && !(state.ordenIds||[]).includes(cond.hasBadge)) return false;
  if (cond.hasItem   !== undefined && !((state.items||{})[cond.hasItem] > 0)) return false;
  if (cond.hasPokemonMove !== undefined && !teamHatMove(state, cond.hasPokemonMove)) return false;
  if (cond.eventFlag !== undefined && !(state.flags||{})[cond.eventFlag]) return false;
  return true;
}

function teamHatMove(state, moveId) {
  return !!(state && state.party || []).some(p => {
    if (!p) return false;
    if (typeof reparierePkmnInst === "function") reparierePkmnInst(p);
    return Array.isArray(p.attacken) && p.attacken.includes(moveId);
  });
}

function getEffektivitaet(angriffTyp, vertTypen) {
  let mult = 1;
  const chart = TYPE_CHART[angriffTyp] || {};
  (vertTypen || []).forEach(t => { if (chart[t] !== undefined) mult *= chart[t]; });
  return mult;
}

// Kein doppelter Encounter-Check — app.js macht den Rate-Check
function rollWildPkmn(zone) {
  if (!zone.wildePkmn || zone.wildePkmn.length === 0) return null;
  return rollPkmnAusTabelle(zone.wildePkmn);
}

function rollPkmnAusTabelle(tabelle) {
  if (!tabelle || tabelle.length === 0) return null;
  const total = tabelle.reduce((s, e) => s + e.rate, 0);
  let roll = Math.random() * total;
  for (const e of tabelle) {
    roll -= e.rate;
    if (roll < 0) {
      const lv = e.lvMin + Math.floor(Math.random() * (e.lvMax - e.lvMin + 1));
      return { dexId: e.id, level: lv, shiny: Math.random() < 1/250 };
    }
  }
  return null;
}

loadAllData();
