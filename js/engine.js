// ═══════════════════════════════════════════════════════════════
//  engine.js — Spielzustand, Stats, XP, Evolution, Save/Load
// ═══════════════════════════════════════════════════════════════

var STATE = null;
var _iidCtr = 0;
var GAME_VERSION = 1;

function genIVs() {
  var a=Math.floor(Math.random()*16), d=Math.floor(Math.random()*16),
      s=Math.floor(Math.random()*16), p=Math.floor(Math.random()*16);
  return { kp:(a%2)*8+(d%2)*4+(s%2)*2+(p%2), ang:a, vert:d, init:s, spez:p };
}
function evBonus(ev) { return Math.floor(Math.min(255, Math.ceil(Math.sqrt(ev||0)))/4); }

function berechneKP(basisKP, level, iv, ev) {
  return Math.max(1, Math.floor((basisKP + iv) * 2 * level / 100) + level + 10 + evBonus(ev));
}
function berechneStat(basis, level, iv, ev) {
  return Math.max(1, Math.floor((basis + iv) * 2 * level / 100) + 5 + evBonus(ev));
}

function apMax(moveId) { var m = MOVES[moveId]; return m ? m.ap : 10; }
function initAP(moves) {
  var ap = {};
  (moves || []).forEach(id => { ap[id] = apMax(id); });
  return ap;
}

function getErlernteAttacken(dexId, level) {
  var pd = getPkmn(dexId);
  if (!pd || !pd.attacken) return ["tackle"];
  var learned = pd.attacken
    .filter(e => e[0] <= level)
    .map(e => e[1])
    .filter(id => MOVES[id]);
  var unique = [...new Set(learned.reverse())].slice(0, 4).reverse();
  return unique.length ? unique : ["tackle"];
}

function xpFuerLevel(level, expGruppe) {
  var l = Math.max(1, Math.min(100, level));
  switch (expGruppe || "medium_fast") {
    case "fast":
      return Math.floor(4 * l * l * l / 5);
    case "medium_slow":
      return Math.floor((6 * l * l * l / 5) - (15 * l * l) + (100 * l) - 140);
    case "slow":
      return Math.floor(5 * l * l * l / 4);
    case "medium_fast":
    default:
      return l * l * l;
  }
}

function xpBisNaechstesLevel(pkmnInst) {
  var pd = getPkmn(pkmnInst.dexId);
  var cur = xpFuerLevel(pkmnInst.level, pd && pd.expGruppe);
  var next = xpFuerLevel(pkmnInst.level + 1, pd && pd.expGruppe);
  return Math.max(1, next - cur);
}

function getEvolutionDaten(pd) {
  return pd ? (pd.evo || pd.evolution || null) : null;
}

function pruefeLevelEvolution(pkmnInst) {
  if (!pkmnInst) return null;
  var pd = getPkmn(pkmnInst.dexId);
  var evo = getEvolutionDaten(pd);
  if (evo && evo.typ === "level" && pkmnInst.level >= evo.abLevel) return evo.zuId;
  return null;
}

function createPkmnInst(dexId, level) {
  var pd = getPkmn(dexId);
  if (!pd) return null;
  var ivs = genIVs();
  var evs = { kp:0, ang:0, vert:0, init:0, spez:0 };
  var maxKP = berechneKP(pd.kp, level, ivs.kp, evs.kp);
  var moves = getErlernteAttacken(dexId, level);
  return {
    _iid:  "p" + (++_iidCtr) + "_" + Date.now(),
    dexId: dexId, nick: "", level: level, xp: 0,
    xpBis: xpFuerLevel(level + 1, pd.expGruppe) - xpFuerLevel(level, pd.expGruppe),
    maxKP: maxKP, kp: maxKP,
    ang:   berechneStat(pd.ang,   level, ivs.ang,  evs.ang),
    vert:  berechneStat(pd.vert,  level, ivs.vert, evs.vert),
    spAng: berechneStat(pd.spAng, level, ivs.spez, evs.spez),
    spVert:berechneStat(pd.spVert,level, ivs.spez, evs.spez),
    init:  berechneStat(pd.init,  level, ivs.init, evs.init),
    ivs: ivs, evs: evs,
    attacken: moves, ap: initAP(moves),
    status: null, statusRunden: 0,
    shiny: false, entwickeltSich: null,
    geschlecht: genGeschlecht(dexId),
  };
}

