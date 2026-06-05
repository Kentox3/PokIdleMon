// ═══════════════════════════════════════════════════════════════
//  app.js — PokIdleMon Controller
// ═══════════════════════════════════════════════════════════════

var STAGE_INTERVAL   = null;
var BATTLE_INTERVAL  = null;
var STAGE_TICK_MS    = 5000;
var BATTLE_TICK_MS   = 2200;
var _waitingForInput = false;
var _inCity          = false;
var _animRunning     = false;

function showScreen(id) {
  ["starterScreen","gameScreen","loadScreen","authScreen"].forEach(function(sid) {
    var el=document.getElementById(sid); if(el) el.style.display=(sid===id)?"flex":"none";
  });
}

function showBlackout(callback) {
  var ov=document.getElementById("blackoutOverlay");
  if(!ov){if(callback)callback(); return;}
  ov.style.display="flex"; ov.style.background="#fff"; ov.style.opacity="0";
  ov.querySelector(".bo-text").textContent="";
  setTimeout(function(){
    ov.style.opacity="1";
    setTimeout(function(){
      ov.style.background="#000";
      setTimeout(function(){
        ov.querySelector(".bo-text").textContent="...";
        setTimeout(function(){
          ov.querySelector(".bo-text").textContent="Du wirst ohnmächtig!";
          setTimeout(function(){
            ov.querySelector(".bo-text").textContent="In der Heilstation aufgewacht...";
            setTimeout(function(){
              if(callback)callback();
              setTimeout(function(){ov.style.opacity="0";setTimeout(function(){ov.style.display="none";},600);},800);
            },1200);
          },1500);
        },800);
      },300);
    },200);
  },30);
}

// ── gameReady ─────────────────────────────────────────────────
document.addEventListener("gameReady", function(e) {
  var d = e.detail;
  if (d.isNew) { showScreen("starterScreen"); showStarterScreen(); return; }
  var status = document.getElementById("loadStatus");
  if (status) status.textContent = "Lade Spielstand...";
  dbGet(playerPath(d.uid)).then(function(saved) {
    if (!saved || !saved.party || saved.party.length === 0) {
      showScreen("starterScreen"); showStarterScreen(); return;
    }
    try {
      var r = loadGameState(d.uid, saved);
      if (!STATE || !STATE.party || STATE.party.length === 0) {
        if (!STATE) STATE = saved; STATE.uid = d.uid;
        if (!STATE.party || STATE.party.length === 0) { showScreen("starterScreen"); showStarterScreen(); return; }
      }
      startGame(r.awaySeconds);
    } catch(loadErr) {
      console.error("[gameReady]", loadErr);
      if (status) status.textContent = "Ladefehler";
      showScreen("loadScreen");
      var lb = document.querySelector(".load-box");
      if (lb) lb.innerHTML =
        "<div style='color:#ef4444;font-size:16px;margin-bottom:12px'>⚠️ Ladefehler</div>" +
        "<button onclick='window.location.reload()' style='padding:10px 20px;background:#4e7cff;border:none;border-radius:8px;color:#fff;cursor:pointer'>🔄 Neu laden</button>";
    }
  }).catch(function(err) {
    console.error("[gameReady] Firebase:", err);
    if (status) status.textContent = "Verbindungsfehler";
    showScreen("loadScreen");
    var lb = document.querySelector(".load-box");
    if (lb) lb.innerHTML =
      "<div style='color:#ef4444;font-size:16px;margin-bottom:12px'>⚠️ Verbindungsfehler</div>" +
      "<button onclick='window.location.reload()' style='padding:10px 20px;background:#4e7cff;border:none;border-radius:8px;color:#fff;cursor:pointer'>🔄 Erneut versuchen</button>";
  });
});

function onStarterChosen(trainerName, starterDexId) {
  var uid=localStorage.getItem("pokidlemon_uid")||("u"+Date.now());
  var pd=PKMN[starterDexId];
  initNewGame(uid, trainerName, starterDexId);
  showToast("Du hast "+(pd?pd.name:"?")+" als Starter gewählt!");
  saveGame(); startGame(0);
}

