// ═══════════════════════════════════════════════════════════════
//  battle.js — Kampfsystem (Gen-1 Formel + Auto-KI)
// ═══════════════════════════════════════════════════════════════

var BATTLE = null;  // Aktueller Kampfzustand

// ── Schadenberechnung (Gen-1) ─────────────────────────────────
function calcDamage(attacker, defender, moveId) {
  var move = MOVES[moveId];
  if (!move || move.pwr === 0) return 0;

  var atkPd = PKMN[attacker.dexId];
  var defPd = PKMN[defender.dexId];
  var defTypes = defPd ? defPd.types : ["Normal"];

  // Gen-1: Typ bestimmt physisch/speziell
  var atkStat = isPhysical(move.type) ? attacker.atk : attacker.spa;
  var defStat = isPhysical(move.type) ? defender.def : defender.spd;

  // Basis-Schaden
  var dmg = Math.floor(((2 * attacker.level / 5 + 2) * move.pwr * atkStat / defStat) / 50 + 2);

  // STAB
  if (atkPd && atkPd.types.indexOf(move.type) >= 0) dmg = Math.floor(dmg * 1.5);

  // Typ-Effektivität
  var typeEff = getTypeEffectiveness(move.type, defTypes);
  dmg = Math.floor(dmg * typeEff);

  // Zufallsfaktor (Gen-1: 217–255)
  var rand = 217 + Math.floor(Math.random() * 39);
  dmg = Math.floor(dmg * rand / 255);

  // Kritischer Treffer (vereinfacht: 6% Chance, doppelter Schaden)
  var isCrit = move.highCrit ? Math.random() < 0.125 : Math.random() < 0.0625;
  if (isCrit) dmg = Math.floor(dmg * 2);

  // Multi-Hit
  if (move.hits) {
    var hits = move.hits[0] + Math.floor(Math.random() * (move.hits[1] - move.hits[0] + 1));
    dmg *= hits;
  }

  return { damage: Math.max(1, dmg), typeEff: typeEff, crit: isCrit };
}

// ── Beste Attacke für Auto-KI auswählen ───────────────────────
function autoPickMove(attacker, defender) {
  var defPd = PKMN[defender.dexId];
  var defTypes = defPd ? defPd.types : ["Normal"];
  var bestMove = null;
  var bestScore = -1;
  attacker.moves.forEach(function(mid) {
    var move = MOVES[mid];
    if (!move || move.pwr === 0) return;
    var typeEff = getTypeEffectiveness(move.type, defTypes);
    var score = move.pwr * typeEff;
    // STAB bonus
    var atkPd = PKMN[attacker.dexId];
    if (atkPd && atkPd.types.indexOf(move.type) >= 0) score *= 1.5;
    if (score > bestScore) { bestScore = score; bestMove = mid; }
  });
  return bestMove || attacker.moves[0] || "tackle";
}

// ── Statuseffekt anwenden ──────────────────────────────────────
function applyEffect(target, move, isAttacker) {
  var eff = move.effect;
  if (!eff) return null;
  var msg = null;
  var chance = eff.chance !== undefined ? eff.chance : 1.0;
  if (Math.random() > chance) return null;
  var targetIsEnemy = (target === BATTLE.enemy);
  var targetPd = PKMN[target.dexId];
  switch (eff.type) {
    case "burn":
      if (!target.status) { target.status = "burn"; msg = (targetPd ? targetPd.name : "?") + " ist verbrannt!"; }
      break;
    case "poison":
      if (!target.status) { target.status = "poison"; msg = (targetPd ? targetPd.name : "?") + " ist vergiftet!"; }
      break;
    case "paralysis":
      if (!target.status) { target.status = "paralysis"; msg = (targetPd ? targetPd.name : "?") + " ist gelähmt!"; }
      break;
    case "sleep":
      if (!target.status) {
        target.status = "sleep";
        target.statusTurns = 2 + Math.floor(Math.random() * 3);
        msg = (targetPd ? targetPd.name : "?") + " schläft ein!";
      }
      break;
    case "freeze":
      if (!target.status) { target.status = "freeze"; msg = (targetPd ? targetPd.name : "?") + " ist eingefroren!"; }
      break;
    case "atk-1":  if (target === BATTLE.enemy) BATTLE.enemyAtk  = Math.floor((BATTLE.enemyAtk  || target.atk) * 0.75); break;
    case "def-1":  if (target === BATTLE.enemy) BATTLE.enemyDef  = Math.floor((BATTLE.enemyDef  || target.def) * 0.75); break;
    case "spe-1":  if (target === BATTLE.enemy) BATTLE.enemySpe  = Math.floor((BATTLE.enemySpe  || target.spe) * 0.75); break;
    case "def+1":  if (!targetIsEnemy) BATTLE.playerDef = Math.floor((BATTLE.playerDef || target.def) * 1.25); break;
    case "spa+1":  if (!targetIsEnemy) BATTLE.playerSpa = Math.floor((BATTLE.playerSpa || target.spa) * 1.25); break;
    case "heal50": target.currentHP = Math.min(target.maxHP, target.currentHP + Math.floor(target.maxHP / 2)); msg = (targetPd ? targetPd.name : "?") + " regeneriert HP!"; break;
    case "fullheal": target.currentHP = target.maxHP; target.status = null; target.statusTurns = 0; msg = (targetPd ? targetPd.name : "?") + " regeneriert vollständig!"; break;
    case "drain": var drain = Math.floor(target.maxHP * 0.1); target.currentHP = Math.max(0, target.currentHP - drain); break;
  }
  return msg;
}

