// ═══════════════════════════════════════════════════════════════
//  battle.js — Gen-1-Kampfsystem mit PP, Struggle, IVs, Pokédex
// ═══════════════════════════════════════════════════════════════

var BATTLE = null;

function calcDamage(attacker, defender, moveId) {
  var move = MOVES[moveId];
  if (!move || move.pwr === 0) return { damage: 0, typeEff: 1, crit: false };
  var atkPd = PKMN[attacker.dexId], defPd = PKMN[defender.dexId];
  var defTypes = defPd ? defPd.types : ["Normal"];
  var atkStat = isPhysical(move.type) ? attacker.atk : attacker.spa;
  var defStat = isPhysical(move.type) ? defender.def : defender.spd;
  if (BATTLE) {
    if (attacker === getActivePkmn()) {
      if (BATTLE.playerAtk && isPhysical(move.type))  atkStat = BATTLE.playerAtk;
      if (BATTLE.playerSpa && !isPhysical(move.type)) atkStat = BATTLE.playerSpa;
    }
    if (attacker === BATTLE.enemy && BATTLE.enemyAtk && isPhysical(move.type)) atkStat = BATTLE.enemyAtk;
    if (defender === BATTLE.enemy && BATTLE.enemyDef && isPhysical(move.type)) defStat = BATTLE.enemyDef;
  }
  var dmg = Math.floor(((2 * attacker.level / 5 + 2) * move.pwr * atkStat / defStat) / 50 + 2);
  if (atkPd && atkPd.types.indexOf(move.type) >= 0) dmg = Math.floor(dmg * 1.5);
  var typeEff = getTypeEffectiveness(move.type, defTypes);
  dmg = Math.floor(dmg * typeEff);
  var rand = 217 + Math.floor(Math.random() * 39);
  dmg = Math.floor(dmg * rand / 255);
  var critChance = Math.min(255, Math.floor(move.highCrit ? attacker.spe / 2 : attacker.spe / 8));
  var isCrit = Math.floor(Math.random() * 256) < critChance;
  if (isCrit) dmg = Math.floor(dmg * 2);
  if (move.hits) {
    var hits = move.hits[0] + Math.floor(Math.random() * (move.hits[1] - move.hits[0] + 1));
    dmg *= hits;
  }
  return { damage: Math.max(1, dmg), typeEff: typeEff, crit: isCrit };
}

function hasPP(pkmnInst) {
  if (!pkmnInst.pp) return true;
  return pkmnInst.moves.some(function(mid) { return (pkmnInst.pp[mid] || 0) > 0; });
}
function moveHasPP(pkmnInst, moveId) {
  if (!pkmnInst.pp) return true;
  return (pkmnInst.pp[moveId] || 0) > 0;
}
function consumePP(pkmnInst, moveId) {
  if (!pkmnInst.pp || moveId === "struggle") return;
  pkmnInst.pp[moveId] = Math.max(0, (pkmnInst.pp[moveId] || 0) - 1);
}

function autoPickMove(attacker, defender) {
  var defPd = PKMN[defender.dexId], atkPd = PKMN[attacker.dexId];
  var defTypes = defPd ? defPd.types : ["Normal"];
  var hpPct = attacker.currentHP / attacker.maxHP;
  var eHpPct = defender.currentHP / defender.maxHP;
  var isTrainerFight = BATTLE && BATTLE.isTrainer;
  var usableMoves = attacker.moves.filter(function(mid) { return moveHasPP(attacker, mid); });
  if (usableMoves.length === 0) return "struggle";
  var bestMove = null, bestScore = -Infinity;
  usableMoves.forEach(function(mid) {
    var move = MOVES[mid]; if (!move) return;
    var score = 0, acc = (move.acc || 100) / 100;
    if (move.pwr > 0) {
      var eff = getTypeEffectiveness(move.type, defTypes);
      if (eff === 0) return;
      score = move.pwr * eff * acc;
      if (atkPd && atkPd.types.indexOf(move.type) >= 0) score *= 1.5;
      if (eff >= 2) score *= 1.1;
      if (move.highCrit) score *= 1.1;
      if (move.priority && eHpPct < 0.35) score *= 1.4;
      if (move.effect) {
        var et = move.effect.type, ec = move.effect.chance || 1;
        if (!defender.status) {
          if (et==="burn"||et==="poison") score += 15*ec;
          if (et==="paralysis") score += 20*ec;
          if (et==="sleep"||et==="freeze") score += 30*ec;
        }
        if (et==="spe-1"||et==="atk-1") score += 10*ec;
      }
    } else {
      var eff2 = move.effect; if (!eff2) return;
      var et2 = eff2.type;
      if ((et2==="sleep"||et2==="paralysis") && !defender.status) {
        score = 90*acc;
        if (!isTrainerFight && BATTLE && BATTLE.canCatch) score += 30;
        if (eHpPct < 0.25) score = 5;
      } else if ((et2==="poison"||et2==="burn") && !defender.status) {
        score = 55*acc; if (eHpPct < 0.25) score = 5;
      } else if (et2==="heal50"||et2==="fullheal"||et2==="regeneration") {
        score = hpPct < 0.35 ? 100 : hpPct < 0.6 ? 40 : 0;
      } else if (et2==="atk+2"||et2==="atk+1") { score = eHpPct > 0.5 ? 35 : 0; }
      else if (et2==="spa+1"||et2==="spa+2")   { score = eHpPct > 0.5 ? 25 : 0; }
      else if (et2==="def+1"||et2==="def+2")   { score = hpPct < 0.5 ? 20 : 5; }
      else if (et2==="spe+2") { score = 15; }
      else if (et2==="spe-1") { score = !defender.status ? 30*acc : 0; }
      else if (et2==="atk-1") { score = 25*acc; }
    }
    if (score > bestScore) { bestScore = score; bestMove = mid; }
  });
  if (!bestMove) bestMove = usableMoves.find(function(mid){ return MOVES[mid]&&MOVES[mid].pwr>0; }) || usableMoves[0] || "struggle";
  return bestMove;
}

