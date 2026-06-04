// ═══════════════════════════════════════════════════════════════
//  engine.js — Gen-1-getreue Mechanik: IVs, PP, EVs, Stats
// ═══════════════════════════════════════════════════════════════

var STATE = null;
var _iidCounter = 0;

function genIid() { return "p" + (++_iidCounter) + "_" + Date.now(); }

// ══════════════════════════════════════════════════════════════
//  GEN-1 STAT-FORMELN (exakt wie Rot/Blau/Gelb)
// ══════════════════════════════════════════════════════════════

// Gen-1 EV-Bonus: floor(min(255, ceil(sqrt(ev))) / 4)
function evBonus(ev) {
  ev = ev || 0;
  return Math.floor(Math.min(255, Math.ceil(Math.sqrt(ev))) / 4);
}

// HP: floor((Base + IV) * 2 * Level / 100) + Level + 10 + evBonus
function calcHP(base, level, iv, ev) {
  iv = (iv !== undefined) ? iv : 8;
  return Math.max(1, Math.floor((base + iv) * 2 * level / 100) + level + 10 + evBonus(ev));
}

// Andere Stats: floor((Base + IV) * 2 * Level / 100) + 5 + evBonus
function calcStat(base, level, iv, ev) {
  iv = (iv !== undefined) ? iv : 8;
  return Math.max(1, Math.floor((base + iv) * 2 * level / 100) + 5 + evBonus(ev));
}

// ── Gen-1 DVs (Determinant Values, 0–15) ─────────────────────
// HP-DV wird aus anderen DVs berechnet (Gen-1-Regel)
function generateIVs() {
  var atk = Math.floor(Math.random() * 16);
  var def = Math.floor(Math.random() * 16);
  var spe = Math.floor(Math.random() * 16);
  var spc = Math.floor(Math.random() * 16); // Special DV — gilt für SpA UND SpD!
  var hp  = (atk%2)*8 + (def%2)*4 + (spe%2)*2 + (spc%2); // Gen-1-Formel
  return { hp:hp, atk:atk, def:def, spe:spe, spc:spc };
}

// ── EVs (Stat-Erfahrung) initialisieren ───────────────────────
function initEVs() {
  return { hp:0, atk:0, def:0, spe:0, spc:0 };
}

// ── PP für alle Attacken initialisieren ───────────────────────
function initPP(moves) {
  var pp = {};
  (moves || []).forEach(function(mid) {
    pp[mid] = MOVES[mid] ? MOVES[mid].pp : 10;
  });
  return pp;
}

// ── PP-Max für eine Attacke ───────────────────────────────────
function ppMax(moveId) {
  return MOVES[moveId] ? MOVES[moveId].pp : 10;
}

// ── Attacken bestimmen ────────────────────────────────────────
function getLearnedMoves(dexId, level) {
  var pd = PKMN[dexId];
  if (!pd) return ["tackle"];
  var learned = [];
  pd.moves.forEach(function(entry) { if (entry[0] <= level) learned.push(entry[1]); });
  var unique = [];
  learned.reverse().forEach(function(m) {
    if (unique.indexOf(m) < 0 && MOVES[m]) unique.push(m);
  });
  var result = unique.slice(0, 4).reverse();
  if (result.length === 0) result = ["tackle"];
  return result;
}

// ── Pokémon-Instanz erstellen (mit IVs, EVs, PP) ─────────────
function createPkmnInstance(dexId, level) {
  var pd = PKMN[dexId];
  if (!pd) return null;
  var ivs   = generateIVs();
  var evs   = initEVs();
  var moves = getLearnedMoves(dexId, level);
  var maxHP = calcHP(pd.hp, level, ivs.hp, evs.hp);
  return {
    iid:         genIid(),
    dexId:       dexId,
    nick:        "",
    level:       level,
    xp:          0,
    xpToNext:    xpForLevel(level + 1),
    currentHP:   maxHP,
    maxHP:       maxHP,
    atk:         calcStat(pd.atk, level, ivs.atk, evs.atk),
    def:         calcStat(pd.def, level, ivs.def, evs.def),
    spa:         calcStat(pd.spa, level, ivs.spc, evs.spc), // Gen-1: Special DV!
    spd:         calcStat(pd.spd, level, ivs.spc, evs.spc), // Gen-1: gleicher DV!
    spe:         calcStat(pd.spe, level, ivs.spe, evs.spe),
    ivs:         ivs,   // DVs (0-15)
    evs:         evs,   // Stat-EXP
    moves:       moves,
    pp:          initPP(moves), // AP pro Attacke!
    status:      null,
    statusTurns: 0,
    shiny:       false,
  };
}

