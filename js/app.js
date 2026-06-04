// ═══════════════════════════════════════════════════════════════
//  app.js — Haupt-Controller, Spielschleife, Events
// ═══════════════════════════════════════════════════════════════

var STAGE_INTERVAL   = null;
var BATTLE_INTERVAL  = null;
var STAGE_TICK_MS    = 5000;
var BATTLE_TICK_MS   = 1800;
var _waitingForInput = false;

// ── Screen-Wechsel (via display statt hidden) ─────────────────
function showScreen(id) {
  var screens = ["starterScreen","gameScreen","loadScreen","authScreen"];
  screens.forEach(function(sid) {
    var el = document.getElementById(sid);
    if (!el) return;
    if (sid === id) {
      el.style.display = sid === "gameScreen" ? "flex" : "flex";
    } else {
      el.style.display = "none";
    }
  });
}

// ── Tab-Wechsel ────────────────────────────────────────────────
function switchTab(tabName) {
  ["World","Team","Bag","Map"].forEach(function(t) {
    var btn = document.getElementById("tab" + t);
    var view = document.getElementById("view" + t);
    if (btn)  btn.classList.toggle("active", t === tabName);
    if (view) view.style.display = (t === tabName) ? "block" : "none";
  });
  if (tabName === "Team") renderTeamScreen();
  if (tabName === "Bag")  renderBagScreen();
  if (tabName === "Map")  renderMapScreen();
}

// ── gameReady-Event ────────────────────────────────────────────
document.addEventListener("gameReady", function(e) {
  var detail = e.detail;
  if (detail.isNew) {
    showScreen("starterScreen");
    showStarterScreen();
    return;
  }
  // Lade gespeicherten Spielstand
  dbGet(playerPath(detail.uid)).then(function(savedState) {
    if (savedState && savedState.party) {
      var result = loadGameState(detail.uid, savedState);
      startGame(result.awaySeconds);
    } else {
      // Kein Spielstand → Starter-Auswahl
      showScreen("starterScreen");
      showStarterScreen();
    }
  }).catch(function(err) {
    console.error("Ladefehler:", err);
    showScreen("starterScreen");
    showStarterScreen();
  });
});

// ── Starter gewählt ───────────────────────────────────────────
function onStarterChosen(trainerName, starterDexId) {
  var uid  = localStorage.getItem("idlev2_uid") || ("u" + Date.now());
  var pd   = PKMN[starterDexId];
  initNewGame(uid, trainerName, starterDexId);
  showToast("Du hast " + (pd ? pd.name : "?") + " als Starter gewählt!");
  saveGame();
  startGame(0);
}

// ── Spiel starten ─────────────────────────────────────────────
function startGame(awaySeconds) {
  showScreen("gameScreen");
  updateHUD();
  var zone = getZone(STATE.currentZoneId);
  if (!zone) {
    STATE.currentZoneId = "route1";
    STATE.currentStage  = 1;
    zone = getZone("route1");
  }
  renderStageInfo();
  if (zone) renderZoneBg(zone);
  renderPlayerSprites();
  switchTab("World");
  if (awaySeconds > 60) showOfflineReward(awaySeconds);
  startStageLoop();
}

// ── Etappen-Schleife ──────────────────────────────────────────
function startStageLoop() {
  clearInterval(STAGE_INTERVAL);
  clearInterval(BATTLE_INTERVAL);
  _waitingForInput = false;
  hideBattleUI();
  renderEnemySprite(null, false);
  STAGE_INTERVAL = setInterval(processStage, STAGE_TICK_MS);
}

function processStage() {
  if (!STATE || _waitingForInput) return;
  var zone = getZone(STATE.currentZoneId);
  if (!zone) { advanceStage(); return; }

  // Stadt/City → Heilen + Shop
  if (zone.type === "city") {
    if (!isTrainerDefeated(zone.id, STATE.currentStage)) {
      markTrainerDefeated(zone.id, STATE.currentStage);
      healPartyFully();
      renderPlayerSprites();
      updateHUD();
      showToast("Pokémon wurden geheilt! 🏥");
      if (zone.shopItems && zone.shopItems.length > 0) showCityShop(zone);
    }
    advanceStage();
    return;
  }

  // Gym-Leader
  if (isGymLeaderStage(zone, STATE.currentStage) && !isTrainerDefeated(zone.id, STATE.currentStage)) {
    triggerGymLeader(zone);
    return;
  }

  // Trainer
  var trainer = getTrainerAtStage(zone, STATE.currentStage);
  if (trainer && !isTrainerDefeated(zone.id, STATE.currentStage)) {
    triggerTrainerBattle(trainer, zone);
    return;
  }

  // Wildpokémon
  if (zone.wildPokemon && zone.wildPokemon.length > 0 && Math.random() < 0.75) {
    var wild = getWildPokemon(zone);
    if (wild) { triggerWildBattle(wild); return; }
  }

  advanceStage();
}

