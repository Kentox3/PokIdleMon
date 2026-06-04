// ═══════════════════════════════════════════════════════════════
//  engine.js — Spielzustand, Progression, XP, Fangen
// ═══════════════════════════════════════════════════════════════

var STATE = null;
var _iidCounter = 0;

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
    iid:        genIid(),
    dexId:      dexId,
    nick:       "",
    level:      level,
    xp:         0,
    xpToNext:   xpForLevel(level + 1),
    currentHP:  maxHP,
    maxHP:      maxHP,
    atk:        calcStat(pd.atk, level),
    def:        calcStat(pd.def, level),
    spa:        calcStat(pd.spa, level),
    spd:        calcStat(pd.spd, level),
    spe:        calcStat(pd.spe, level),
    moves:      getLearnedMoves(dexId, level),
    status:     null,
    statusTurns: 0,
  };
}

// ── XP ────────────────────────────────────────────────────────
function xpForLevel(level) { return level * level * level; }

function calcXPGain(playerLevel, enemyLevel, baseXP, isTrainer) {
  var base = Math.floor((baseXP * enemyLevel) / 7);
  if (isTrainer) base = Math.floor(base * 1.5);
  var diff = playerLevel - enemyLevel;
  if (diff > 5) base = Math.floor(base * Math.max(0.1, 1 - (diff - 5) * 0.1));
  return Math.max(1, base);
}

// ── Level-Up & Evolution ──────────────────────────────────────
function applyXP(pkmnInst, xpGained) {
  var msgs = [];
  pkmnInst.xp += xpGained;

  while (pkmnInst.xp >= pkmnInst.xpToNext && pkmnInst.level < 100) {
    pkmnInst.xp -= pkmnInst.xpToNext;
    pkmnInst.level++;
    var pd = PKMN[pkmnInst.dexId];

    // Stats neu berechnen
    var newMaxHP = calcHP(pd.hp, pkmnInst.level);
    pkmnInst.currentHP = Math.min(pkmnInst.currentHP + (newMaxHP - pkmnInst.maxHP), newMaxHP);
    pkmnInst.maxHP = newMaxHP;
    pkmnInst.atk  = calcStat(pd.atk, pkmnInst.level);
    pkmnInst.def  = calcStat(pd.def, pkmnInst.level);
    pkmnInst.spa  = calcStat(pd.spa, pkmnInst.level);
    pkmnInst.spd  = calcStat(pd.spd, pkmnInst.level);
    pkmnInst.spe  = calcStat(pd.spe, pkmnInst.level);
    pkmnInst.xpToNext = xpForLevel(pkmnInst.level + 1);

    // Neue Attacken dieser Spezies auf diesem Level
    pd.moves.forEach(function(entry) {
      if (entry[0] === pkmnInst.level && MOVES[entry[1]]) {
        if (pkmnInst.moves.indexOf(entry[1]) < 0) {
          if (pkmnInst.moves.length >= 4) pkmnInst.moves.shift();
          pkmnInst.moves.push(entry[1]);
          msgs.push((pkmnInst.nick || pd.name) + " lernt " + MOVES[entry[1]].name + "!");
        }
      }
    });

    msgs.push((pkmnInst.nick || pd.name) + " ist jetzt Level " + pkmnInst.level + "!");

    // ── EVOLUTION ─────────────────────────────────────────────
    // BUGFIX: Attacken aus der Vorform BEHALTEN, nur neue hinzufügen
    if (pd.evo && pd.evLv && pkmnInst.level >= pd.evLv) {
      var oldName = pkmnInst.nick || pd.name;
      var currentMoves = pkmnInst.moves.slice(); // alte Attacken merken!
      pkmnInst.dexId = pd.evo;
      var newPd = PKMN[pd.evo];

      if (newPd) {
        // Neue Attacken der Entwicklung die noch nicht bekannt sind
        newPd.moves.forEach(function(entry) {
          if (entry[0] <= pkmnInst.level && MOVES[entry[1]]) {
            if (currentMoves.indexOf(entry[1]) < 0) {
              if (currentMoves.length >= 4) currentMoves.shift();
              currentMoves.push(entry[1]);
            }
          }
        });
      }
      pkmnInst.moves = currentMoves; // gemergter Movepool
      msgs.push("✨ " + oldName + " entwickelt sich zu " + (newPd ? newPd.name : "?") + "!");
    }
  }
  return msgs;
}

// ── Fangen ────────────────────────────────────────────────────
function tryCatch(enemyInst, ballType) {
  var pd = PKMN[enemyInst.dexId];
  var catchRate  = pd ? pd.catchRate : 45;
  var ballMult   = { pokeball:1, superball:1.5, hyperball:2, masterball:255 }[ballType] || 1;
  if (ballType === "masterball") return true;
  var hpFactor   = (enemyInst.maxHP * 3 - enemyInst.currentHP * 2) / (enemyInst.maxHP * 3);
  var statusMult = 1;
  if (enemyInst.status === "sleep" || enemyInst.status === "freeze") statusMult = 2;
  else if (enemyInst.status) statusMult = 1.5;
  var effective  = Math.max(1, Math.min(255, Math.floor(catchRate * hpFactor * ballMult * statusMult)));
  return Math.floor(Math.random() * 256) < effective;
}

// ── Neues Spiel ───────────────────────────────────────────────
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
    visitedZones: { "route1": true },
    currentZoneId: "route1",
    currentStage:  1,
    lastSeen:  Date.now(),
    version:   3,
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
  // Zone als besucht markieren
  STATE.visitedZones[STATE.currentZoneId] = true;
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
    p._faintAnnounced = false;
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

function getWildPokemon(zone) {
  if (!zone.wildPokemon || zone.wildPokemon.length === 0) return null;
  var total = zone.wildPokemon.reduce(function(s, e) { return s + e.weight; }, 0);
  var roll  = Math.random() * total, cumulative = 0;
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