// ── Altes Pokémon-Objekt auf neue Felder upgraden ─────────────
// (Backward-Kompatibilität mit alten Saves ohne IVs/PP/EVs)
function fixPkmn(p) {
  if (!p) return p;
  // IVs nachrüsten
  if (!p.ivs) {
    p.ivs = generateIVs();
    var pd = PKMN[p.dexId];
    if (pd) {
      var ev = p.evs || initEVs();
      p.maxHP = calcHP(pd.hp,  p.level, p.ivs.hp,  ev.hp);
      p.currentHP = Math.min(p.currentHP, p.maxHP);
      p.atk = calcStat(pd.atk, p.level, p.ivs.atk, ev.atk);
      p.def = calcStat(pd.def, p.level, p.ivs.def, ev.def);
      p.spa = calcStat(pd.spa, p.level, p.ivs.spc, ev.spc);
      p.spd = calcStat(pd.spd, p.level, p.ivs.spc, ev.spc);
      p.spe = calcStat(pd.spe, p.level, p.ivs.spe, ev.spe);
    }
  }
  if (!p.evs)  p.evs  = initEVs();
  if (!p.pp)   p.pp   = initPP(p.moves || []);
  if (p.shiny === undefined) p.shiny = false;
  if (!p.moves || p.moves.length === 0) p.moves = ["tackle"];
  // PP für Attacken die noch nicht im pp-Objekt sind
  (p.moves || []).forEach(function(mid) {
    if (p.pp[mid] === undefined) p.pp[mid] = ppMax(mid);
  });
  return p;
}

// ══════════════════════════════════════════════════════════════
//  XP & LEVEL-UP
// ══════════════════════════════════════════════════════════════
function xpForLevel(level) { return level * level * level; }

function calcXPGain(playerLevel, enemyLevel, baseXP, isTrainer) {
  var base = Math.floor((baseXP * enemyLevel) / 7);
  if (isTrainer) base = Math.floor(base * 1.5);
  var diff = playerLevel - enemyLevel;
  if (diff > 5) base = Math.floor(base * Math.max(0.1, 1 - (diff - 5) * 0.1));
  return Math.max(1, base);
}

// ── EV-Gewinn nach Kampf (Gen-1: Basis-Stats des Gegners) ────
function gainEVs(pkmnInst, enemyDexId) {
  var epd = PKMN[enemyDexId]; if (!epd) return;
  if (!pkmnInst.evs) pkmnInst.evs = initEVs();
  pkmnInst.evs.hp  = Math.min(65535, pkmnInst.evs.hp  + epd.hp);
  pkmnInst.evs.atk = Math.min(65535, pkmnInst.evs.atk + epd.atk);
  pkmnInst.evs.def = Math.min(65535, pkmnInst.evs.def + epd.def);
  pkmnInst.evs.spe = Math.min(65535, pkmnInst.evs.spe + epd.spe);
  pkmnInst.evs.spc = Math.min(65535, pkmnInst.evs.spc + Math.max(epd.spa, epd.spd));
}

