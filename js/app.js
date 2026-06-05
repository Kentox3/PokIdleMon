// ═══════════════════════════════════════════════════════════════
//  app.js — PokIdleMon Controller + Animierter Kampf
// ═══════════════════════════════════════════════════════════════

var STAGE_INTERVAL   = null;
var BATTLE_INTERVAL  = null;
var STAGE_TICK_MS    = 5000;
var BATTLE_TICK_MS   = 2200;
var _waitingForInput = false;
var _inCity          = false;
var _animRunning     = false;

// ── Screens ───────────────────────────────────────────────────
function showScreen(id) {
  ["starterScreen","gameScreen","loadScreen","authScreen"].forEach(function(sid) {
    var el=document.getElementById(sid); if(el) el.style.display=(sid===id)?"flex":"none";
  });
}

function switchTab(tabName) {
  ["World","Team","Bag","Map"].forEach(function(t) {
    var btn=document.getElementById("tab"+t), view=document.getElementById("view"+t);
    if(btn)  btn.classList.toggle("active", t===tabName);
    if(view) view.style.display=(t===tabName)?"block":"none";
  });
  if(tabName==="Team")  renderTeamScreen();
  if(tabName==="Bag")   renderBagScreen();
  if(tabName==="Map")   renderMapScreen();
  if(tabName==="World") renderWorldTab();
}

// ── Ohnmacht ──────────────────────────────────────────────────
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