function reparierePkmnInst(p) {
  if (!p) return null;
  if (!p.dexId && p.id) p.dexId = p.id;
  p.dexId = Number(p.dexId);
  var pd = getPkmn(p.dexId);
  if (!pd) return p;

  p.level = Math.max(1, Math.min(100, Number(p.level) || 1));
  if (!p.ivs) p.ivs = genIVs();
  if (!p.evs) p.evs = { kp:0, ang:0, vert:0, init:0, spez:0 };
  ["kp","ang","vert","init","spez"].forEach(k => { p.evs[k] = Number(p.evs[k]) || 0; });
  ["kp","ang","vert","init","spez"].forEach(k => { p.ivs[k] = Number.isFinite(Number(p.ivs[k])) ? Number(p.ivs[k]) : 0; });

  var altesMaxKP = Number(p.maxKP ?? p.maxHp ?? p.maxHP);
  var alteKP = Number(p.kp ?? p.hp ?? p.HP);
  var kpQuote = Number.isFinite(altesMaxKP) && altesMaxKP > 0 && Number.isFinite(alteKP)
    ? Math.max(0, Math.min(1, alteKP / altesMaxKP))
    : 1;

  p.maxKP = berechneKP(pd.kp, p.level, p.ivs.kp, p.evs.kp);
  p.kp = Math.max(0, Math.min(p.maxKP, Math.round(p.maxKP * kpQuote)));
  if (!Number.isFinite(p.kp) || p.kp <= 0 && kpQuote > 0) p.kp = p.maxKP;

  p.ang    = berechneStat(pd.ang,    p.level, p.ivs.ang,  p.evs.ang);
  p.vert   = berechneStat(pd.vert,   p.level, p.ivs.vert, p.evs.vert);
  p.spAng  = berechneStat(pd.spAng,  p.level, p.ivs.spez, p.evs.spez);
  p.spVert = berechneStat(pd.spVert, p.level, p.ivs.spez, p.evs.spez);
  p.init   = berechneStat(pd.init,   p.level, p.ivs.init, p.evs.init);

  if (!Array.isArray(p.attacken) || p.attacken.length === 0) p.attacken = getErlernteAttacken(p.dexId, p.level);
  p.attacken = p.attacken.filter(id => MOVES[id]).slice(0, 4);
  if (p.attacken.length === 0) p.attacken = getErlernteAttacken(p.dexId, p.level);
  if (!p.ap) p.ap = {};
  p.attacken.forEach(id => {
    var cur = Number(p.ap[id]);
    p.ap[id] = Number.isFinite(cur) && cur >= 0 ? cur : apMax(id);
  });

  p.xp = Math.max(0, Number(p.xp) || 0);
  p.xpBis = xpBisNaechstesLevel(p);
  if (p.statusRunden === undefined) p.statusRunden = 0;
  if (p.shiny === undefined) p.shiny = false;
  if (p.geschlecht === undefined) p.geschlecht = genGeschlecht(p.dexId);
  if (!p.entwickeltSich) p.entwickeltSich = pruefeLevelEvolution(p);
  if (!p._iid) p._iid = "p_repair_" + p.dexId + "_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
  return p;
}

function genGeschlecht(dexId) {
  var kein = [29,30,31,32,33,34,115,131,132,142,143,144,145,146,147,148,149,150,151];
  if (kein.includes(Number(dexId))) return null;
  return Math.random() < 0.5 ? "M" : "W";
}

function hatAP(pkmn) {
  return (pkmn.attacken || []).some(id => (pkmn.ap[id] || 0) > 0);
}

function gewinneEVs(pkmnInst, gegnerDexId) {
  var gpd = getPkmn(gegnerDexId);
  if (!gpd || !pkmnInst.evs) return;
  pkmnInst.evs.kp   = Math.min(65535, (pkmnInst.evs.kp||0)   + gpd.kp);
  pkmnInst.evs.ang  = Math.min(65535, (pkmnInst.evs.ang||0)  + gpd.ang);
  pkmnInst.evs.vert = Math.min(65535, (pkmnInst.evs.vert||0) + gpd.vert);
  pkmnInst.evs.init = Math.min(65535, (pkmnInst.evs.init||0) + gpd.init);
  pkmnInst.evs.spez = Math.min(65535, (pkmnInst.evs.spez||0) + Math.max(gpd.spAng||0, gpd.spVert||0));
}