function applyEffect(target, move) {
  var eff = move.effect; if (!eff) return null;
  var chance = eff.chance !== undefined ? eff.chance : 1.0;
  if (Math.random() > chance) return null;
  var pd = PKMN[target.dexId], name = pd ? pd.name : "?";
  switch (eff.type) {
    case "burn":      if (!target.status){target.status="burn";      return name+" ist verbrannt!";} break;
    case "poison":    if (!target.status){target.status="poison";    return name+" ist vergiftet!";} break;
    case "paralysis": if (!target.status){target.status="paralysis"; return name+" ist gelähmt!";} break;
    case "sleep":     if (!target.status){target.status="sleep"; target.statusTurns=2+Math.floor(Math.random()*3); return name+" schläft ein!";} break;
    case "freeze":    if (!target.status){target.status="freeze"; return name+" ist eingefroren!";} break;
    case "heal50":    target.currentHP=Math.min(target.maxHP,target.currentHP+Math.floor(target.maxHP/2)); return name+" regeneriert HP!";
    case "fullheal":  target.currentHP=target.maxHP; target.status=null; target.statusTurns=0; return name+" ist vollständig erholt!";
    case "drain":     target.currentHP=Math.max(0,target.currentHP-Math.floor(target.maxHP*0.1)); break;
    case "atk-1":     if(target===BATTLE.enemy) BATTLE.enemyAtk=Math.floor((BATTLE.enemyAtk||target.atk)*0.75); break;
    case "def-1":     if(target===BATTLE.enemy) BATTLE.enemyDef=Math.floor((BATTLE.enemyDef||target.def)*0.75); break;
    case "spe-1":     if(target===BATTLE.enemy) BATTLE.enemySpe=Math.floor((BATTLE.enemySpe||target.spe)*0.75); break;
    case "def+1":     BATTLE.playerDef=Math.floor((BATTLE.playerDef||target.def)*1.25); break;
    case "spa+1":     BATTLE.playerSpa=Math.floor((BATTLE.playerSpa||target.spa)*1.25); break;
    case "atk+2":     BATTLE.playerAtk=Math.floor((BATTLE.playerAtk||target.atk)*1.5); break;
  }
  return null;
}

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

