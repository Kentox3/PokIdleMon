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

function xpFuerLevel(level) { return level * level * level; }

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
    xpBis: xpFuerLevel(level + 1),
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
    pkmnInst.xpBis = xpFuerLevel(pkmnInst.level + 1);

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

    if (pd.evolution && pd.evolution.typ === "level" && pkmnInst.level >= pd.evolution.abLevel) {
      pkmnInst.entwickeltSich = pd.evolution.zuId;
      meldungen.push("✨ " + (pkmnInst.nick || pd.name) + " ist bereit zur Entwicklung!");
    }
  }
  return meldungen;
}

function berechneXPGewinn(eigeneLevel, gegnerLevel, basisXP, istTrainer) {
  var basis = Math.floor((basisXP * gegnerLevel) / 7);
  if (istTrainer) basis = Math.floor(basis * 1.5);
  var diff = eigeneLevel - gegnerLevel;
  if (diff > 5) basis = Math.floor(basis * Math.max(0.1, 1 - (diff - 5) * 0.1));
  return Math.max(1, basis);
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
  return STATE.party.find(p => p.kp > 0) || null;
}

// FIX: Leerzeichen im Funktionsnamen entfernt (war: "partyAm Leben")
function partyAmLeben() {
  if (!STATE) return 0;
  return STATE.party.filter(p => p.kp > 0).length;
}

function inBox(pkmnInst) {
  if (!STATE.box) STATE.box = [];
  STATE.box.push(pkmnInst);
  if (STATE.box.length > 240) STATE.box.shift();
}
function inParty(pkmnInst) {
  if (!STATE.party) STATE.party = [];
  if (STATE.party.length < 6) { STATE.party.push(pkmnInst); return true; }
  return false;
}
function vollHeilen() {
  if (!STATE) return;
  STATE.party.forEach(p => {
    p.kp = p.maxKP; p.status = null; p.statusRunden = 0;
    if (p.attacken) p.attacken.forEach(id => { p.ap[id] = apMax(id); });
  });
}

function flagGesetzt(id)  { return !!(STATE && STATE.flags && STATE.flags[id]); }
function setzeFlag(id)    { if (STATE) { if (!STATE.flags) STATE.flags = {}; STATE.flags[id] = true; } }
function zonenBesucht(id) { return !!(STATE && STATE.besucht && STATE.besucht[id]); }
function markiereBesucht(id) { if (STATE) { if (!STATE.besucht) STATE.besucht = {}; STATE.besucht[id] = true; } }
function trainerBesiegt(zoneId, etappe) { return !!(STATE && STATE.besiegt && STATE.besiegt[zoneId + ":" + etappe]); }
function markiereTrainerBesiegt(zoneId, etappe) { if (STATE) { if (!STATE.besiegt) STATE.besiegt = {}; STATE.besiegt[zoneId + ":" + etappe] = true; } }

function neuesSpiel(uid, trainerName, starterDexId) {
  var starter = createPkmnInst(starterDexId, 5);
  STATE = {
    version: GAME_VERSION, uid: uid, name: trainerName, starter: starterDexId,
    party: [starter], box: [],
    items: { pokeball: 5, potion: 3 },
    geld: 1000, orden: 0, ordenIds: [],
    besucht: { alabastia: true }, besiegt: {}, flags: {},
    gesehen: {}, gefangen: {},
    zone: "alabastia", etappe: 1, gebaeude: null, zuletzt: Date.now(),
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
  if (!STATE.besucht)  STATE.besucht = { alabastia: true };
  if (!STATE.besiegt)  STATE.besiegt = {};
  if (!STATE.flags)    STATE.flags   = {};
  if (!STATE.gesehen)  STATE.gesehen = {};
  if (!STATE.gefangen) STATE.gefangen = {};
  if (!STATE.party)    STATE.party   = [];
  if (!STATE.box)      STATE.box     = [];
  if (!STATE.ordenIds) STATE.ordenIds = [];

  if (!STATE.version || STATE.version < GAME_VERSION) {
    STATE.besucht = { alabastia: true };
    if (STATE.zone) STATE.besucht[STATE.zone] = true;
    STATE.version = GAME_VERSION;
  }

  STATE.besucht["alabastia"] = true;
  if (STATE.zone) STATE.besucht[STATE.zone] = true;

  [...STATE.party, ...STATE.box].forEach(p => {
    if (p && !p.ap)  p.ap  = initAP(p.attacken || []);
    if (p && !p.evs) p.evs = { kp:0, ang:0, vert:0, init:0, spez:0 };
    if (p && !p.ivs) p.ivs = genIVs();
  });

  var weg = Math.min((Date.now() - (STATE.zuletzt || Date.now())) / 1000, 8 * 3600);
  STATE.zuletzt = Date.now();
  return { state: STATE, wegSekunden: Math.floor(weg) };
}