// ── Spiel starten ─────────────────────────────────────────────
function startGame(awaySeconds) {
  showScreen("gameScreen"); updateHUD();
  var zone=getZone(STATE.currentZoneId);
  if(!zone){STATE.currentZoneId="alabastia"; STATE.currentStage=1; zone=getZone("alabastia");}
  markZoneVisited(STATE.currentZoneId);
  renderStageInfo(); if(zone) renderZoneBg(zone);
  renderPlayerSprites();
  if(awaySeconds>60) showOfflineReward(awaySeconds);

  // Stadt → sofort Hub zeigen
  if(zone && zone.type==="city") {
    clearInterval(STAGE_INTERVAL); clearInterval(BATTLE_INTERVAL);
    _waitingForInput=true; _inCity=true; _animRunning=false; STATE.currentBuilding=null;
    hideBattleUI(); renderEnemySprite(null,false);
    if(!isTrainerDefeated(zone.id,0)){markTrainerDefeated(zone.id,0);healPartyFully();renderPlayerSprites();updateHUD();}
    renderCityHub(zone);
    STAGE_INTERVAL=setInterval(processStage,STAGE_TICK_MS);
  } else {
    switchTab("World"); renderWorldTab();
    startStageLoop();
  }
}

// ── Etappen-Schleife ──────────────────────────────────────────
function startStageLoop() {
  clearInterval(STAGE_INTERVAL); clearInterval(BATTLE_INTERVAL);
  _waitingForInput=false; _inCity=false; _animRunning=false; STATE.currentBuilding=null;
  hideBattleUI(); renderEnemySprite(null,false);
  STAGE_INTERVAL=setInterval(processStage, STAGE_TICK_MS);
}

// ── processStage — Kernlogik mit Waypoints ────────────────────
function processStage() {
  if(!STATE||_waitingForInput) return;
  var zone=getZone(STATE.currentZoneId); if(!zone){return;}

  // Stadt → Hub zeigen
  if(zone.type==="city"){
    clearInterval(STAGE_INTERVAL); _waitingForInput=true; _inCity=true;
    markZoneVisited(zone.id); STATE.currentBuilding=null;
    if(!isTrainerDefeated(zone.id,0)){markTrainerDefeated(zone.id,0);healPartyFully();renderPlayerSprites();updateHUD();}
    renderCityHub(zone); return;
  }

  // Waypoint-Check VOR normaler Stage-Verarbeitung
  if(zone.waypoints){
    var wp=zone.waypoints.find(function(w){ return w.atStage===STATE.currentStage; });
    if(wp && !isEventFlagSet(wp.flagId)){
      if(wp.type==="rival_fight"){
        triggerWaypointRival(zone, wp); return;
      } else if(wp.type==="route_choice"){
        clearInterval(STAGE_INTERVAL); _waitingForInput=true;
        renderRouteChoice(zone, wp.exits); return;
      } else if(wp.type==="event"){
        setEventFlag(wp.flagId);
        if(wp.message) showToast(wp.message, 3000);
        // Kein Return — weiter mit normaler Stage-Logik
      }
    }
  }

  // Gym-Leader
  if(isGymLeaderStage(zone,STATE.currentStage)&&!isTrainerDefeated(zone.id,STATE.currentStage)){
    triggerGymLeader(zone); return;
  }

  // Trainer
  var trainer=getTrainerAtStage(zone,STATE.currentStage);
  if(trainer&&!isTrainerDefeated(zone.id,STATE.currentStage)){
    triggerTrainerBattle(trainer); return;
  }

  // Wilde Pokémon
  if(zone.wildPokemon&&zone.wildPokemon.length>0&&Math.random()<0.75){
    var wild=getWildPokemon(zone); if(wild){triggerWildBattle(wild); return;}
  }

  advanceStage();
}

// ── Kämpfe auslösen ───────────────────────────────────────────
function triggerTrainerBattle(trainer) {
  clearInterval(STAGE_INTERVAL); _waitingForInput=true;
  startBattle("trainer", trainer);
  var epd=PKMN[BATTLE.enemy.dexId];
  renderEnemySprite(BATTLE.enemy,true); showBattleUI(BATTLE.enemy); clearBattleLog();
  var spr=getTrainerSprite(trainer); if(spr) renderTrainerPortrait(trainer.name, spr);
  appendBattleLog((trainer.isRival?"⚡ Rival: ":"")+trainer.name+" fordert dich heraus!");
  appendBattleLog("Er schickt "+(epd?epd.name:"?")+" Lv."+BATTLE.enemy.level+"!");
  if(BATTLE.autoFight) startBattleLoop();
}

