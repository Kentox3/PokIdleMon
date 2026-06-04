// ═══════════════════════════════════════════════════════════════
//  battle.js — Kampfsystem mit korrekter Ohnmacht-Erkennung
// ═══════════════════════════════════════════════════════════════

var BATTLE = null;

// ── Schadenberechnung (Gen-1) ─────────────────────────────────
function calcDamage(attacker, defender, moveId) {
  var move = MOVES[moveId];
  if (!move || move.pwr === 0) return { damage: 0, typeEff: 1, crit: false };
  var atkPd = PKMN[attacker.dexId], defPd = PKMN[defender.dexId];
  var defTypes = defPd ? defPd.types : ["Normal"];
  var atkStat  = isPhysical(move.type) ? attacker.atk : attacker.spa;
  var defStat  = isPhysical(move.type) ? defender.def : defender.spd;
  var dmg = Math.floor(((2 * attacker.level / 5 + 2) * move.pwr * atkStat / defStat) / 50 + 2);
  if (atkPd && atkPd.types.indexOf(move.type) >= 0) dmg = Math.floor(dmg * 1.5);
  var typeEff = getTypeEffectiveness(move.type, defTypes);
  dmg = Math.floor(dmg * typeEff);
  var rand = 217 + Math.floor(Math.random() * 39);
  dmg = Math.floor(dmg * rand / 255);
  var isCrit = move.highCrit ? Math.random() < 0.125 : Math.random() < 0.0625;
  if (isCrit) dmg = Math.floor(dmg * 2);
  if (move.hits) {
    var hits = move.hits[0] + Math.floor(Math.random() * (move.hits[1] - move.hits[0] + 1));
    dmg *= hits;
  }
  return { damage: Math.max(1, dmg), typeEff: typeEff, crit: isCrit };
}

// ── Beste Attacke (Auto-KI) ────────────────────────────────────
function autoPickMove(attacker, defender) {
  var defPd = PKMN[defender.dexId];
  var defTypes = defPd ? defPd.types : ["Normal"];
  var bestMove = null, bestScore = -1;
  attacker.moves.forEach(function(mid) {
    var move = MOVES[mid];
    if (!move || move.pwr === 0) return;
    var eff = getTypeEffectiveness(move.type, defTypes);
    var score = move.pwr * eff;
    var atkPd = PKMN[attacker.dexId];
    if (atkPd && atkPd.types.indexOf(move.type) >= 0) score *= 1.5;
    if (score > bestScore) { bestScore = score; bestMove = mid; }
  });
  return bestMove || attacker.moves[0] || "tackle";
}

// ── Statuseffekt anwenden ──────────────────────────────────────
function applyEffect(target, move) {
  var eff = move.effect;
  if (!eff) return null;
  var chance = eff.chance !== undefined ? eff.chance : 1.0;
  if (Math.random() > chance) return null;
  var pd = PKMN[target.dexId];
  var name = pd ? pd.name : "?";
  switch (eff.type) {
    case "burn":      if (!target.status) { target.status="burn";      return name+" ist verbrannt!"; }        break;
    case "poison":    if (!target.status) { target.status="poison";    return name+" ist vergiftet!"; }        break;
    case "paralysis": if (!target.status) { target.status="paralysis"; return name+" ist gelähmt!"; }          break;
    case "sleep":     if (!target.status) { target.status="sleep"; target.statusTurns=2+Math.floor(Math.random()*3); return name+" schläft ein!"; } break;
    case "freeze":    if (!target.status) { target.status="freeze";    return name+" ist eingefroren!"; }      break;
    case "heal50":    target.currentHP=Math.min(target.maxHP,target.currentHP+Math.floor(target.maxHP/2)); return name+" regeneriert HP!";
    case "fullheal":  target.currentHP=target.maxHP; target.status=null; target.statusTurns=0; return name+" ist vollständig erholt!";
    case "drain":     target.currentHP=Math.max(0,target.currentHP-Math.floor(target.maxHP*0.1)); break;
    case "atk-1":     if (target===BATTLE.enemy) BATTLE.enemyAtk=Math.floor((BATTLE.enemyAtk||target.atk)*0.75); break;
    case "def-1":     if (target===BATTLE.enemy) BATTLE.enemyDef=Math.floor((BATTLE.enemyDef||target.def)*0.75); break;
    case "spe-1":     if (target===BATTLE.enemy) BATTLE.enemySpe=Math.floor((BATTLE.enemySpe||target.spe)*0.75); break;
    case "def+1":     BATTLE.playerDef=Math.floor((BATTLE.playerDef||target.def)*1.25); break;
    case "spa+1":     BATTLE.playerSpa=Math.floor((BATTLE.playerSpa||target.spa)*1.25); break;
    case "atk+2":     BATTLE.playerAtk=Math.floor((BATTLE.playerAtk||target.atk)*1.5); break;
  }
  return null;
}

