// ═══════════════════════════════════════════════════════════════
//  engine.js — Spielzustand, Progression, XP, Fangen
// ═══════════════════════════════════════════════════════════════

var STATE = null;
var _iidCounter = 0;

// ── Pokémon-Instanz erstellen ──────────────────────────────────
function genIid() { return "p" + (++_iidCounter) + "_" + Date.now(); }

function calcHP(base, level) {
  return Math.max(1, Math.floor((base * 2 + 8) * level / 100 + level + 10));
}
function calcStat(base, level) {
  return Math.max(1, Math.floor((base * 2 + 8) * level / 100 + 5));
}

function getLearnedMoves(dexId, level) {
  var pd = PKMN[dexId];
  if (!pd) return ["tackle"];
  var learned = [];
  pd.moves.forEach(function(entry) {
    if (entry[0] <= level) learned.push(entry[1]);
  });
  // Keep last 4 unique
  var unique = [];
  learned.reverse().forEach(function(m) {
    if (unique.indexOf(m) < 0 && MOVES[m]) unique.push(m);
  });
  var result = unique.slice(0, 4).reverse();
  if (result.length === 0) result = ["tackle"];
  return result;
}

function createPkmnInstance(dexId, level) {
  var pd = PKMN[dexId];
  if (!pd) return null;
  var maxHP = calcHP(pd.hp, level);
  return {
    iid:       genIid(),
    dexId:     dexId,
    nick:      "",
    level:     level,
    xp:        0,
    xpToNext:  xpForLevel(level + 1),
    currentHP: maxHP,
    maxHP:     maxHP,
    atk:       calcStat(pd.atk, level),
    def:       calcStat(pd.def, level),
    spa:       calcStat(pd.spa, level),
    spd:       calcStat(pd.spd, level),
    spe:       calcStat(pd.spe, level),
    moves:     getLearnedMoves(dexId, level),
    status:    null,
    statusTurns: 0,
  };
}

// ── XP-Formeln ────────────────────────────────────────────────
function xpForLevel(level) {
  // Medium-Fast: n^3
  return level * level * level;
}

function calcXPGain(playerLevel, enemyLevel, baseXP, isTrainer) {
  var base = Math.floor((baseXP * enemyLevel) / 7);
  if (isTrainer) base = Math.floor(base * 1.5);
  // Level-Differenz-Penalty
  var diff = playerLevel - enemyLevel;
  if (diff > 5) {
    var penalty = Math.max(0.1, 1 - (diff - 5) * 0.1);
    base = Math.floor(base * penalty);
  }
  return Math.max(1, base);
}

// ── Level-Up ──────────────────────────────────────────────────
function applyXP(pkmnInst, xpGained) {
  var msgs = [];
  pkmnInst.xp += xpGained;
  while (pkmnInst.xp >= pkmnInst.xpToNext && pkmnInst.level < 100) {
    pkmnInst.xp -= pkmnInst.xpToNext;
    pkmnInst.level++;
    var pd = PKMN[pkmnInst.dexId];
    // Recalc stats
    var newMaxHP = calcHP(pd.hp, pkmnInst.level);
    var hpDiff = newMaxHP - pkmnInst.maxHP;
    pkmnInst.maxHP = newMaxHP;
    pkmnInst.currentHP = Math.min(pkmnInst.currentHP + hpDiff, newMaxHP);
    pkmnInst.atk  = calcStat(pd.atk, pkmnInst.level);
    pkmnInst.def  = calcStat(pd.def, pkmnInst.level);
    pkmnInst.spa  = calcStat(pd.spa, pkmnInst.level);
    pkmnInst.spd  = calcStat(pd.spd, pkmnInst.level);
    pkmnInst.spe  = calcStat(pd.spe, pkmnInst.level);
    pkmnInst.xpToNext = xpForLevel(pkmnInst.level + 1);
    // Check new moves
    pd.moves.forEach(function(entry) {
      if (entry[0] === pkmnInst.level && MOVES[entry[1]]) {
        if (pkmnInst.moves.indexOf(entry[1]) < 0) {
          if (pkmnInst.moves.length >= 4) pkmnInst.moves.shift();
          pkmnInst.moves.push(entry[1]);
          msgs.push(pkmnInst.nick || pd.name + " lernt " + MOVES[entry[1]].name + "!");
        }
      }
    });
    msgs.push((pkmnInst.nick || pd.name) + " ist jetzt Level " + pkmnInst.level + "!");
    // Check evolution
    if (pd.evo && pd.evLv && pkmnInst.level >= pd.evLv) {
      var oldName = pkmnInst.nick || pd.name;
      pkmnInst.dexId = pd.evo;
      var newPd = PKMN[pd.evo];
      pkmnInst.moves = getLearnedMoves(pd.evo, pkmnInst.level);
      msgs.push(oldName + " entwickelt sich zu " + newPd.name + "!");
    }
  }
  return msgs;
}