function advanceStage() {
  if (!STATE) return;
  var zone = getZone(STATE.currentZoneId);
  if (!zone) return;
  STATE.currentStage++;
  if (STATE.currentStage > zone.stageCount) {
    STATE.currentStage = 1;
    if (zone.next) {
      STATE.currentZoneId = zone.next;
      var nextZone = getZone(zone.next);
      if (nextZone) { renderZoneBg(nextZone); showToast("Neue Zone: " + nextZone.name + "!"); }
    } else {
      showToast("🏆 Du hast Kanto komplett erkundet!");
    }
  }
  renderStageInfo();
  renderPlayerSprites();
  saveGame();
}

// ── Wildpokémon ───────────────────────────────────────────────
function triggerWildBattle(wildPkmn) {
  clearInterval(STAGE_INTERVAL);
  _waitingForInput = true;
  var epd = PKMN[wildPkmn.dexId];
  startBattle("wild", wildPkmn);
  renderEnemySprite(BATTLE.enemy, true);
  showBattleUI(BATTLE.enemy);
  clearBattleLog();
  appendBattleLog("Ein wildes " + (epd ? epd.name : "?") + " Lv." + wildPkmn.level + " taucht auf!");
  if (BATTLE.autoFight) startBattleLoop();
}

// ── Trainer ───────────────────────────────────────────────────
function triggerTrainerBattle(trainer, zone) {
  clearInterval(STAGE_INTERVAL);
  _waitingForInput = true;
  startBattle("trainer", trainer);
  var epd = PKMN[BATTLE.enemy.dexId];
  renderEnemySprite(BATTLE.enemy, true);
  showBattleUI(BATTLE.enemy);
  clearBattleLog();
  appendBattleLog(trainer.name + " will kämpfen!");
  appendBattleLog("Er schickt " + (epd ? epd.name : "?") + " Lv." + BATTLE.enemy.level + "!");
  if (BATTLE.autoFight) startBattleLoop();
}

// ── Gym-Leader ────────────────────────────────────────────────
function triggerGymLeader(zone) {
  clearInterval(STAGE_INTERVAL);
  _waitingForInput = true;
  var gl = zone.gymLeader;
  startBattle("gym", { name: gl.name, party: gl.party, reward: gl.reward });
  var epd = PKMN[BATTLE.enemy.dexId];
  renderEnemySprite(BATTLE.enemy, true);
  showBattleUI(BATTLE.enemy);
  clearBattleLog();
  appendBattleLog("⚔️ Arenaleiter " + gl.name + " tritt an!");
  appendBattleLog(gl.name + " schickt " + (epd ? epd.name : "?") + " Lv." + BATTLE.enemy.level + "!");
  if (BATTLE.autoFight) startBattleLoop();
}

function startGymFight() { closeGymPopup(); }

// ── Auto-Kampf ────────────────────────────────────────────────
function startBattleLoop() {
  clearInterval(BATTLE_INTERVAL);
  BATTLE_INTERVAL = setInterval(doAutoBattleTurn, BATTLE_TICK_MS);
}

function doAutoBattleTurn() {
  if (!BATTLE || BATTLE.over) { clearInterval(BATTLE_INTERVAL); return; }
  var player = getActivePkmn();
  if (!player) { clearInterval(BATTLE_INTERVAL); return; }

  var moveId = autoPickMove(player, BATTLE.enemy);
  var pLog = doPlayerAttack(moveId);
  pLog.forEach(function(l) { appendBattleLog(l); });
  updateEnemyHp(BATTLE.enemy);
  updatePlayerHp();
  updateCatchButton(BATTLE.enemy);

  var endCheck = checkBattleEnd();
  if (endCheck) {
    endCheck.log.forEach(function(l) { appendBattleLog(l); });
    if (endCheck.over) { clearInterval(BATTLE_INTERVAL); onBattleEnd(endCheck.result); return; }
  }
  if (!BATTLE.over) {
    var eLog = doEnemyAttack();
    eLog.forEach(function(l) { appendBattleLog(l); });
    updatePlayerHp();
    renderPlayerSprites();
    var endCheck2 = checkBattleEnd();
    if (endCheck2) {
      endCheck2.log.forEach(function(l) { appendBattleLog(l); });
      if (endCheck2.over) { clearInterval(BATTLE_INTERVAL); onBattleEnd(endCheck2.result); return; }
    }
  }
  renderEnemySprite(BATTLE.enemy, true);
}