// ── Statusschaden Rundenende ───────────────────────────────────
function applyStatusDamage(pkmn) {
  if (!pkmn || !pkmn.status) return null;
  var pd = PKMN[pkmn.dexId], name = pd ? pd.name : "?";
  if (pkmn.status === "burn" || pkmn.status === "poison") {
    var dmg = Math.max(1, Math.floor(pkmn.maxHP / 16));
    pkmn.currentHP = Math.max(0, pkmn.currentHP - dmg);
    return name + " leidet! (-" + dmg + " HP)";
  }
  if (pkmn.status === "sleep") {
    pkmn.statusTurns = (pkmn.statusTurns || 1) - 1;
    if (pkmn.statusTurns <= 0) { pkmn.status = null; return name + " ist aufgewacht!"; }
    return name + " schläft...";
  }
  return null;
}

// ── Kampf starten ─────────────────────────────────────────────
function startBattle(type, data) {
  // _faintAnnounced zurücksetzen
  STATE.party.forEach(function(p) { p._faintAnnounced = false; });

  var enemyPkmn, queue = [];
  if (type === "wild") {
    enemyPkmn = data;
  } else {
    queue = data.party.map(function(e) { return createPkmnInstance(e.dexId, e.lv); });
    enemyPkmn = queue.shift();
  }

  BATTLE = {
    type: type, trainerData: type !== "wild" ? data : null,
    enemy: enemyPkmn, enemyQueue: queue,
    canFlee: type === "wild", canCatch: type === "wild",
    autoFight: true, over: false, result: null,
    xpGained: 0, moneyGained: 0, isTrainer: type !== "wild",
  };
  return BATTLE;
}

// ── Spieler-Angriff ───────────────────────────────────────────
function doPlayerAttack(moveId) {
  if (!BATTLE || BATTLE.over) return [];
  var player = getActivePkmn();
  if (!player) return [];
  var move = MOVES[moveId] || MOVES["tackle"];
  var pd = PKMN[player.dexId], log = [];

  if (player.status === "sleep") {
    player.statusTurns = (player.statusTurns || 1) - 1;
    if (player.statusTurns <= 0) { player.status = null; log.push((pd?pd.name:"?") + " ist aufgewacht!"); }
    else { log.push((pd?pd.name:"?") + " schläft..."); return log; }
  }
  if (player.status === "paralysis" && Math.random() < 0.25) {
    log.push((pd?pd.name:"?") + " ist voll gelähmt!"); return log;
  }
  log.push((pd?pd.name:"?") + " setzt " + move.name + " ein!");
  if (Math.random() > (move.acc || 100) / 100) { log.push("Geht daneben!"); return log; }
  if (move.pwr > 0) {
    var res = calcDamage(player, BATTLE.enemy, moveId);
    BATTLE.enemy.currentHP = Math.max(0, BATTLE.enemy.currentHP - res.damage);
    var eff = res.typeEff > 1 ? " Sehr effektiv!" : (res.typeEff < 1 && res.typeEff > 0 ? " Wenig effektiv..." : res.typeEff === 0 ? " Keine Wirkung!" : "");
    log.push("-" + res.damage + " HP!" + (res.crit ? " Volltreffer!" : "") + eff);
  }
  var em = applyEffect(BATTLE.enemy, move); if (em) log.push(em);
  if (move.effect && move.effect.target === "self") { var sm = applyEffect(player, move); if (sm) log.push(sm); }
  return log;
}

// ── Gegner-Angriff ────────────────────────────────────────────
function doEnemyAttack() {
  if (!BATTLE || BATTLE.over) return [];
  var player = getActivePkmn();
  if (!player) return [];
  var enemy = BATTLE.enemy, epd = PKMN[enemy.dexId], log = [];
  if (enemy.status === "sleep") {
    enemy.statusTurns = (enemy.statusTurns || 1) - 1;
    if (enemy.statusTurns <= 0) { enemy.status = null; log.push((epd?epd.name:"?") + " ist aufgewacht!"); }
    else { log.push((epd?epd.name:"?") + " schläft..."); return log; }
  }
  if (enemy.status === "paralysis" && Math.random() < 0.25) { log.push((epd?epd.name:"?") + " ist voll gelähmt!"); return log; }
  var moveId = autoPickMove(enemy, player);
  var move = MOVES[moveId] || MOVES["tackle"];
  log.push((epd?epd.name:"?") + " setzt " + move.name + " ein!");
  if (Math.random() > (move.acc || 100) / 100) { log.push("Geht daneben!"); return log; }
  if (move.pwr > 0) {
    var res = calcDamage(enemy, player, moveId);
    player.currentHP = Math.max(0, player.currentHP - res.damage);
    log.push((epd?epd.name:"?") + " macht " + res.damage + " Schaden!" + (res.crit ? " Volltreffer!" : ""));
  }
  var em = applyEffect(player, move); if (em) log.push(em);
  return log;
}

