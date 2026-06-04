// ═══════════════════════════════════════════════════════════════
//  app.js — PokIdleMon Haupt-Controller
// ═══════════════════════════════════════════════════════════════

var STAGE_INTERVAL   = null;
var BATTLE_INTERVAL  = null;
var STAGE_TICK_MS    = 5000;
var BATTLE_TICK_MS   = 1800;
var _waitingForInput = false;

// ── Screen-Wechsel ────────────────────────────────────────────
function showScreen(id) {
  ["starterScreen","gameScreen","loadScreen","authScreen"].forEach(function(sid) {
    var el = document.getElementById(sid);
    if (!el) return;
    el.style.display = (sid === id) ? "flex" : "none";
  });
}

// ── Tab-Wechsel ────────────────────────────────────────────────
function switchTab(tabName) {
  ["World","Team","Bag","Map"].forEach(function(t) {
    var btn  = document.getElementById("tab" + t);
    var view = document.getElementById("view" + t);
    if (btn)  btn.classList.toggle("active", t === tabName);
    if (view) view.style.display = (t === tabName) ? "block" : "none";
  });
  if (tabName === "Team") renderTeamScreen();
  if (tabName === "Bag")  renderBagScreen();
  if (tabName === "Map")  renderMapScreen();
}

// ── gameReady ─────────────────────────────────────────────────
document.addEventListener("gameReady", function(e) {
  var detail = e.detail;
  if (detail.isNew) {
    showScreen("starterScreen");
    showStarterScreen();
    return;
  }
  dbGet(playerPath(detail.uid)).then(function(savedState) {
    if (savedState && savedState.party) {
      var result = loadGameState(detail.uid, savedState);
      startGame(result.awaySeconds);
    } else {
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
  var uid = localStorage.getItem("pokidlemon_uid") || ("u" + Date.now());
  var pd  = PKMN[starterDexId];
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

  if (isGymLeaderStage(zone, STATE.currentStage) && !isTrainerDefeated(zone.id, STATE.currentStage)) {
    triggerGymLeader(zone); return;
  }

  var trainer = getTrainerAtStage(zone, STATE.currentStage);
  if (trainer && !isTrainerDefeated(zone.id, STATE.currentStage)) {
    triggerTrainerBattle(trainer, zone); return;
  }

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
      var nz = getZone(zone.next);
      if (nz) { renderZoneBg(nz); showToast("Neue Zone: " + nz.name + "!"); }
    } else {
      showToast("🏆 Kanto komplett!");
    }
  }
  renderStageInfo();
  renderPlayerSprites();
  saveGame();
}

// ── Kämpfe starten ────────────────────────────────────────────
function triggerWildBattle(wildPkmn) {
  clearInterval(STAGE_INTERVAL); _waitingForInput = true;
  var epd = PKMN[wildPkmn.dexId];
  startBattle("wild", wildPkmn);
  renderEnemySprite(BATTLE.enemy, true);
  showBattleUI(BATTLE.enemy);
  clearBattleLog();
  appendBattleLog("Ein wildes " + (epd ? epd.name : "?") + " Lv." + wildPkmn.level + " taucht auf!");
  if (BATTLE.autoFight) startBattleLoop();
}

function triggerTrainerBattle(trainer) {
  clearInterval(STAGE_INTERVAL); _waitingForInput = true;
  startBattle("trainer", trainer);
  var epd = PKMN[BATTLE.enemy.dexId];
  renderEnemySprite(BATTLE.enemy, true);
  showBattleUI(BATTLE.enemy);
  clearBattleLog();
  appendBattleLog(trainer.name + " will kämpfen!");
  appendBattleLog("Er schickt " + (epd ? epd.name : "?") + " Lv." + BATTLE.enemy.level + "!");
  if (BATTLE.autoFight) startBattleLoop();
}

function triggerGymLeader(zone) {
  clearInterval(STAGE_INTERVAL); _waitingForInput = true;
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

  var pLog = doPlayerAttack(autoPickMove(player, BATTLE.enemy));
  pLog.forEach(function(l) { appendBattleLog(l); });
  updateEnemyHp(BATTLE.enemy); updatePlayerHp(); updateCatchButton(BATTLE.enemy);

  var ec = checkBattleEnd();
  if (ec) { ec.log.forEach(function(l){appendBattleLog(l);}); if(ec.over){clearInterval(BATTLE_INTERVAL);onBattleEnd(ec.result);return;} }

  if (!BATTLE.over) {
    var eLog = doEnemyAttack();
    eLog.forEach(function(l) { appendBattleLog(l); });
    updatePlayerHp(); renderPlayerSprites();
    var ec2 = checkBattleEnd();
    if (ec2) { ec2.log.forEach(function(l){appendBattleLog(l);}); if(ec2.over){clearInterval(BATTLE_INTERVAL);onBattleEnd(ec2.result);return;} }
  }
  renderEnemySprite(BATTLE.enemy, true);
}

// ── Kampf-Ende ────────────────────────────────────────────────
function onBattleEnd(result) {
  clearInterval(BATTLE_INTERVAL);
  setTimeout(function() {
    if (result === "win") {
      var xp = BATTLE.xpGained || 0;
      var msgs = [];
      STATE.party.forEach(function(p) {
        if (p.currentHP > 0) applyXP(p, xp).forEach(function(m){msgs.push(m);});
      });
      msgs.forEach(function(m) { appendBattleLog(m); });
      if (xp > 0) showXPPopup(xp);
      if (BATTLE.moneyGained > 0) { STATE.money += BATTLE.moneyGained; appendBattleLog("+" + BATTLE.moneyGained + " ₽!"); updateHUD(); }
      if (BATTLE.type === "gym") {
        var zone = getZone(STATE.currentZoneId);
        if (zone && zone.gymLeader) {
          var gl = zone.gymLeader;
          if (STATE.badgeIds.indexOf(gl.badgeId) < 0) {
            STATE.badges++; STATE.badgeIds.push(gl.badgeId);
            appendBattleLog("🏅 " + gl.winText);
            showToast("🏅 " + gl.badge + " erhalten!", 4000);
            updateHUD();
          }
        }
      }
      markTrainerDefeated(STATE.currentZoneId, STATE.currentStage);
      saveGame();
      setTimeout(function() { hideBattleUI(); renderEnemySprite(null,false); _waitingForInput=false; renderPlayerSprites(); advanceStage(); startStageLoop(); }, 2500);

    } else if (result === "catch" || result === "flee") {
      appendBattleLog(result === "flee" ? "Du bist geflohen!" : "Gefangen!");
      setTimeout(function() { hideBattleUI(); renderEnemySprite(null,false); _waitingForInput=false; renderPlayerSprites(); advanceStage(); startStageLoop(); }, 1800);

    } else {
      appendBattleLog("Dein Team ist K.O.! Zurück zur Heilstation...");
      healPartyFully();
      var curIdx = WORLD.findIndex(function(z) { return z.id === STATE.currentZoneId; });
      for (var i = curIdx; i >= 0; i--) {
        if (WORLD[i].type === "city" || i === 0) { STATE.currentZoneId = WORLD[i].id; STATE.currentStage = 1; break; }
      }
      saveGame();
      setTimeout(function() {
        hideBattleUI(); renderEnemySprite(null,false); _waitingForInput=false;
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
  pLog.forEach(function(l){appendBattleLog(l);});
  updateEnemyHp(BATTLE.enemy); updatePlayerHp(); updateCatchButton(BATTLE.enemy);
  var ec = checkBattleEnd();
  if (ec) { ec.log.forEach(function(l){appendBattleLog(l);}); if(ec.over){onBattleEnd(ec.result);return;} }
  if (!BATTLE.over) {
    setTimeout(function() {
      var eLog = doEnemyAttack();
      eLog.forEach(function(l){appendBattleLog(l);});
      updatePlayerHp(); renderEnemySprite(BATTLE.enemy, true);
      var ec2 = checkBattleEnd();
      if (ec2) { ec2.log.forEach(function(l){appendBattleLog(l);}); if(ec2.over){onBattleEnd(ec2.result);return;} }
      if (BATTLE.autoFight && !BATTLE.over) startBattleLoop();
    }, 800);
  }
}

function onCatchClick(ballType) {
  if (!BATTLE || BATTLE.over) return;
  clearInterval(BATTLE_INTERVAL);
  var result = doCatchAttempt(ballType || "pokeball");
  result.log.forEach(function(l){appendBattleLog(l);});
  if (result.caught) {
    var pd = PKMN[result.pkmn.dexId];
    showToast((pd ? pd.name : "?") + " gefangen! " + (result.toParty ? "→ Party" : "→ Box"));
    onBattleEnd("catch");
  } else {
    setTimeout(function() {
      var eLog = doEnemyAttack();
      eLog.forEach(function(l){appendBattleLog(l);});
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

function onTabWorld() { switchTab("World"); }
function onTabTeam()  { switchTab("Team"); }
function onTabBag()   { switchTab("Bag"); }
function onTabMap()   { switchTab("Map"); }