// ── Kampf-Ende ────────────────────────────────────────────────
function onBattleEnd(result) {
  clearInterval(BATTLE_INTERVAL);
  setTimeout(function() {
    if (result === "win") {
      var xp   = BATTLE.xpGained || 0;
      var msgs = [];
      STATE.party.forEach(function(p) {
        if (p.currentHP > 0) {
          var lv = applyXP(p, xp);
          lv.forEach(function(m) { msgs.push(m); });
        }
      });
      msgs.forEach(function(m) { appendBattleLog(m); });
      if (xp > 0) showXPPopup(xp);
      if (BATTLE.moneyGained > 0) {
        STATE.money += BATTLE.moneyGained;
        appendBattleLog("+" + BATTLE.moneyGained + " ₽!");
        updateHUD();
      }
      // Medaille (Gym)
      if (BATTLE.type === "gym") {
        var zone = getZone(STATE.currentZoneId);
        if (zone && zone.gymLeader) {
          var gl = zone.gymLeader;
          if (STATE.badgeIds.indexOf(gl.badgeId) < 0) {
            STATE.badges++;
            STATE.badgeIds.push(gl.badgeId);
            appendBattleLog("🏅 " + gl.winText);
            showToast("🏅 " + gl.badge + " erhalten!", 4000);
            updateHUD();
          }
        }
      }
      markTrainerDefeated(STATE.currentZoneId, STATE.currentStage);
      saveGame();
      setTimeout(function() {
        hideBattleUI();
        renderEnemySprite(null, false);
        _waitingForInput = false;
        renderPlayerSprites();
        advanceStage();
        startStageLoop();
      }, 2500);

    } else if (result === "catch" || result === "flee") {
      var msg = result === "flee" ? "Du bist geflohen!" : "Pokémon gefangen!";
      appendBattleLog(msg);
      setTimeout(function() {
        hideBattleUI();
        renderEnemySprite(null, false);
        _waitingForInput = false;
        renderPlayerSprites();
        advanceStage();
        startStageLoop();
      }, 1800);

    } else { // lose
      appendBattleLog("Dein Team ist K.O.! Zurück zur Heilstation...");
      healPartyFully();
      var curIdx = WORLD.findIndex(function(z) { return z.id === STATE.currentZoneId; });
      for (var i = curIdx; i >= 0; i--) {
        if (WORLD[i].type === "city" || i === 0) {
          STATE.currentZoneId = WORLD[i].id;
          STATE.currentStage  = 1;
          break;
        }
      }
      saveGame();
      setTimeout(function() {
        hideBattleUI();
        renderEnemySprite(null, false);
        _waitingForInput = false;
        renderPlayerSprites();
        var zn = getZone(STATE.currentZoneId);
        if (zn) renderZoneBg(zn);
        renderStageInfo();
        showToast("Team geheilt! Zurück nach " + (zn ? zn.name : "Stadt") + "!");
        startStageLoop();
      }, 3000);
    }
  }, 1000);
}

// ── Manuelle Aktionen ─────────────────────────────────────────
function onMoveClick(moveId) {
  if (!BATTLE || BATTLE.over) return;
  clearInterval(BATTLE_INTERVAL);
  var pLog = doPlayerAttack(moveId);
  pLog.forEach(function(l) { appendBattleLog(l); });
  updateEnemyHp(BATTLE.enemy);
  updatePlayerHp();
  updateCatchButton(BATTLE.enemy);
  var ec = checkBattleEnd();
  if (ec) { ec.log.forEach(function(l) { appendBattleLog(l); }); if (ec.over) { onBattleEnd(ec.result); return; } }
  if (!BATTLE.over) {
    setTimeout(function() {
      var eLog = doEnemyAttack();
      eLog.forEach(function(l) { appendBattleLog(l); });
      updatePlayerHp();
      renderEnemySprite(BATTLE.enemy, true);
      var ec2 = checkBattleEnd();
      if (ec2) { ec2.log.forEach(function(l) { appendBattleLog(l); }); if (ec2.over) { onBattleEnd(ec2.result); return; } }
      if (BATTLE.autoFight && !BATTLE.over) startBattleLoop();
    }, 800);
  }
}

function onCatchClick(ballType) {
  if (!BATTLE || BATTLE.over) return;
  clearInterval(BATTLE_INTERVAL);
  var result = doCatchAttempt(ballType || "pokeball");
  result.log.forEach(function(l) { appendBattleLog(l); });
  if (result.caught) {
    var pd = PKMN[result.pkmn.dexId];
    showToast((pd ? pd.name : "?") + " gefangen! " + (result.toParty ? "→ Party" : "→ Box"));
    onBattleEnd("catch");
  } else {
    setTimeout(function() {
      var eLog = doEnemyAttack();
      eLog.forEach(function(l) { appendBattleLog(l); });
      updatePlayerHp();
      if (!BATTLE.over && BATTLE.autoFight) startBattleLoop();
    }, 800);
  }
}

function onFleeClick() {
  if (!BATTLE || !BATTLE.canFlee || BATTLE.over) { showToast("Flucht nicht möglich!"); return; }
  clearInterval(BATTLE_INTERVAL);
  doFlee();
  onBattleEnd("flee");
}

function toggleAutoFight() {
  if (!BATTLE) return;
  BATTLE.autoFight = !BATTLE.autoFight;
  var btn = document.getElementById("autoFightBtn");
  if (btn) btn.textContent = BATTLE.autoFight ? "⚡ Auto" : "✋ Manuell";
  if (BATTLE.autoFight && !BATTLE.over) startBattleLoop();
  else clearInterval(BATTLE_INTERVAL);
}

// ── Tab-Navigation ─────────────────────────────────────────────
function onTabWorld() { switchTab("World"); }
function onTabTeam()  { switchTab("Team"); }
function onTabBag()   { switchTab("Bag"); }
function onTabMap()   { switchTab("Map"); }