function startBattle(type, data) {
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

function doPlayerAttack(moveId) {
  if (!BATTLE || BATTLE.over) return [];
  var player = getActivePkmn(); if (!player) return [];
  if (!player.pp) player.pp = initPP(player.moves);
  var pd = PKMN[player.dexId], log = [], name = pd ? pd.name : "?";
  if (player.status === "sleep") {
    player.statusTurns = (player.statusTurns || 1) - 1;
    if (player.statusTurns <= 0) { player.status = null; log.push(name + " ist aufgewacht!"); }
    else { log.push(name + " schläft..."); return log; }
  }
  if (player.status === "paralysis" && Math.random() < 0.25) { log.push(name + " ist voll gelähmt!"); return log; }
  if (!hasPP(player)) { moveId = "struggle"; }
  else if (!moveHasPP(player, moveId)) { moveId = autoPickMove(player, BATTLE.enemy); }
  consumePP(player, moveId);
  var move = MOVES[moveId] || MOVES["tackle"];
  log.push(name + " setzt " + move.name + " ein!");
  if (move.acc && move.acc < 100 && Math.random() > move.acc / 100) { log.push("Geht daneben!"); return log; }
  if (move.pwr > 0) {
    var res = calcDamage(player, BATTLE.enemy, moveId);
    BATTLE.enemy.currentHP = Math.max(0, BATTLE.enemy.currentHP - res.damage);
    var effText = res.typeEff > 1 ? " Sehr effektiv!" : (res.typeEff < 1 && res.typeEff > 0 ? " Wenig effektiv..." : res.typeEff === 0 ? " Keine Wirkung!" : "");
    log.push("-" + res.damage + " HP!" + (res.crit ? " Volltreffer!" : "") + effText);
    if (moveId === "struggle") {
      var recoil = Math.max(1, Math.floor(player.maxHP / 4));
      player.currentHP = Math.max(0, player.currentHP - recoil);
      log.push(name + " erleidet Rückstoßschaden! (-" + recoil + " HP)");
    }
  }
  var em = applyEffect(BATTLE.enemy, move); if (em) log.push(em);
  if (move.effect && move.effect.target === "self") { var sm = applyEffect(player, move); if (sm) log.push(sm); }
  return log;
}

function doEnemyAttack() {
  if (!BATTLE || BATTLE.over) return [];
  var player = getActivePkmn(); if (!player) return [];
  var enemy = BATTLE.enemy, epd = PKMN[enemy.dexId], log = [], ename = epd ? epd.name : "?";
  if (enemy.status === "sleep") {
    enemy.statusTurns = (enemy.statusTurns || 1) - 1;
    if (enemy.statusTurns <= 0) { enemy.status = null; log.push(ename + " ist aufgewacht!"); }
    else { log.push(ename + " schläft..."); return log; }
  }
  if (enemy.status === "paralysis" && Math.random() < 0.25) { log.push(ename + " ist voll gelähmt!"); return log; }
  var moveId = autoPickMove(enemy, player);
  consumePP(enemy, moveId);
  var move = MOVES[moveId] || MOVES["tackle"];
  log.push(ename + " setzt " + move.name + " ein!");
  if (move.acc && move.acc < 100 && Math.random() > move.acc / 100) { log.push("Geht daneben!"); return log; }
  if (move.pwr > 0) {
    var res = calcDamage(enemy, player, moveId);
    player.currentHP = Math.max(0, player.currentHP - res.damage);
    log.push(ename + " macht " + res.damage + " Schaden!" + (res.crit ? " Volltreffer!" : ""));
    if (moveId === "struggle") {
      var recoil = Math.max(1, Math.floor(enemy.maxHP / 4));
      enemy.currentHP = Math.max(0, enemy.currentHP - recoil);
    }
  }
  var em = applyEffect(player, move); if (em) log.push(em);
  return log;
}

function checkBattleEnd() {
  if (!BATTLE || BATTLE.over) return null;
  var log = [], active = getActivePkmn();
  var ps = applyStatusDamage(active);       if (ps) log.push(ps);
  var es = applyStatusDamage(BATTLE.enemy); if (es) log.push(es);
  if (BATTLE.enemy.currentHP <= 0) {
    var epd = PKMN[BATTLE.enemy.dexId];
    var xp = calcXPGain(active ? active.level : 1, BATTLE.enemy.level, epd?epd.baseXP:50, BATTLE.isTrainer);
    BATTLE.xpGained += xp;
    if (active) gainEVs(active, BATTLE.enemy.dexId);
    log.push("💥 " + (epd?epd.name:"?") + " wurde besiegt!");
    if (BATTLE.enemyQueue && BATTLE.enemyQueue.length > 0) {
      BATTLE.enemy = BATTLE.enemyQueue.shift();
      var np = PKMN[BATTLE.enemy.dexId];
      log.push("Trainer schickt " + (np?np.name:"?") + " Lv." + BATTLE.enemy.level + "!");
      return { log: log, over: false };
    }
    BATTLE.over = true; BATTLE.result = "win";
    // ── Geldbelohnung ─────────────────────────────────────────
    if (BATTLE.trainerData) {
      // Trainer-Kampf: festes Reward
      BATTLE.moneyGained = BATTLE.trainerData.reward || 0;
    } else {
      // Wildes Pokémon: halbes Level als Pokédollar (mind. 1)
      BATTLE.moneyGained = Math.max(1, Math.floor(BATTLE.enemy.level / 2));
    }
    log.push("Kampf gewonnen! +" + xp + " EP");
    return { log: log, over: true, result: "win" };
  }
  var justFainted = STATE.party.find(function(p) { return p.currentHP <= 0 && !p._faintAnnounced; });
  if (justFainted) {
    justFainted._faintAnnounced = true;
    var fpd = PKMN[justFainted.dexId];
    log.push("😵 " + (fpd?fpd.name:"?") + " hat keine Kraft mehr!");
    var nextAlive = STATE.party.find(function(p) { return p.currentHP > 0; });
    if (!nextAlive) {
      BATTLE.over = true; BATTLE.result = "lose";
      log.push("Alle Pokémon sind K.O.!"); log.push("Du verlierst das Bewusstsein...");
      return { log: log, over: true, result: "lose" };
    }
    log.push("Auf! " + (PKMN[nextAlive.dexId]?PKMN[nextAlive.dexId].name:"?") + " kämpft weiter!");
    return { log: log, over: false, playerSwitched: true };
  }
  return { log: log, over: false };
}

// ── Fangen (mit Pokédex-Tracking) ────────────────────────────
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
    fixPkmn(copy);
    if (!STATE.caught) STATE.caught = {};
    if (!STATE.seen)   STATE.seen   = {};
    STATE.caught[copy.dexId] = true;
    STATE.seen[copy.dexId]   = true;
    var added = addToParty(copy);
    if (!added) addToBox(copy);
    return { caught:true, log:[name+" wurde gefangen!"], pkmn:copy, toParty:added };
  }
  return { caught:false, log:[name+" bricht aus!"] };
}