function vergebeXP(pkmnInst, xp, gegnerDexId) {
  var meldungen = [];
  pkmnInst.xp += xp;
  if (gegnerDexId) gewinneEVs(pkmnInst, gegnerDexId);

  while (pkmnInst.xp >= pkmnInst.xpBis && pkmnInst.level < 100) {
    pkmnInst.xp -= pkmnInst.xpBis;
    pkmnInst.level++;
    var pd = getPkmn(pkmnInst.dexId);
    var ivs = pkmnInst.ivs, evs = pkmnInst.evs;
    var neuesMaxKP = berechneKP(pd.kp, pkmnInst.level, ivs.kp, evs.kp);
    pkmnInst.kp = Math.min(pkmnInst.kp + (neuesMaxKP - pkmnInst.maxKP), neuesMaxKP);
    pkmnInst.maxKP = neuesMaxKP;
    pkmnInst.ang   = berechneStat(pd.ang,   pkmnInst.level, ivs.ang,  evs.ang);
    pkmnInst.vert  = berechneStat(pd.vert,  pkmnInst.level, ivs.vert, evs.vert);
    pkmnInst.spAng = berechneStat(pd.spAng, pkmnInst.level, ivs.spez, evs.spez);
    pkmnInst.spVert= berechneStat(pd.spVert,pkmnInst.level, ivs.spez, evs.spez);
    pkmnInst.init  = berechneStat(pd.init,  pkmnInst.level, ivs.init, evs.init);
    pkmnInst.xpBis = xpBisNaechstesLevel(pkmnInst);

    (pd.attacken || []).forEach(e => {
      if (e[0] === pkmnInst.level && MOVES[e[1]]) {
        if (!pkmnInst.attacken.includes(e[1])) {
          if (pkmnInst.attacken.length >= 4) {
            var vergessen = pkmnInst.attacken.shift();
            delete pkmnInst.ap[vergessen];
          }
          pkmnInst.attacken.push(e[1]);
          pkmnInst.ap[e[1]] = apMax(e[1]);
          meldungen.push((pkmnInst.nick || pd.name) + " lernt " + MOVES[e[1]].name + "!");
        }
      }
    });

    meldungen.push((pkmnInst.nick || pd.name) + " ist jetzt Level " + pkmnInst.level + "!");

    var evoZuId = pruefeLevelEvolution(pkmnInst);
    if (evoZuId) {
      pkmnInst.entwickeltSich = evoZuId;
      meldungen.push("✨ " + (pkmnInst.nick || pd.name) + " ist bereit zur Entwicklung!");
    }
  }
  return meldungen;
}

function berechneXPGewinn(eigeneLevel, gegnerLevel, basisXP, istTrainer) {
  var trainerFaktor = istTrainer ? 1.5 : 1;
  var xp = Math.floor((trainerFaktor * basisXP * gegnerLevel) / 7);
  if (!istTrainer && eigeneLevel > 1 && gegnerLevel < eigeneLevel * 0.5) {
    var levelFaktor = gegnerLevel / (eigeneLevel * 0.5);
    xp = Math.floor(xp * Math.max(0.25, levelFaktor));
  }
  return Math.max(1, xp);
}

function versucheFangen(gegner, ballTyp) {
  if (ballTyp === "masterball") return true;
  var pd = getPkmn(gegner.dexId);
  var fangrate = pd ? pd.fangrate : 45;
  var ballMult = { pokeball:1, superball:1.5, hyperball:2 }[ballTyp] || 1;
  var kpFaktor = (gegner.maxKP * 3 - gegner.kp * 2) / (gegner.maxKP * 3);
  var statusMult = (gegner.status === "schlaf" || gegner.status === "einfriere") ? 2
                 : gegner.status ? 1.5 : 1;
  var eff = Math.max(1, Math.min(255, Math.floor(fangrate * kpFaktor * ballMult * statusMult)));
  return Math.floor(Math.random() * 256) < eff;
}

function aktivePkmn() {
  if (!STATE) return null;
  STATE.party.forEach(p => reparierePkmnInst(p));
  return STATE.party.find(p => Number(p.kp) > 0) || null;
}