// ── Fangen ────────────────────────────────────────────────────
function tryCatch(enemyInst, ballType) {
  var pd = PKMN[enemyInst.dexId];
  var catchRate = pd ? pd.catchRate : 45;
  var ballMult  = { pokeball:1, superball:1.5, hyperball:2 }[ballType] || 1;
  var hpFactor  = (enemyInst.maxHP * 3 - enemyInst.currentHP * 2) / (enemyInst.maxHP * 3);
  var statusMult = 1;
  if (enemyInst.status === "sleep" || enemyInst.status === "freeze") statusMult = 2;
  else if (enemyInst.status === "poison" || enemyInst.status === "paralysis" || enemyInst.status === "burn") statusMult = 1.5;

  var effectiveRate = Math.floor(catchRate * hpFactor * ballMult * statusMult);
  effectiveRate = Math.max(1, Math.min(255, effectiveRate));
  var roll = Math.floor(Math.random() * 256);
  return roll < effectiveRate;
}

// ── Initiales STATE ───────────────────────────────────────────
function initNewGame(uid, trainerName, starterDexId) {
  var starter = createPkmnInstance(starterDexId, 5);
  STATE = {
    uid:      uid,
    name:     trainerName,
    starter:  starterDexId,
    party:    [starter],
    box:      [],
    items:    { pokeball:5, superball:0, hyperball:0, potion:3, superpotion:0 },
    money:    1000,
    badges:   0,
    badgeIds: [],
    defeatedTrainers: {},
    currentZoneId: "route1",
    currentStage:  1,
    lastSeen:  Date.now(),
    version:   2,
  };
  return STATE;
}

function loadGameState(uid, savedState) {
  STATE = savedState;
  STATE.uid = uid;
  // Reparatur fehlender Felder
  if (!STATE.items) STATE.items = { pokeball:5 };
  if (!STATE.badgeIds) STATE.badgeIds = [];
  if (!STATE.defeatedTrainers) STATE.defeatedTrainers = {};
  // Offline-Belohnung (max 8 Stunden)
  var now = Date.now();
  var away = Math.min((now - (STATE.lastSeen || now)) / 1000, 8 * 3600);
  STATE.lastSeen = now;
  return { state: STATE, awaySeconds: Math.floor(away) };
}

// ── Hilfsfunktionen ───────────────────────────────────────────
function getActivePkmn() {
  if (!STATE) return null;
  return STATE.party.find(function(p) { return p.currentHP > 0; }) || null;
}

function getPartyAlive() {
  if (!STATE) return 0;
  return STATE.party.filter(function(p) { return p.currentHP > 0; }).length;
}

function healPartyFully() {
  if (!STATE) return;
  STATE.party.forEach(function(p) {
    p.currentHP = p.maxHP;
    p.status = null;
    p.statusTurns = 0;
  });
}

function addToBox(pkmnInst) {
  STATE.box.push(pkmnInst);
  if (STATE.box.length > 240) STATE.box.shift(); // Max 240
}

function addToParty(pkmnInst) {
  if (STATE.party.length < 6) {
    STATE.party.push(pkmnInst);
    return true;
  }
  return false;
}

function getWildPokemon(zone) {
  if (!zone.wildPokemon || zone.wildPokemon.length === 0) return null;
  var total = zone.wildPokemon.reduce(function(s, e) { return s + e.weight; }, 0);
  var roll = Math.random() * total;
  var cumulative = 0;
  for (var i = 0; i < zone.wildPokemon.length; i++) {
    cumulative += zone.wildPokemon[i].weight;
    if (roll < cumulative) {
      var entry = zone.wildPokemon[i];
      var lv = entry.minLv + Math.floor(Math.random() * (entry.maxLv - entry.minLv + 1));
      return createPkmnInstance(entry.dexId, lv);
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

function trainerDefeatedKey(zoneId, stage) {
  return zoneId + ":" + stage;
}

function isTrainerDefeated(zoneId, stage) {
  return !!STATE.defeatedTrainers[trainerDefeatedKey(zoneId, stage)];
}

function markTrainerDefeated(zoneId, stage) {
  STATE.defeatedTrainers[trainerDefeatedKey(zoneId, stage)] = true;
}

// ── Spieldaten speichern ──────────────────────────────────────
function saveGame() {
  if (!STATE || !window.dbSet || !window.playerPath) return;
  STATE.lastSeen = Date.now();
  dbSet(playerPath(STATE.uid), STATE).catch(function(e) {
    console.warn("Speichern fehlgeschlagen:", e);
  });
}