// ── Item im Kampf nutzen ──────────────────────────────────────
function useBattleItem(itemKey) {
  if (!BATTLE || BATTLE.over || !STATE) return false;
  if (!STATE.items[itemKey] || STATE.items[itemKey] <= 0) { showToast("Kein " + (ITEM_DEFS[itemKey]?ITEM_DEFS[itemKey].name:itemKey) + "!"); return false; }
  var player = getActivePkmn(); if (!player) return false;
  var pd = PKMN[player.dexId], name = pd ? pd.name : "Pokémon";
  var used = false;
  switch (itemKey) {
    case "potion":      if(player.currentHP>=player.maxHP){showToast("HP voll!");return false;} player.currentHP=Math.min(player.maxHP,player.currentHP+20); used=true; break;
    case "superpotion": if(player.currentHP>=player.maxHP){showToast("HP voll!");return false;} player.currentHP=Math.min(player.maxHP,player.currentHP+50); used=true; break;
    case "hyperpotion": if(player.currentHP>=player.maxHP){showToast("HP voll!");return false;} player.currentHP=Math.min(player.maxHP,player.currentHP+200); used=true; break;
    case "maxpotion":   if(player.currentHP>=player.maxHP){showToast("HP voll!");return false;} player.currentHP=player.maxHP; used=true; break;
    case "fullrestore": player.currentHP=player.maxHP; player.status=null; player.statusTurns=0;
      player.moves.forEach(function(m){if(player.pp)player.pp[m]=ppMax(m);}); used=true; break;
    case "fullheal":    player.status=null; player.statusTurns=0; used=true; break;
    case "antidote":    if(player.status!=="poison"){showToast("Nicht vergiftet!");return false;} player.status=null; used=true; break;
    case "awakening":   if(player.status!=="sleep"){showToast("Schläft nicht!");return false;} player.status=null; player.statusTurns=0; used=true; break;
    case "paralysheal": if(player.status!=="paralysis"){showToast("Nicht gelähmt!");return false;} player.status=null; used=true; break;
    case "revive": {
      var fainted = STATE.party.find(function(p){return p.currentHP<=0;});
      if(!fainted){showToast("Kein K.O. Pokémon!");return false;}
      fainted.currentHP=Math.floor(fainted.maxHP/2); fainted._faintAnnounced=false; used=true;
      appendBattleLog((PKMN[fainted.dexId]?PKMN[fainted.dexId].name:"?")+" wurde belebt!");
      break;
    }
    default: showToast("Hier nicht nutzbar."); return false;
  }
  if (used) {
    STATE.items[itemKey]--;
    var def = ITEM_DEFS ? ITEM_DEFS[itemKey] : null;
    appendBattleLog("🎒 " + name + " nutzt " + (def?def.name:itemKey) + "!");
    updatePlayerHp(); renderPlayerSprites(); saveGame();
    closeBattleItemPanel();
  }
  return used;
}

// ── Flucht ────────────────────────────────────────────────────
function doFlee() {
  if (!BATTLE || !BATTLE.canFlee) return false;
  BATTLE.over = true; BATTLE.result = "flee"; return true;
}