// FIX: Leerzeichen im Funktionsnamen entfernt (war: "partyAm Leben")
function partyAmLeben() {
  if (!STATE) return 0;
  STATE.party.forEach(p => reparierePkmnInst(p));
  return STATE.party.filter(p => Number(p.kp) > 0).length;
}

function inBox(pkmnInst) {
  if (!STATE.box) STATE.box = [];
  if (pkmnInst && pkmnInst._iid && STATE.box.some(p => p && p._iid === pkmnInst._iid)) return true;
  if (pkmnInst && pkmnInst._iid && STATE.party && STATE.party.some(p => p && p._iid === pkmnInst._iid)) return true;
  STATE.box.push(pkmnInst);
  if (STATE.box.length > 240) STATE.box.shift();
  return true;
}
function inParty(pkmnInst) {
  if (!STATE.party) STATE.party = [];
  if (pkmnInst && pkmnInst._iid && STATE.party.some(p => p && p._iid === pkmnInst._iid)) return true;
  if (pkmnInst && pkmnInst._iid && STATE.box && STATE.box.some(p => p && p._iid === pkmnInst._iid)) return true;
  if (STATE.party.length < 6) { STATE.party.push(pkmnInst); return true; }
  return false;
}
function vollHeilen() {
  if (!STATE) return;
  STATE.party.forEach(p => {
    reparierePkmnInst(p);
    p.kp = p.maxKP; p.status = null; p.statusRunden = 0;
    if (p.attacken) p.attacken.forEach(id => { p.ap[id] = apMax(id); });
  });
}

function flagGesetzt(id)  { return !!(id && STATE && STATE.flags && STATE.flags[id]); }
function setzeFlag(id)    { if (id && STATE) { if (!STATE.flags) STATE.flags = {}; STATE.flags[id] = true; } }
function zonenBesucht(id) { return !!(STATE && STATE.besucht && STATE.besucht[id]); }
function markiereBesucht(id) { if (STATE) { if (!STATE.besucht) STATE.besucht = {}; STATE.besucht[id] = true; } }
function trainerBesiegt(zoneId, etappe) { return !!(STATE && STATE.besiegt && STATE.besiegt[zoneId + ":" + etappe]); }
function markiereTrainerBesiegt(zoneId, etappe) { if (STATE) { if (!STATE.besiegt) STATE.besiegt = {}; STATE.besiegt[zoneId + ":" + etappe] = true; } }
function itemAktiv(id) { return !!(STATE && STATE.aktiveItems && STATE.aktiveItems[id] && STATE.items && STATE.items[id] > 0); }
function setzeItemAktiv(id, aktiv) {
  if (!STATE) return;
  if (!STATE.aktiveItems) STATE.aktiveItems = {};
  if (aktiv && STATE.items && STATE.items[id] > 0) STATE.aktiveItems[id] = true;
  else delete STATE.aktiveItems[id];
}

function neuesSpiel(uid, trainerName, starterDexId) {
  var starter = createPkmnInst(starterDexId, 5);
  STATE = {
    version: GAME_VERSION, uid: uid, name: trainerName, starter: starterDexId,
    party: [starter], box: [],
    items: { pokeball: 5, potion: 3 },
    aktiveItems: {},
    geld: 1000, orden: 0, ordenIds: [],
    besucht: { alabastia: true }, besiegt: {}, flags: {}, legendaryRespawns: {},
    gesehen: {}, gefangen: {},
    zone: "alabastia", respawnZone: "alabastia", etappe: 1, gebaeude: null, zuletzt: Date.now(),
  };
  STATE.gefangen[starterDexId] = true;
  STATE.gesehen[starterDexId]  = true;
  return STATE;
}

function speichern() {
  if (!STATE || !STATE.uid) return;
  if (typeof dbSetze !== "function") return;
  STATE.zuletzt = Date.now();
  dbSetze(spielerPfad(STATE.uid), STATE).catch(e => console.warn("[Save]", e));
}