// ── Rundenende prüfen ─────────────────────────────────────────
// BUGFIX: _faintAnnounced-Flag verhindert dass Ohnmacht verpasst wird
function checkBattleEnd() {
  if (!BATTLE || BATTLE.over) return null;
  var log = [];

  // Statusschaden
  var active = getActivePkmn();
  var ps = applyStatusDamage(active); if (ps) log.push(ps);
  var es = applyStatusDamage(BATTLE.enemy); if (es) log.push(es);

  // ── Gegner besiegt ────────────────────────────────────────
  if (BATTLE.enemy.currentHP <= 0) {
    var epd = PKMN[BATTLE.enemy.dexId];
    log.push("💥 " + (epd?epd.name:"?") + " wurde besiegt!");
    var xp = calcXPGain(active ? active.level : 1, BATTLE.enemy.level, epd?epd.baseXP:50, BATTLE.isTrainer);
    BATTLE.xpGained += xp;
    if (BATTLE.enemyQueue && BATTLE.enemyQueue.length > 0) {
      BATTLE.enemy = BATTLE.enemyQueue.shift();
      var np = PKMN[BATTLE.enemy.dexId];
      log.push("Trainer schickt " + (np?np.name:"?") + " Lv." + BATTLE.enemy.level + "!");
      return { log: log, over: false };
    }
    BATTLE.over = true; BATTLE.result = "win";
    if (BATTLE.trainerData) BATTLE.moneyGained = BATTLE.trainerData.reward || 0;
    log.push("Kampf gewonnen! +" + xp + " EP");
    return { log: log, over: true, result: "win" };
  }

  // ── Spieler-Pokémon K.O. — KEY FIX ───────────────────────
  // Alle Party-Pokémon prüfen die noch nicht als K.O. gemeldet wurden
  var justFainted = STATE.party.find(function(p) {
    return p.currentHP <= 0 && !p._faintAnnounced;
  });

  if (justFainted) {
    justFainted._faintAnnounced = true;
    var fpd = PKMN[justFainted.dexId];
    log.push("😵 " + (fpd?fpd.name:"?") + " hat keine Kraft mehr!");

    // Nächstes lebendiges Pokémon suchen
    var nextAlive = STATE.party.find(function(p) { return p.currentHP > 0; });

    if (!nextAlive) {
      // ALLE K.O. → Ohnmacht!
      BATTLE.over = true; BATTLE.result = "lose";
      log.push("Alle Pokémon sind K.O.!");
      log.push("Du verlierst das Bewusstsein...");
      return { log: log, over: true, result: "lose" };
    }

    // Nächstes einwechseln
    var npd = PKMN[nextAlive.dexId];
    log.push("Auf! " + (npd?npd.name:"?") + " kämpft weiter!");
    return { log: log, over: false, playerSwitched: true };
  }

  return { log: log, over: false };
}

// ── Fangen ────────────────────────────────────────────────────
function doCatchAttempt(ballType) {
  if (!BATTLE || !BATTLE.canCatch || BATTLE.over) return { caught:false, log:["Kann nicht fangen!"] };
  if (!STATE.items[ballType] || STATE.items[ballType] <= 0) return { caught:false, log:["Kein " + ballType + "!"] };
  STATE.items[ballType]--;
  var caught = tryCatch(BATTLE.enemy, ballType);
  var epd = PKMN[BATTLE.enemy.dexId], name = epd?epd.name:"?";
  if (caught) {
    BATTLE.over = true; BATTLE.result = "catch";
    var copy = JSON.parse(JSON.stringify(BATTLE.enemy));
    copy.iid = genIid();
    var added = addToParty(copy);
    if (!added) addToBox(copy);
    return { caught:true, log:[name+" wurde gefangen!"], pkmn:copy, toParty:added };
  }
  return { caught:false, log:[name+" bricht aus!"] };
}

// ── Flucht ────────────────────────────────────────────────────
function doFlee() {
  if (!BATTLE || !BATTLE.canFlee) return false;
  BATTLE.over = true; BATTLE.result = "flee"; return true;
}