// ── Statusschaden am Rundenende ───────────────────────────────
function applyStatusDamage(pkmn) {
  var msg = null;
  if (!pkmn.status) return null;
  var pd = PKMN[pkmn.dexId];
  var name = pd ? pd.name : "?";
  if (pkmn.status === "burn" || pkmn.status === "poison") {
    var dmg = Math.max(1, Math.floor(pkmn.maxHP / 16));
    pkmn.currentHP = Math.max(0, pkmn.currentHP - dmg);
    msg = name + " leidet unter " + (pkmn.status === "burn" ? "Verbrennung" : "Gift") + "! (-" + dmg + " HP)";
  }
  if (pkmn.status === "sleep") {
    pkmn.statusTurns = (pkmn.statusTurns || 1) - 1;
    if (pkmn.statusTurns <= 0) {
      pkmn.status = null;
      msg = name + " ist aufgewacht!";
    } else {
      msg = name + " schläft...";
    }
  }
  return msg;
}

// ── Kampf starten ─────────────────────────────────────────────
function startBattle(type, data) {
  // type: "wild" | "trainer" | "gym"
  // data für wild: createPkmnInstance(...)
  // data für trainer: { name, party:[{dexId,lv},...] }
  var enemyPkmn;
  var trainerPartyQueue = [];

  if (type === "wild") {
    enemyPkmn = data;
  } else {
    // Trainer/Gym: erste Partei aufbauen
    trainerPartyQueue = data.party.map(function(e) {
      return createPkmnInstance(e.dexId, e.lv);
    });
    enemyPkmn = trainerPartyQueue.shift();
  }

  BATTLE = {
    type:     type,
    trainerData: type !== "wild" ? data : null,
    enemy:    enemyPkmn,
    enemyQueue: trainerPartyQueue,
    canFlee:  type === "wild",
    canCatch: type === "wild",
    autoFight: true,
    log:      [],
    over:     false,
    result:   null,  // "win" | "lose" | "flee" | "catch"
    xpGained: 0,
    moneyGained: 0,
    isTrainer: type !== "wild",
  };

  return BATTLE;
}

// ── Spieler-Angriff ausführen ─────────────────────────────────
function doPlayerAttack(moveId) {
  if (!BATTLE || BATTLE.over) return [];
  var player = getActivePkmn();
  if (!player) return [];
  var move = MOVES[moveId] || MOVES["tackle"];
  var log = [];
  var pd = PKMN[player.dexId];
  var epd = PKMN[BATTLE.enemy.dexId];

  // Schlaf-Check
  if (player.status === "sleep") {
    player.statusTurns = (player.statusTurns || 1) - 1;
    if (player.statusTurns <= 0) { player.status = null; log.push((pd ? pd.name : "?") + " ist aufgewacht!"); }
    else { log.push((pd ? pd.name : "?") + " schläft..."); return log; }
  }
  // Lähmungs-Check
  if (player.status === "paralysis" && Math.random() < 0.25) {
    log.push((pd ? pd.name : "?") + " ist voll gelähmt!");
    return log;
  }

  log.push((pd ? pd.name : "?") + " setzt " + move.name + " ein!");

  // Treffer-Check
  var acc = (move.acc || 100) / 100;
  if (Math.random() > acc) {
    log.push("Geht daneben!");
    return log;
  }

  if (move.pwr > 0) {
    var res = calcDamage(player, BATTLE.enemy, moveId);
    BATTLE.enemy.currentHP = Math.max(0, BATTLE.enemy.currentHP - res.damage);
    var effText = res.typeEff > 1 ? " Sehr effektiv!" : (res.typeEff < 1 && res.typeEff > 0 ? " Wenig effektiv..." : (res.typeEff === 0 ? " Hat keine Wirkung!" : ""));
    log.push("-" + res.damage + " HP!" + (res.crit ? " Volltreffer!" : "") + effText);
  }
  // Effekt auf Gegner
  var effMsg = applyEffect(BATTLE.enemy, move, true);
  if (effMsg) log.push(effMsg);

  // Status-Effekt auf sich selbst (Heilen etc.)
  if (move.effect && move.effect.target === "self") {
    var selfMsg = applyEffect(player, move, true);
    if (selfMsg) log.push(selfMsg);
  }

  return log;
}