function ladeSpiel(uid, gespeichert) {
  STATE = gespeichert;
  STATE.uid = uid;
  if (!STATE.items)    STATE.items   = {};
  if (!STATE.aktiveItems) STATE.aktiveItems = {};
  if (!STATE.besucht)  STATE.besucht = { alabastia: true };
  if (!STATE.besiegt)  STATE.besiegt = {};
  if (!STATE.flags)    STATE.flags   = {};
  if (!STATE.legendaryRespawns) STATE.legendaryRespawns = {};
  if (!STATE.gesehen)  STATE.gesehen = {};
  if (!STATE.gefangen) STATE.gefangen = {};
  if (!STATE.party)    STATE.party   = [];
  if (!STATE.box)      STATE.box     = [];
  if (!STATE.ordenIds) STATE.ordenIds = [];
  if (!STATE.respawnZone || !getZone(STATE.respawnZone)) STATE.respawnZone = "alabastia";
  migriereAlteZonenIds();
  migriereAlteMaschinenItems();
  migriereArenaTmBelohnungen();
  STATE.geld = Number(STATE.geld);
  if (!Number.isFinite(STATE.geld)) STATE.geld = 1000;
  if (STATE.geld <= 0 && !STATE.flags.money_repair_v1) {
    STATE.geld = 1000;
    STATE.flags.money_repair_v1 = true;
  }
  if (!Number.isFinite(Number(STATE.orden))) STATE.orden = (STATE.ordenIds || []).length;
  if (!Number.isFinite(Number(STATE.etappe)) || Number(STATE.etappe) < 1) STATE.etappe = 1;
  Object.keys(STATE.aktiveItems).forEach(id => {
    if (!STATE.items[id]) delete STATE.aktiveItems[id];
  });

  if (!STATE.version || STATE.version < GAME_VERSION) {
    STATE.besucht = { alabastia: true };
    if (STATE.zone) STATE.besucht[STATE.zone] = true;
    STATE.version = GAME_VERSION;
  }

  STATE.besucht["alabastia"] = true;
  if (STATE.zone) STATE.besucht[STATE.zone] = true;

  STATE.party = STATE.party.map(reparierePkmnInst).filter(p => p && getPkmn(p.dexId));
  STATE.box = STATE.box.map(reparierePkmnInst).filter(p => p && getPkmn(p.dexId));
  if (STATE.party.length === 0 && STATE.starter && getPkmn(STATE.starter)) {
    STATE.party.push(createPkmnInst(STATE.starter, 5));
  }

  var weg = Math.min((Date.now() - (STATE.zuletzt || Date.now())) / 1000, 8 * 3600);
  STATE.zuletzt = Date.now();
  speichern();
  return { state: STATE, wegSekunden: Math.floor(weg) };
}

function migriereAlteMaschinenItems() {
  if (!STATE || !STATE.items) return;
  var map = {
    hm_cut: "hm01",
    hm_fly: "hm02",
    hm_surf: "hm03",
    hm_strength: "hm04",
    hm_flash: "hm05",
  };
  Object.keys(map).forEach(altId => {
    var neuId = map[altId];
    if (STATE.items[altId] > 0) {
      STATE.items[neuId] = Math.max(STATE.items[neuId] || 0, STATE.items[altId]);
      delete STATE.items[altId];
    }
    if (STATE.aktiveItems && STATE.aktiveItems[altId]) {
      STATE.aktiveItems[neuId] = true;
      delete STATE.aktiveItems[altId];
    }
  });
}

function migriereAlteZonenIds() {
  if (!STATE) return;
  var map = {
    route24_25: "route24",
    route5_6: "route5",
    route7_8: "route7",
    route11_12: "route11",
    route16_18: "route16",
    route19_20: "route19",
  };
  if (map[STATE.zone]) STATE.zone = map[STATE.zone];
  if (map[STATE.prevZone]) STATE.prevZone = map[STATE.prevZone];
}

function migriereArenaTmBelohnungen() {
  if (!STATE || !STATE.items || !STATE.flags || STATE.flags.gym_tm_rewards_v1) return;
  var map = {
    boulder: "tm34",
    cascade: "tm11",
    thunder: "tm24",
    rainbow: "tm21",
    soul: "tm06",
    marsh: "tm46",
    volcano: "tm38",
    earth: "tm27",
  };
  (STATE.ordenIds || []).forEach(ordenId => {
    var itemId = map[ordenId];
    if (itemId && !(STATE.items[itemId] > 0)) STATE.items[itemId] = 1;
  });
  STATE.flags.gym_tm_rewards_v1 = true;
}
