// ═══════════════════════════════════════════════════════════════
//  app.js — Haupt-Controller, Spielschleife, Events
// ═══════════════════════════════════════════════════════════════

var STAGE_INTERVAL   = null;
var BATTLE_INTERVAL  = null;
var STAGE_TICK_MS    = 5000;  // 5 Sek. pro Etappe
var BATTLE_TICK_MS   = 1800;  // 1.8 Sek. pro Auto-Angriff
var _waitingForInput = false;

// ── gameReady-Event ────────────────────────────────────────────
document.addEventListener("gameReady", function(e) {
  var detail = e.detail;
  if (detail.isNew) {
    // Neues Spiel: Starter-Auswahl
    showScreen("starterScreen");
    showStarterScreen();
  } else {
    // Gespeichertes Spiel laden
    dbGet(playerPath(detail.uid)).then(function(savedState) {
      if (savedState) {
        var result = loadGameState(detail.uid, savedState);
        startGame(result.awaySeconds);
      } else {
        // Kein Spielstand – Starter-Auswahl
        showScreen("starterScreen");
        showStarterScreen();
      }
    }).catch(function(e) {
      console.error("Ladefehler:", e);
      showScreen("starterScreen");
      showStarterScreen();
    });
  }
});

// ── Starter gewählt ───────────────────────────────────────────
function onStarterChosen(trainerName, starterDexId) {
  var uid = localStorage.getItem("idlev2_uid") || ("u" + Date.now());
  initNewGame(uid, trainerName, starterDexId);
  var pd = PKMN[starterDexId];
  showToast("Du hast " + (pd ? pd.name : "?") + " als Starter gewählt! Viel Erfolg!");
  saveGame();
  startGame(0);
}

// ── Spiel starten ─────────────────────────────────────────────
function startGame(awaySeconds) {
  showScreen("gameScreen");
  updateHUD();
  renderStageInfo();
  renderZoneBg(getZone(STATE.currentZoneId));
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
  var zone  = getZone(STATE.currentZoneId);
  if (!zone) return;

  // Stadt/City: direkt Shop + Heilung anbieten
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

  // Gym-Leader-Kampf
  if (zone.gymLeader && zone.gymLeader.stage === STATE.currentStage) {
    if (!isTrainerDefeated(zone.id, STATE.currentStage)) {
      triggerGymLeader(zone);
      return;
    }
  }

  // Trainer-Kampf
  var trainer = getTrainerAtStage(zone, STATE.currentStage);
  if (trainer && !isTrainerDefeated(zone.id, STATE.currentStage)) {
    triggerTrainerBattle(trainer, zone);
    return;
  }

  // Wildpokémon-Begegnung
  if (zone.wildPokemon && zone.wildPokemon.length > 0 && Math.random() < 0.75) {
    var wild = getWildPokemon(zone);
    if (wild) { triggerWildBattle(wild); return; }
  }

  // Keine Begegnung – direkt weiter
  advanceStage();
}

function advanceStage() {
  if (!STATE) return;
  var zone = getZone(STATE.currentZoneId);
  if (!zone) return;
  STATE.currentStage++;
  if (STATE.currentStage > zone.stageCount) {
    // Zone abgeschlossen
    STATE.currentStage = 1;
    if (zone.next) {
      STATE.currentZoneId = zone.next;
      var nextZone = getZone(zone.next);
      if (nextZone) {
        renderZoneBg(nextZone);
        showToast("Neue Zone: " + nextZone.name + "!");
      }
    } else {
      showToast("🏆 Du hast Kanto erkundet! Neues Spiel demnächst...");
    }
  }
  renderStageInfo();
  renderPlayerSprites();
  saveGame();
}

// ── Wildpokémon-Kampf ─────────────────────────────────────────
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

// ── Trainer-Kampf ─────────────────────────────────────────────
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

// ── Gym-Leader-Kampf ──────────────────────────────────────────
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

function startGymFight() {
  closeGymPopup();
  // Kampf sollte schon gestartet sein
}

// ── Auto-Kampf-Schleife ────────────────────────────────────────
function startBattleLoop() {
  clearInterval(BATTLE_INTERVAL);
  BATTLE_INTERVAL = setInterval(doAutoBattleTurn, BATTLE_TICK_MS);
}

function doAutoBattleTurn() {
  if (!BATTLE || BATTLE.over) { clearInterval(BATTLE_INTERVAL); return; }
  var player = getActivePkmn();
  if (!player) { clearInterval(BATTLE_INTERVAL); return; }

  // Spieler-Angriff
  var moveId = autoPickMove(player, BATTLE.enemy);
  var pLog = doPlayerAttack(moveId);
  pLog.forEach(function(l) { appendBattleLog(l); });
  updateEnemyHp(BATTLE.enemy);
  updatePlayerHp();
  updateCatchButton(BATTLE.enemy);

  // End-of-turn prüfen
  var endCheck = checkBattleEnd();
  if (endCheck) {
    endCheck.log.forEach(function(l) { appendBattleLog(l); });
    if (endCheck.over) { clearInterval(BATTLE_INTERVAL); onBattleEnd(endCheck.result); return; }
  }

  // Gegner-Angriff (wenn Gegner noch lebt)
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

  // Neue Gegner-Sprites aktualisieren
  renderEnemySprite(BATTLE.enemy, true);
}