// ── Level-Up & Evolution ──────────────────────────────────────
function applyXP(pkmnInst, xpGained, enemyDexId) {
  var msgs = [];
  if (!pkmnInst.ivs) fixPkmn(pkmnInst);
  pkmnInst.xp += xpGained;

  // EV-Gewinn (Stat-Erfahrung aus Rot/Blau)
  if (enemyDexId) gainEVs(pkmnInst, enemyDexId);

  while (pkmnInst.xp >= pkmnInst.xpToNext && pkmnInst.level < 100) {
    pkmnInst.xp -= pkmnInst.xpToNext;
    pkmnInst.level++;
    var pd = PKMN[pkmnInst.dexId];
    var ivs = pkmnInst.ivs;
    var evs = pkmnInst.evs || initEVs();

    // Stats mit IVs + EVs neu berechnen
    var newMaxHP = calcHP(pd.hp, pkmnInst.level, ivs.hp, evs.hp);
    pkmnInst.currentHP = Math.min(pkmnInst.currentHP + (newMaxHP - pkmnInst.maxHP), newMaxHP);
    pkmnInst.maxHP = newMaxHP;
    pkmnInst.atk   = calcStat(pd.atk, pkmnInst.level, ivs.atk, evs.atk);
    pkmnInst.def   = calcStat(pd.def, pkmnInst.level, ivs.def, evs.def);
    pkmnInst.spa   = calcStat(pd.spa, pkmnInst.level, ivs.spc, evs.spc);
    pkmnInst.spd   = calcStat(pd.spd, pkmnInst.level, ivs.spc, evs.spc);
    pkmnInst.spe   = calcStat(pd.spe, pkmnInst.level, ivs.spe, evs.spe);
    pkmnInst.xpToNext = xpForLevel(pkmnInst.level + 1);

    // Neue Attacken lernen
    pd.moves.forEach(function(entry) {
      if (entry[0] === pkmnInst.level && MOVES[entry[1]]) {
        if (pkmnInst.moves.indexOf(entry[1]) < 0) {
          if (pkmnInst.moves.length >= 4) {
            var dropped = pkmnInst.moves.shift();
            if (pkmnInst.pp) delete pkmnInst.pp[dropped];
          }
          pkmnInst.moves.push(entry[1]);
          if (!pkmnInst.pp) pkmnInst.pp = {};
          pkmnInst.pp[entry[1]] = ppMax(entry[1]); // Neue Attacke: voller AP
          msgs.push((pkmnInst.nick || pd.name) + " lernt " + MOVES[entry[1]].name + "!");
        }
      }
    });
    msgs.push((pkmnInst.nick || pd.name) + " ist jetzt Level " + pkmnInst.level + "!");

    // Evolution
    if (pd.evo && pd.evLv && pkmnInst.level >= pd.evLv) {
      var oldName = pkmnInst.nick || pd.name;
      var currentMoves = pkmnInst.moves.slice();
      var currentPP    = pkmnInst.pp ? JSON.parse(JSON.stringify(pkmnInst.pp)) : {};
      pkmnInst.dexId = pd.evo;
      var newPd = PKMN[pd.evo];
      if (newPd) {
        newPd.moves.forEach(function(entry) {
          if (entry[0] <= pkmnInst.level && MOVES[entry[1]]) {
            if (currentMoves.indexOf(entry[1]) < 0) {
              if (currentMoves.length >= 4) {
                var dropped = currentMoves.shift();
                delete currentPP[dropped];
              }
              currentMoves.push(entry[1]);
              currentPP[entry[1]] = ppMax(entry[1]);
            }
          }
        });
      }
      pkmnInst.moves = currentMoves;
      pkmnInst.pp    = currentPP;
      msgs.push("✨ " + oldName + " entwickelt sich zu " + (newPd ? newPd.name : "?") + "!");
    }
  }
  return msgs;
}

// ══════════════════════════════════════════════════════════════
//  FANGEN
// ══════════════════════════════════════════════════════════════
function tryCatch(enemyInst, ballType) {
  var pd = PKMN[enemyInst.dexId];
  var catchRate = pd ? pd.catchRate : 45;
  var ballMult  = { pokeball:1, superball:1.5, hyperball:2, masterball:255 }[ballType] || 1;
  if (ballType === "masterball") return true;
  var hpFactor   = (enemyInst.maxHP * 3 - enemyInst.currentHP * 2) / (enemyInst.maxHP * 3);
  var statusMult = 1;
  if (enemyInst.status === "sleep" || enemyInst.status === "freeze") statusMult = 2;
  else if (enemyInst.status) statusMult = 1.5;
  var effective = Math.max(1, Math.min(255, Math.floor(catchRate * hpFactor * ballMult * statusMult)));
  return Math.floor(Math.random() * 256) < effective;
}

// ══════════════════════════════════════════════════════════════
//  NEUES SPIEL / LADEN
// ══════════════════════════════════════════════════════════════
function initNewGame(uid, trainerName, starterDexId) {
  var starter = createPkmnInstance(starterDexId, 5);
  STATE = {
    uid: uid, name: trainerName, starter: starterDexId,
    party: [starter], box: [],
    items: { pokeball:5, superball:0, hyperball:0, potion:3, superpotion:0 },
    money: 1000, badges: 0, badgeIds: [],
    defeatedTrainers: {},
    visitedZones: { "route1": true },
    currentZoneId: "route1", currentStage: 1,
    lastSeen: Date.now(), version: 4,
  };
  return STATE;
}