function triggerGymLeader(zone) {
  clearInterval(STAGE_INTERVAL); _waitingForInput=true;
  var gl=zone.gymLeader;
  startBattle("gym", {name:gl.name, party:gl.party, reward:gl.reward});
  var epd=PKMN[BATTLE.enemy.dexId];
  renderEnemySprite(BATTLE.enemy,true); showBattleUI(BATTLE.enemy); clearBattleLog();
  var spr=getGymLeaderSprite(gl.name); if(spr) renderTrainerPortrait(gl.name+" ("+gl.title+")", spr);
  appendBattleLog("⚔️ Arenaleiter "+gl.name+" tritt an!");
  appendBattleLog(gl.name+" schickt "+(epd?epd.name:"?")+" Lv."+BATTLE.enemy.level+"!");
  if(BATTLE.autoFight) startBattleLoop();
}

// ── Auto-Kampf ────────────────────────────────────────────────
function startBattleLoop() {
  clearInterval(BATTLE_INTERVAL);
  BATTLE_INTERVAL=setInterval(function(){ if(!_animRunning) doAutoBattleTurn(); }, BATTLE_TICK_MS);
}

function doAutoBattleTurn() {
  if(!BATTLE||BATTLE.over||_animRunning){clearInterval(BATTLE_INTERVAL); return;}
  var player=getActivePkmn(); if(!player) return;
  _animRunning=true; clearInterval(BATTLE_INTERVAL);
  var moveId=autoPickMove(player,BATTLE.enemy), move=MOVES[moveId]||{type:"Normal"};
  doAttackAnimation(move.type, true, function(){
    var pLog=doPlayerAttack(moveId);
    pLog.forEach(function(l){appendBattleLog(l);});
    updateEnemyHp(BATTLE.enemy); updatePlayerHp(); updateCatchButton(BATTLE.enemy);
  }, function(){
    var ec=checkBattleEnd();
    if(ec&&ec.log) ec.log.forEach(function(l){appendBattleLog(l);});
    if(ec&&ec.playerSwitched){renderPlayerSprites(); renderMoveButtons();}
    if(ec&&ec.over){_animRunning=false; onBattleEnd(ec.result); return;}
    if(!BATTLE.over){
      var eMoveId=autoPickMove(BATTLE.enemy,getActivePkmn()), eMove=MOVES[eMoveId]||{type:"Normal"};
      doAttackAnimation(eMove.type, false, function(){
        var eLog=doEnemyAttack();
        eLog.forEach(function(l){appendBattleLog(l);});
        updatePlayerHp(); renderPlayerSprites();
      }, function(){
        var ec2=checkBattleEnd();
        if(ec2&&ec2.log) ec2.log.forEach(function(l){appendBattleLog(l);});
        if(ec2&&ec2.playerSwitched){renderPlayerSprites(); renderMoveButtons();}
        if(ec2&&ec2.over){_animRunning=false; onBattleEnd(ec2.result); return;}
        if(!BATTLE.over) renderEnemySprite(BATTLE.enemy,true);
        _animRunning=false;
        if(BATTLE&&!BATTLE.over&&BATTLE.autoFight) startBattleLoop();
      });
    } else { _animRunning=false; }
  });
}

// ── Manuelle Aktionen ─────────────────────────────────────────
function onMoveClick(moveId) {
  if(!BATTLE||BATTLE.over||_animRunning) return;
  clearInterval(BATTLE_INTERVAL); _animRunning=true;
  var move=MOVES[moveId]||{type:"Normal"};
  doAttackAnimation(move.type, true, function(){
    var pLog=doPlayerAttack(moveId);
    pLog.forEach(function(l){appendBattleLog(l);});
    updateEnemyHp(BATTLE.enemy); updatePlayerHp(); updateCatchButton(BATTLE.enemy);
  }, function(){
    var ec=checkBattleEnd();
    if(ec&&ec.log) ec.log.forEach(function(l){appendBattleLog(l);});
    if(ec&&ec.playerSwitched){renderPlayerSprites();renderMoveButtons();}
    if(ec&&ec.over){_animRunning=false; onBattleEnd(ec.result); return;}
    if(!BATTLE.over){
      var eMoveId=autoPickMove(BATTLE.enemy,getActivePkmn()), eMove=MOVES[eMoveId]||{type:"Normal"};
      doAttackAnimation(eMove.type, false, function(){
        var eLog=doEnemyAttack();
        eLog.forEach(function(l){appendBattleLog(l);});
        updatePlayerHp(); renderEnemySprite(BATTLE.enemy,true);
      }, function(){
        var ec2=checkBattleEnd();
        if(ec2&&ec2.log) ec2.log.forEach(function(l){appendBattleLog(l);});
        if(ec2&&ec2.playerSwitched){renderPlayerSprites();renderMoveButtons();}
        if(ec2&&ec2.over){_animRunning=false; onBattleEnd(ec2.result); return;}
        _animRunning=false;
        if(BATTLE.autoFight&&!BATTLE.over) startBattleLoop();
      });
    } else { _animRunning=false; }
  });
}