// ── Gegner-Angriff ausführen ──────────────────────────────────
function doEnemyAttack() {
  if (!BATTLE || BATTLE.over) return [];
  var player = getActivePkmn();
  if (!player) return [];
  var enemy = BATTLE.enemy;
  var epd = PKMN[enemy.dexId];
  var log = [];

  // Schlaf-Check Gegner
  if (enemy.status === "sleep") {
    enemy.statusTurns = (enemy.statusTurns || 1) - 1;
    if (enemy.statusTurns <= 0) { enemy.status = null; log.push((epd ? epd.name : "?") + " ist aufgewacht!"); }
    else { log.push((epd ? epd.name : "?") + " schläft..."); return log; }
  }
  if (enemy.status === "paralysis" && Math.random() < 0.25) {
    log.push((epd ? epd.name : "?") + " ist voll gelähmt!");
    return log;
  }

  var moveId = autoPickMove(enemy, player);
  var move = MOVES[moveId] || MOVES["tackle"];
  log.push((epd ? epd.name : "?") + " setzt " + move.name + " ein!");

  var acc = (move.acc || 100) / 100;
  if (Math.random() > acc) { log.push("Geht daneben!"); return log; }

  if (move.pwr > 0) {
    var res = calcDamage(enemy, player, moveId);
    player.currentHP = Math.max(0, player.currentHP - res.damage);
    log.push((epd ? epd.name : "?") + " macht " + res.damage + " Schaden!" + (res.crit ? " Volltreffer!" : ""));
  }
  var effMsg = applyEffect(player, move, false);
  if (effMsg) log.push(effMsg);

  return log;
}

// ── Ende-of-Turn prüfen ───────────────────────────────────────
function checkBattleEnd() {
  if (!BATTLE || BATTLE.over) return null;
  var log = [];

  // Statusschaden am Ende der Runde
  var psMsg = applyStatusDamage(getActivePkmn());
  if (psMsg) log.push(psMsg);
  var esMsg = applyStatusDamage(BATTLE.enemy);
  if (esMsg) log.push(esMsg);

  // Prüfen ob Gegner besiegt
  if (BATTLE.enemy.currentHP <= 0) {
    var epd = PKMN[BATTLE.enemy.dexId];
    log.push((epd ? epd.name : "?") + " wurde besiegt!");

    // Nächstes Trainer-Pokémon?
    if (BATTLE.enemyQueue && BATTLE.enemyQueue.length > 0) {
      BATTLE.enemy = BATTLE.enemyQueue.shift();
      var nextPd = PKMN[BATTLE.enemy.dexId];
      log.push("Trainer schickt " + (nextPd ? nextPd.name : "?") + " Lv." + BATTLE.enemy.level + "!");
      return { log: log, over: false };
    }

    // Kampf gewonnen
    BATTLE.over = true;
    BATTLE.result = "win";
    var xp = calcXPGain(getActivePkmn() ? getActivePkmn().level : 1, BATTLE.enemy.level, epd ? epd.baseXP : 50, BATTLE.isTrainer);
    BATTLE.xpGained += xp;
    if (BATTLE.trainerData) BATTLE.moneyGained = BATTLE.trainerData.reward || 0;
    log.push("Kampf gewonnen! +" + xp + " EP");
    return { log: log, over: true, result: "win" };
  }

  // Prüfen ob Spieler besiegt
  if (getActivePkmn() && getActivePkmn().currentHP <= 0) {
    // Nächstes Pokémon in der Party?
    var nextPlayer = STATE.party.find(function(p) { return p.currentHP > 0; });
    if (!nextPlayer) {
      BATTLE.over = true;
      BATTLE.result = "lose";
      log.push("Alle Pokémon sind K.O.!");
      return { log: log, over: true, result: "lose" };
    } else {
      var pd = PKMN[nextPlayer.dexId];
      log.push((pd ? pd.name : "?") + " kämpft weiter!");
    }
  }

  return { log: log, over: false };
}

// ── Fangen-Aktion ─────────────────────────────────────────────
function doCatchAttempt(ballType) {
  if (!BATTLE || !BATTLE.canCatch || BATTLE.over) return { caught: false, log: ["Kann nicht fangen!"] };
  if (!STATE.items[ballType] || STATE.items[ballType] <= 0) return { caught: false, log: ["Kein " + ballType + " mehr!"] };
  STATE.items[ballType]--;
  var caught = tryCatch(BATTLE.enemy, ballType);
  var epd = PKMN[BATTLE.enemy.dexId];
  var name = epd ? epd.name : "?";
  if (caught) {
    BATTLE.over = true;
    BATTLE.result = "catch";
    var pkmnCopy = JSON.parse(JSON.stringify(BATTLE.enemy));
    pkmnCopy.iid = genIid();
    var added = addToParty(pkmnCopy);
    if (!added) addToBox(pkmnCopy);
    return { caught: true, log: [name + " wurde gefangen!"], pkmn: pkmnCopy, toParty: added };
  }
  return { caught: false, log: [name + " bricht aus!"] };
}

// ── Flucht ────────────────────────────────────────────────────
function doFlee() {
  if (!BATTLE || !BATTLE.canFlee) return false;
  BATTLE.over = true;
  BATTLE.result = "flee";
  return true;
}