// ── Kampf-Ende ─────────────────────────────────────────────────
function onBattleEnd(result) {
  clearInterval(BATTLE_INTERVAL);
  setTimeout(function() {
    if (result === "win") {
      // XP verteilen
      var xp = BATTLE.xpGained;
      var msgs = [];
      STATE.party.forEach(function(p) {
        if (p.currentHP > 0) {
          var lvMsgs = applyXP(p, xp);
          lvMsgs.forEach(function(m) { msgs.push(m); });
        }
      });
      if (msgs.length > 0) msgs.forEach(function(m) { appendBattleLog(m); });
      showXPPopup(xp);

      // Geld
      if (BATTLE.moneyGained > 0) {
        STATE.money += BATTLE.moneyGained;
        appendBattleLog("+" + BATTLE.moneyGained + " ₽!");
        updateHUD();
      }

      // Gym-Medaille
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

      // Trainer als besiegt markieren
      markTrainerDefeated(STATE.currentZoneId, STATE.currentStage);
      saveGame();

      // Kampf-UI ausblenden und Etappe weiter
      setTimeout(function() {
        hideBattleUI();
        renderEnemySprite(null, false);
        _waitingForInput = false;
        renderPlayerSprites();
        advanceStage();
        startStageLoop();
      }, 2500);

    } else if (result === "catch") {
      var pkmn = BATTLE.result === "catch" ? BATTLE.enemy : null;
      setTimeout(function() {
        hideBattleUI();
        renderEnemySprite(null, false);
        _waitingForInput = false;
        renderPlayerSprites();
        advanceStage();
        startStageLoop();
      }, 2000);

    } else if (result === "flee") {
      appendBattleLog("Du bist geflohen!");
      setTimeout(function() {
        hideBattleUI();
        renderEnemySprite(null, false);
        _waitingForInput = false;
        advanceStage();
        startStageLoop();
      }, 1500);

    } else { // lose
      appendBattleLog("Dein Team ist K.O.! Zurück zur Heilstation...");
      // Zur letzten Stadt zurück
      healPartyFully();
      var zone = getZone(STATE.currentZoneId);
      // Finde letzte Stadt zurück
      var curIdx = WORLD.findIndex(function(z) { return z.id === STATE.currentZoneId; });
      for (var i = curIdx; i >= 0; i--) {
        if (WORLD[i].type === "city") {
          STATE.currentZoneId = WORLD[i].id;
          STATE.currentStage = 1;
          break;
        }
      }
      saveGame();
      setTimeout(function() {
        hideBattleUI();
        renderEnemySprite(null, false);
        _waitingForInput = false;
        renderPlayerSprites();
        renderStageInfo();
        renderZoneBg(getZone(STATE.currentZoneId));
        showToast("Team geheilt und zurück nach " + (getZone(STATE.currentZoneId) ? getZone(STATE.currentZoneId).name : "Stadt") + "!");
        startStageLoop();
      }, 3000);
    }
  }, 1000);
}

// ── Manuelle Move-Auswahl ─────────────────────────────────────
function onMoveClick(moveId) {
  if (!BATTLE || BATTLE.over) return;
  // Stoppe Auto-Angriff kurz, führe manuellen Angriff aus
  clearInterval(BATTLE_INTERVAL);
  var pLog = doPlayerAttack(moveId);
  pLog.forEach(function(l) { appendBattleLog(l); });
  updateEnemyHp(BATTLE.enemy);
  updatePlayerHp();
  updateCatchButton(BATTLE.enemy);
  var endCheck = checkBattleEnd();
  if (endCheck) {
    endCheck.log.forEach(function(l) { appendBattleLog(l); });
    if (endCheck.over) { onBattleEnd(endCheck.result); return; }
  }
  // Gegner-Gegenangriff
  if (!BATTLE.over) {
    setTimeout(function() {
      var eLog = doEnemyAttack();
      eLog.forEach(function(l) { appendBattleLog(l); });
      updatePlayerHp();
      renderEnemySprite(BATTLE.enemy, true);
      var endCheck2 = checkBattleEnd();
      if (endCheck2) {
        endCheck2.log.forEach(function(l) { appendBattleLog(l); });
        if (endCheck2.over) { onBattleEnd(endCheck2.result); return; }
      }
      // Auto-Fight fortsetzen
      if (BATTLE.autoFight && !BATTLE.over) startBattleLoop();
    }, 800);
  }
}

// ── Fangen-Button ─────────────────────────────────────────────
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
    // Gegner-Gegenangriff nach missglücktem Fangen
    setTimeout(function() {
      var eLog = doEnemyAttack();
      eLog.forEach(function(l) { appendBattleLog(l); });
      updatePlayerHp();
      if (!BATTLE.over && BATTLE.autoFight) startBattleLoop();
    }, 800);
  }
}

// ── Flucht-Button ──────────────────────────────────────────────
function onFleeClick() {
  if (!BATTLE || !BATTLE.canFlee || BATTLE.over) { showToast("Flucht nicht möglich!"); return; }
  clearInterval(BATTLE_INTERVAL);
  doFlee();
  onBattleEnd("flee");
}

// ── Auto-Fight Toggle ─────────────────────────────────────────
function toggleAutoFight() {
  if (!BATTLE) return;
  BATTLE.autoFight = !BATTLE.autoFight;
  var btn = document.getElementById("autoFightBtn");
  if (btn) btn.textContent = BATTLE.autoFight ? "⚡ Auto" : "✋ Manuell";
  if (BATTLE.autoFight && !BATTLE.over) startBattleLoop();
  else clearInterval(BATTLE_INTERVAL);
}

// ── Tab-Navigation ─────────────────────────────────────────────
function onTabWorld()  { switchTab("World"); }
function onTabTeam()   { switchTab("Team"); }
function onTabBag()    { switchTab("Bag"); }
function onTabMap()    { switchTab("Map"); }