function onCatchClick(ballType) {
  if(!BATTLE||BATTLE.over||_animRunning) return;
  clearInterval(BATTLE_INTERVAL); _animRunning=true;
  var result=doCatchAttempt(ballType||"pokeball");
  result.log.forEach(function(l){appendBattleLog(l);});
  if(result.caught){
    var pd=PKMN[result.pkmn.dexId];
    showToast((pd?pd.name:"?")+" gefangen! "+(result.toParty?"→ Party":"→ Box"));
    _animRunning=false; onBattleEnd("catch");
  } else {
    var eMoveId=autoPickMove(BATTLE.enemy,getActivePkmn()), eMove=MOVES[eMoveId]||{type:"Normal"};
    doAttackAnimation(eMove.type, false, function(){
      var eLog=doEnemyAttack();
      eLog.forEach(function(l){appendBattleLog(l);});
      updatePlayerHp();
    }, function(){
      _animRunning=false;
      var ec=checkBattleEnd();
      if(ec&&ec.log) ec.log.forEach(function(l){appendBattleLog(l);});
      if(ec&&ec.over){onBattleEnd(ec.result); return;}
      if(BATTLE.autoFight&&!BATTLE.over) startBattleLoop();
    });
  }
}

function onFleeClick(){
  if(!BATTLE||!BATTLE.canFlee||BATTLE.over){showToast("Flucht nicht möglich!"); return;}
  clearInterval(BATTLE_INTERVAL); _animRunning=false; doFlee(); onBattleEnd("flee");
}

function toggleAutoFight(){
  if(!BATTLE) return;
  BATTLE.autoFight=!BATTLE.autoFight;
  var btn=document.getElementById("autoFightBtn");
  if(btn) btn.textContent=BATTLE.autoFight?"⚡ Auto":"✋ Manuell";
  if(BATTLE.autoFight&&!BATTLE.over&&!_animRunning) startBattleLoop();
  else clearInterval(BATTLE_INTERVAL);
}

// ── Schnellreise ──────────────────────────────────────────────
function fastTravelTo(zoneId) {
  if(!STATE) return;
  if(BATTLE&&!BATTLE.over){showToast("Im Kampf nicht möglich!"); return;}
  if(!isZoneVisited(zoneId)){showToast("Noch nicht besucht!"); return;}
  clearInterval(STAGE_INTERVAL); clearInterval(BATTLE_INTERVAL);
  _waitingForInput=false; _inCity=false; _animRunning=false; STATE.currentBuilding=null;
  hideBattleUI(); renderEnemySprite(null,false);
  STATE.currentZoneId=zoneId; STATE.currentStage=1;
  var zone=getZone(zoneId); if(zone) renderZoneBg(zone);
  renderStageInfo(); renderPlayerSprites();
  showToast("✈ Schnellreise nach "+(zone?zone.name:zoneId)+"!");
  saveGame();
  // Wenn Stadt: Hub zeigen
  if(zone&&zone.type==="city"){
    _waitingForInput=true; _inCity=true;
    if(!isTrainerDefeated(zoneId,0)){markTrainerDefeated(zoneId,0);healPartyFully();renderPlayerSprites();updateHUD();}
    renderCityHub(zone);
    STAGE_INTERVAL=setInterval(processStage,STAGE_TICK_MS);
  } else {
    renderWorldTab();
    startStageLoop();
  }
}

function onTabWorld(){switchTab("World");}
function onTabTeam() {switchTab("Team");}
function onTabBag()  {switchTab("Bag");}
function onTabMap()  {switchTab("Map");}
function onTabDex()  {switchTab("Dex");}