// ── gameReady — ROBUST: niemals blindes Überschreiben des Saves ─
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
        if (!STATE) STATE = saved;
        STATE.uid = d.uid;
        if (!STATE.party || STATE.party.length === 0) {
          showScreen("starterScreen"); showStarterScreen(); return;
        }
      }
      startGame(r.awaySeconds);
    } catch(loadErr) {
      console.error("[gameReady] loadGameState Fehler:", loadErr);
      if (status) status.textContent = "Ladefehler – bitte Seite neu laden";
      showScreen("loadScreen");
      var lb = document.querySelector(".load-box");
      if (lb) lb.innerHTML =
        "<div style='color:#ef4444;font-size:16px;margin-bottom:12px'>⚠️ Ladefehler</div>" +
        "<p style='color:#aaa;margin-bottom:16px;font-size:13px'>Spielstand konnte nicht geladen werden.<br>Daten sind sicher!</p>" +
        "<button onclick='window.location.reload()' style='padding:10px 20px;background:#4e7cff;border:none;border-radius:8px;color:#fff;cursor:pointer'>🔄 Neu laden</button>";
    }
  }).catch(function(firebaseErr) {
    console.error("[gameReady] Firebase-Fehler:", firebaseErr);
    if (status) status.textContent = "Verbindungsfehler";
    showScreen("loadScreen");
    var lb = document.querySelector(".load-box");
    if (lb) lb.innerHTML =
      "<div style='color:#ef4444;font-size:16px;margin-bottom:12px'>⚠️ Verbindungsfehler</div>" +
      "<p style='color:#aaa;margin-bottom:16px;font-size:13px'>Firebase nicht erreichbar.<br>Dein Spielstand ist sicher!</p>" +
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
  // Fallback: alabastia (nicht mehr route1)
  if(!zone){STATE.currentZoneId="alabastia"; STATE.currentStage=1; zone=getZone("alabastia");}
  markZoneVisited(STATE.currentZoneId);
  renderStageInfo(); if(zone) renderZoneBg(zone);
  renderPlayerSprites(); renderWorldTab();
  switchTab("World");
  if(awaySeconds>60) showOfflineReward(awaySeconds);
  startStageLoop();
}

// ── Etappen-Schleife ──────────────────────────────────────────
function startStageLoop() {
  clearInterval(STAGE_INTERVAL); clearInterval(BATTLE_INTERVAL);
  _waitingForInput=false; _inCity=false; _animRunning=false;
  hideBattleUI(); renderEnemySprite(null,false);
  STAGE_INTERVAL=setInterval(processStage, STAGE_TICK_MS);
}

function processStage() {
  if(!STATE||_waitingForInput) return;
  var zone=getZone(STATE.currentZoneId); if(!zone){advanceStage(); return;}
  if(zone.type==="city"){
    clearInterval(STAGE_INTERVAL); _waitingForInput=true; _inCity=true;
    markZoneVisited(zone.id);
    if(!isTrainerDefeated(zone.id,0)){markTrainerDefeated(zone.id,0); healPartyFully(); renderPlayerSprites(); updateHUD();}
    renderCityView(zone); return;
  }
  if(isGymLeaderStage(zone,STATE.currentStage)&&!isTrainerDefeated(zone.id,STATE.currentStage)){triggerGymLeader(zone); return;}
  var trainer=getTrainerAtStage(zone,STATE.currentStage);
  if(trainer&&!isTrainerDefeated(zone.id,STATE.currentStage)){triggerTrainerBattle(trainer); return;}
  if(zone.wildPokemon&&zone.wildPokemon.length>0&&Math.random()<0.75){
    var wild=getWildPokemon(zone); if(wild){triggerWildBattle(wild); return;}
  }
  advanceStage();
}

// app.js advanceStage — wird von renderer_patch.js überschrieben (mit Gym-Skip)
function advanceStage() {
  if(!STATE) return;
  var zone=getZone(STATE.currentZoneId); if(!zone) return;
  STATE.currentStage++;
  if(STATE.currentStage>zone.stageCount){
    STATE.currentStage=1;
    if(zone.next){
      STATE.currentZoneId=zone.next; markZoneVisited(zone.next);
      var nz=getZone(zone.next); if(nz){renderZoneBg(nz); showToast("Neue Zone: "+nz.name+"!");}
    } else showToast("🏆 Kanto komplett!");
  }
  renderStageInfo(); renderPlayerSprites(); renderWorldTab(); saveGame();
}

// ── Schnellreise (patch.js überschreibt diese) ────────────────
function fastTravelTo(zoneId) {
  if(!STATE) return;
  if(BATTLE&&!BATTLE.over){showToast("Im Kampf nicht möglich!"); return;}
  if(!isZoneVisited(zoneId)){showToast("Noch nicht besucht!"); return;}
  clearInterval(STAGE_INTERVAL); clearInterval(BATTLE_INTERVAL);
  _waitingForInput=false; _inCity=false; _animRunning=false;
  hideBattleUI(); renderEnemySprite(null,false);
  STATE.currentZoneId=zoneId; STATE.currentStage=1;
  var zone=getZone(zoneId); if(zone) renderZoneBg(zone);
  renderStageInfo(); renderPlayerSprites(); renderWorldTab();
  saveGame(); showToast("✈ Schnellreise nach "+(zone?zone.name:zoneId)+"!");
  switchTab("World"); startStageLoop();
}

// continueFromCity — wird von renderer_patch.js überschrieben
function continueFromCity() {
  _waitingForInput=false; _inCity=false; advanceStage(); startStageLoop();
}

// ── Kämpfe starten ────────────────────────────────────────────
function triggerWildBattle(wildPkmn) {
  clearInterval(STAGE_INTERVAL); _waitingForInput=true;
  var epd=PKMN[wildPkmn.dexId];
  startBattle("wild", wildPkmn);
  renderEnemySprite(BATTLE.enemy, true); showBattleUI(BATTLE.enemy); clearBattleLog();
  appendBattleLog("Ein wildes "+(epd?epd.name:"?")+" Lv."+wildPkmn.level+" taucht auf!");
  if(BATTLE.autoFight) startBattleLoop();
}

function triggerTrainerBattle(trainer) {
  clearInterval(STAGE_INTERVAL); _waitingForInput=true;
  startBattle("trainer", trainer);
  var epd=PKMN[BATTLE.enemy.dexId];
  renderEnemySprite(BATTLE.enemy, true); showBattleUI(BATTLE.enemy); clearBattleLog();
  var spr=getTrainerSprite(trainer); if(spr) renderTrainerPortrait(trainer.name, spr);
  appendBattleLog((trainer.isRival?"⚡ Rival ":"")+trainer.name+" fordert dich heraus!");
  appendBattleLog("Er schickt "+(epd?epd.name:"?")+" Lv."+BATTLE.enemy.level+"!");
  if(BATTLE.autoFight) startBattleLoop();
}

function triggerGymLeader(zone) {
  clearInterval(STAGE_INTERVAL); _waitingForInput=true;
  var gl=zone.gymLeader;
  startBattle("gym", {name:gl.name, party:gl.party, reward:gl.reward});
  var epd=PKMN[BATTLE.enemy.dexId];
  renderEnemySprite(BATTLE.enemy, true); showBattleUI(BATTLE.enemy); clearBattleLog();
  var spr=getGymLeaderSprite(gl.name); if(spr) renderTrainerPortrait(gl.name+" ("+gl.title+")", spr);
  appendBattleLog("⚔️ Arenaleiter "+gl.name+" tritt an!");
  appendBattleLog(gl.name+" schickt "+(epd?epd.name:"?")+" Lv."+BATTLE.enemy.level+"!");
  if(BATTLE.autoFight) startBattleLoop();
}

function startGymFight(){closeGymPopup();}

// ── Auto-Kampf ────────────────────────────────────────────────
function startBattleLoop() {
  clearInterval(BATTLE_INTERVAL);
  BATTLE_INTERVAL=setInterval(function(){
    if(!_animRunning) doAutoBattleTurn();
  }, BATTLE_TICK_MS);
}

function doAutoBattleTurn() {
  if(!BATTLE||BATTLE.over||_animRunning){clearInterval(BATTLE_INTERVAL); return;}
  var player=getActivePkmn(); if(!player) return;
  _animRunning=true;
  clearInterval(BATTLE_INTERVAL);
  var moveId=autoPickMove(player, BATTLE.enemy);
  var move=MOVES[moveId]||{type:"Normal"};
  doAttackAnimation(move.type, true, function() {
    var pLog=doPlayerAttack(moveId);
    pLog.forEach(function(l){appendBattleLog(l);});
    updateEnemyHp(BATTLE.enemy); updatePlayerHp(); updateCatchButton(BATTLE.enemy);
  }, function() {
    var ec=checkBattleEnd();
    if(ec&&ec.log) ec.log.forEach(function(l){appendBattleLog(l);});
    if(ec&&ec.playerSwitched){renderPlayerSprites(); renderMoveButtons();}
    if(ec&&ec.over){_animRunning=false; onBattleEnd(ec.result); return;}
    if(!BATTLE.over) {
      var eMoveId=autoPickMove(BATTLE.enemy, getActivePkmn());
      var eMove=MOVES[eMoveId]||{type:"Normal"};
      doAttackAnimation(eMove.type, false, function() {
        var eLog=doEnemyAttack();
        eLog.forEach(function(l){appendBattleLog(l);});
        updatePlayerHp(); renderPlayerSprites();
      }, function() {
        var ec2=checkBattleEnd();
        if(ec2&&ec2.log) ec2.log.forEach(function(l){appendBattleLog(l);});
        if(ec2&&ec2.playerSwitched){renderPlayerSprites(); renderMoveButtons();}
        if(ec2&&ec2.over){_animRunning=false; onBattleEnd(ec2.result); return;}
        if(!BATTLE.over) renderEnemySprite(BATTLE.enemy, true);
        _animRunning=false;
        if(BATTLE&&!BATTLE.over&&BATTLE.autoFight) startBattleLoop();
      });
    } else { _animRunning=false; }
  });
}

// onBattleEnd — wird von renderer_patch.js überschrieben (returnToCity etc.)
function onBattleEnd(result) {
  clearInterval(BATTLE_INTERVAL); _animRunning=false; hideTrainerPortrait();
  if(result==="win") {
    setTimeout(function(){
      var xp=BATTLE.xpGained||0, msgs=[], eid=BATTLE.enemy?BATTLE.enemy.dexId:null;
      STATE.party.forEach(function(p){if(p.currentHP>0)applyXP(p,xp,eid).forEach(function(m){msgs.push(m);});});
      msgs.forEach(function(m){appendBattleLog(m);});
      if(xp>0) showXPPopup(xp);
      if(BATTLE.moneyGained>0){STATE.money+=BATTLE.moneyGained; appendBattleLog("+"+BATTLE.moneyGained+" ₽!"); updateHUD();}
      if(BATTLE.type==="gym"){
        var zone=getZone(STATE.currentZoneId);
        if(zone&&zone.gymLeader){var gl=zone.gymLeader;
          if(STATE.badgeIds.indexOf(gl.badgeId)<0){STATE.badges++;STATE.badgeIds.push(gl.badgeId);
            appendBattleLog("🏅 "+gl.winText);showToast("🏅 "+gl.badge+" erhalten!",4000);updateHUD();}}
      }
      markTrainerDefeated(STATE.currentZoneId, STATE.currentStage);
      saveGame();
      setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=false;
        renderPlayerSprites();advanceStage();startStageLoop();},2500);
    },500);
  } else if(result==="catch"||result==="flee") {
    appendBattleLog(result==="flee"?"Du bist geflohen!":"Pokémon gefangen!"); saveGame();
    setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=false;
      renderPlayerSprites();advanceStage();startStageLoop();},1800);
  } else {
    clearInterval(STAGE_INTERVAL);
    setTimeout(function(){showBlackout(function(){
      healPartyFully(); STATE.party.forEach(function(p){p._faintAnnounced=false;});
      var curIdx=WORLD.findIndex(function(z){return z.id===STATE.currentZoneId;});
      for(var i=curIdx;i>=0;i--){if(WORLD[i].type==="city"||i===0){STATE.currentZoneId=WORLD[i].id;STATE.currentStage=1;break;}}
      saveGame(); hideBattleUI(); renderEnemySprite(null,false); _waitingForInput=false;
      var zn=getZone(STATE.currentZoneId); if(zn) renderZoneBg(zn);
      renderStageInfo();renderPlayerSprites();renderWorldTab();
      showToast("Du bist in "+(zn?zn.name:"einer Stadt")+" aufgewacht! Team geheilt.",4000);
      startStageLoop();
    });},600);
  }
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
      var eMoveId=autoPickMove(BATTLE.enemy,getActivePkmn());
      var eMove=MOVES[eMoveId]||{type:"Normal"};
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
    var eMoveId=autoPickMove(BATTLE.enemy,getActivePkmn());
    var eMove=MOVES[eMoveId]||{type:"Normal"};
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

function onFleeClick() {
  if(!BATTLE||!BATTLE.canFlee||BATTLE.over){showToast("Flucht nicht möglich!"); return;}
  clearInterval(BATTLE_INTERVAL); _animRunning=false; doFlee(); onBattleEnd("flee");
}

function toggleAutoFight() {
  if(!BATTLE) return;
  BATTLE.autoFight=!BATTLE.autoFight;
  var btn=document.getElementById("autoFightBtn");
  if(btn) btn.textContent=BATTLE.autoFight?"⚡ Auto":"✋ Manuell";
  if(BATTLE.autoFight&&!BATTLE.over&&!_animRunning) startBattleLoop();
  else clearInterval(BATTLE_INTERVAL);
}

function onTabWorld(){switchTab("World");}
function onTabTeam() {switchTab("Team");}
function onTabBag()  {switchTab("Bag");}
function onTabMap()  {switchTab("Map");}