function loadGameState(uid, savedState) {
  STATE = savedState;
  STATE.uid = uid;
  if (!STATE.items)            STATE.items = { pokeball:5 };
  if (!STATE.badgeIds)         STATE.badgeIds = [];
  if (!STATE.defeatedTrainers) STATE.defeatedTrainers = {};
  if (!STATE.visitedZones)     STATE.visitedZones = {};

  // IVs/PP/EVs für alle Pokémon sicherstellen
  STATE.party.forEach(function(p) { fixPkmn(p); });
  STATE.box.forEach(function(p)   { fixPkmn(p); });

  // Besuchte Zonen rekonstruieren
  var curIdx = WORLD.findIndex(function(z) { return z.id === STATE.currentZoneId; });
  if (curIdx < 0) curIdx = 0;
  for (var vi = 0; vi <= curIdx; vi++) STATE.visitedZones[WORLD[vi].id] = true;

  var now  = Date.now();
  var away = Math.min((now - (STATE.lastSeen || now)) / 1000, 8 * 3600);
  STATE.lastSeen = now;
  return { state: STATE, awaySeconds: Math.floor(away) };
}

// ══════════════════════════════════════════════════════════════
//  HILFSFUNKTIONEN
// ══════════════════════════════════════════════════════════════
function getActivePkmn() {
  if (!STATE) return null;
  return STATE.party.find(function(p) { return p.currentHP > 0; }) || null;
}

function getPartyAlive() {
  if (!STATE) return 0;
  return STATE.party.filter(function(p) { return p.currentHP > 0; }).length;
}

// Volle Heilung inkl. PP-Restore (Pokémon-Center)
function healPartyFully() {
  if (!STATE) return;
  STATE.party.forEach(function(p) {
    fixPkmn(p);
    p.currentHP      = p.maxHP;
    p.status         = null;
    p.statusTurns    = 0;
    p._faintAnnounced = false;
    // PP komplett auffüllen (Gen-1: Pokémon-Center heilt alles)
    p.moves.forEach(function(mid) {
      p.pp[mid] = ppMax(mid);
    });
  });
}

function addToBox(pkmnInst) {
  STATE.box.push(pkmnInst);
  if (STATE.box.length > 240) STATE.box.shift();
}

function addToParty(pkmnInst) {
  if (STATE.party.length < 6) { STATE.party.push(pkmnInst); return true; }
  return false;
}

// ── Wildes Pokémon (mit IVs, PP und Shiny-Chance 1:250) ──────
function getWildPokemon(zone) {
  if (!zone.wildPokemon || zone.wildPokemon.length === 0) return null;
  var total = zone.wildPokemon.reduce(function(s, e) { return s + e.weight; }, 0);
  var roll  = Math.random() * total, cumulative = 0;
  for (var i = 0; i < zone.wildPokemon.length; i++) {
    cumulative += zone.wildPokemon[i].weight;
    if (roll < cumulative) {
      var entry = zone.wildPokemon[i];
      var lv    = entry.minLv + Math.floor(Math.random() * (entry.maxLv - entry.minLv + 1));
      var pkmn  = createPkmnInstance(entry.dexId, lv);
      pkmn.shiny = Math.random() < (1 / 250);
      return pkmn;
    }
  }
  return null;
}

function getTrainerAtStage(zone, stage) {
  if (!zone.trainers) return null;
  return zone.trainers.find(function(t) { return t.stage === stage; }) || null;
}

function isGymLeaderStage(zone, stage) {
  return zone.gymLeader && zone.gymLeader.stage === stage;
}

function isTrainerDefeated(zoneId, stage) {
  return !!STATE.defeatedTrainers[zoneId + ":" + stage];
}

function markTrainerDefeated(zoneId, stage) {
  STATE.defeatedTrainers[zoneId + ":" + stage] = true;
}

function markZoneVisited(zoneId) {
  if (!STATE.visitedZones) STATE.visitedZones = {};
  STATE.visitedZones[zoneId] = true;
}

function isZoneVisited(zoneId) {
  return !!(STATE.visitedZones && STATE.visitedZones[zoneId]);
}

function saveGame() {
  if (!STATE || !window.dbSet || !window.playerPath) return;
  STATE.lastSeen = Date.now();
  dbSet(playerPath(STATE.uid), STATE).catch(function(e) {
    console.warn("Speichern fehlgeschlagen:", e);
  });
}
