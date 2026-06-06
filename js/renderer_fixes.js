// ═══════════════════════════════════════════════════════════════
//  renderer_fixes.js — Fahrrad, EP-Teiler, Routing-Fix, Team
//  Wird als LETZTES Script geladen
// ═══════════════════════════════════════════════════════════════

// ── Routing-Fix: homeCity für falsch sortierte Zonen ─────────
(function patchHomeCities() {
  var map = {
    route22:"viridian_city", viridian_gym:"viridian_city",
    route23:"viridian_city", victory_road:"viridian_city", elite_four:"viridian_city",
  };
  if(typeof WORLD==="undefined") return;
  WORLD.forEach(function(z){ if(map[z.id]) z.homeCity=map[z.id]; });
})();

// ── Gary Level in Alabastia patchen ──────────────────────────
(function(){
  var a=WORLD.find(function(z){return z.id==="alabastia";});
  if(a&&a.cityRival&&!a.cityRival.rivalLevel) a.cityRival.rivalLevel=5;
})();

// ══════════════════════════════════════════════════════════════
//  FAHRRAD — halbe STAGE_TICK_MS wenn im Besitz
// ══════════════════════════════════════════════════════════════
function getEffectiveTickMs() {
  if(STATE && STATE.items && (STATE.items.fahrrad||0) > 0) return Math.floor(STAGE_TICK_MS / 2);
  return STAGE_TICK_MS;
}

// Überschreibt startStageLoop aus app.js
function startStageLoop() {
  clearInterval(STAGE_INTERVAL); clearInterval(BATTLE_INTERVAL);
  _waitingForInput=false; _inCity=false; _animRunning=false; STATE.currentBuilding=null;
  hideBattleUI(); renderEnemySprite(null,false);
  var ms = getEffectiveTickMs();
  STAGE_INTERVAL = setInterval(processStage, ms);
}

// ══════════════════════════════════════════════════════════════
//  EP-TEILER + onBattleEnd Override
// ══════════════════════════════════════════════════════════════
function onBattleEnd(result) {
  clearInterval(BATTLE_INTERVAL); _animRunning=false; hideTrainerPortrait();

  // Hilfsfunktion: XP verteilen (EP-Teiler-bewusst)
  function distributeXP(xp, enemyDexId) {
    var msgs=[];
    var hasEpTeiler = STATE.items && (STATE.items.ep_teiler||0) > 0;
    var lead = getActivePkmn();
    STATE.party.forEach(function(p) {
      if(p.currentHP <= 0) return;
      if(!hasEpTeiler && p !== lead) return; // Ohne EP-Teiler: nur Lead
      applyXP(p, xp, enemyDexId).forEach(function(m){ msgs.push(m); });
    });
    return msgs;
  }

  // ── Sieg: Stadt-Rückkehr ──────────────────────────────────
  if(result==="win"&&BATTLE.trainerData&&BATTLE.trainerData.returnToCity){
    setTimeout(function(){
      var msgs=distributeXP(BATTLE.xpGained||0, null);
      msgs.forEach(function(m){appendBattleLog(m);}); if(BATTLE.xpGained>0)showXPPopup(BATTLE.xpGained);
      if(BATTLE.moneyGained>0){STATE.money+=BATTLE.moneyGained;appendBattleLog("+"+BATTLE.moneyGained+" ₽!");updateHUD();}
      if(BATTLE.trainerData.rivalKey)setEventFlag(BATTLE.trainerData.rivalKey);
      saveGame();
      setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=true;_inCity=true;
        var city=getZone(BATTLE.trainerData.cityZoneId);if(city)renderCityHub(city);},1500);
    },500); return;
  }

  // ── Sieg: Gebäude-Rückkehr ────────────────────────────────
  if(result==="win"&&BATTLE.trainerData&&BATTLE.trainerData.returnToBuilding){
    setTimeout(function(){
      var msgs=distributeXP(BATTLE.xpGained||0, null);
      msgs.forEach(function(m){appendBattleLog(m);}); if(BATTLE.xpGained>0)showXPPopup(BATTLE.xpGained);
      if(BATTLE.moneyGained>0){STATE.money+=BATTLE.moneyGained;appendBattleLog("+"+BATTLE.moneyGained+" ₽!");updateHUD();}
      if(BATTLE.trainerData.rivalKey)setEventFlag(BATTLE.trainerData.rivalKey);
      saveGame();
      setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=true;_inCity=true;
        STATE.currentBuilding=BATTLE.trainerData.buildingId;
        var bldg=getZone(BATTLE.trainerData.buildingId);if(bldg)renderBuildingView(bldg);},1500);
    },500); return;
  }

  // ── Sieg: Waypoint-Rival ──────────────────────────────────
  if(result==="win"&&BATTLE.trainerData&&BATTLE.trainerData.waypointReturn){
    setTimeout(function(){
      var msgs=distributeXP(BATTLE.xpGained||0, null);
      msgs.forEach(function(m){appendBattleLog(m);}); if(BATTLE.xpGained>0)showXPPopup(BATTLE.xpGained);
      if(BATTLE.moneyGained>0){STATE.money+=BATTLE.moneyGained;appendBattleLog("+"+BATTLE.moneyGained+" ₽!");updateHUD();}
      if(BATTLE.trainerData.waypointFlagId)setEventFlag(BATTLE.trainerData.waypointFlagId);
      saveGame();
      setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=false;
        renderPlayerSprites();advanceStage();startStageLoop();},2000);
    },500); return;
  }

  // ── Normaler Sieg ─────────────────────────────────────────
  if(result==="win"){
    setTimeout(function(){
      var eid=BATTLE.enemy?BATTLE.enemy.dexId:null;
      var msgs=distributeXP(BATTLE.xpGained||0, eid);
      msgs.forEach(function(m){appendBattleLog(m);}); if(BATTLE.xpGained>0)showXPPopup(BATTLE.xpGained);
      if(BATTLE.moneyGained>0){STATE.money+=BATTLE.moneyGained;appendBattleLog("+"+BATTLE.moneyGained+" ₽!");updateHUD();}
      if(BATTLE.type==="gym"){
        var zone=getZone(STATE.currentZoneId);
        if(zone&&zone.gymLeader){var gl=zone.gymLeader;
          if(STATE.badgeIds.indexOf(gl.badgeId)<0){STATE.badges++;STATE.badgeIds.push(gl.badgeId);
            appendBattleLog("🏅 "+gl.winText);showToast("🏅 "+gl.badge+" erhalten!",4000);updateHUD();}}}
      markTrainerDefeated(STATE.currentZoneId,STATE.currentStage);saveGame();
      setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=false;
        renderPlayerSprites();advanceStage();startStageLoop();},2500);
    },500);

  // ── Gefangen / Geflohen ───────────────────────────────────
  }else if(result==="catch"||result==="flee"){
    appendBattleLog(result==="flee"?"Du bist geflohen!":"Pokémon gefangen!");saveGame();
    setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=false;
      renderPlayerSprites();advanceStage();startStageLoop();},1800);

  // ── Niederlage — findRecoveryCity ─────────────────────────
  }else{
    clearInterval(STAGE_INTERVAL);
    setTimeout(function(){showBlackout(function(){
      healPartyFully(); STATE.party.forEach(function(p){p._faintAnnounced=false;});
      STATE.currentZoneId=findRecoveryCity(STATE.currentZoneId);
      STATE.currentStage=1;
      saveGame(); hideBattleUI(); renderEnemySprite(null,false); _waitingForInput=false;
      var zn=getZone(STATE.currentZoneId); if(zn)renderZoneBg(zn);
      renderStageInfo();renderPlayerSprites();renderWorldTab();
      showToast("Du bist in "+(zn?zn.name:"einer Stadt")+" aufgewacht! Team geheilt.",4000);
      startStageLoop();
    });},600);
  }
}

// ══════════════════════════════════════════════════════════════
//  TEAM-SCREEN + PLAYER-UI + TRAINER-PORTRAIT (Overrides)
// ══════════════════════════════════════════════════════════════
function renderTrainerPortrait(name, url2) {
  hideTrainerPortrait();
  var scene=document.getElementById("sceneView"); if(!scene) return;
  var div=document.createElement("div"); div.id="trainerPortrait";
  div.style.cssText="position:absolute;right:8px;top:8px;z-index:20;text-align:center";
  div.innerHTML="<img src='"+url2+"' style='width:52px;height:52px;image-rendering:pixelated;display:block;margin:0 auto;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.6)' onerror='this.parentNode.remove()'><div style='font-size:9px;color:#fff;background:rgba(0,0,0,.65);border-radius:3px;padding:1px 4px;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px'>"+name+"</div>";
  scene.appendChild(div);
}

function updatePlayerHp(){
  var p=getActivePkmn(); if(!p) return;
  var fill=document.querySelector(".walker-hpfill");
  if(fill){fill.style.width=Math.max(0,Math.round(p.currentHP/p.maxHP*100))+"%";fill.style.background=hpColor(p.currentHP,p.maxHP);}
  var txt=document.querySelector(".walker-hptxt"); if(txt)txt.textContent=p.currentHP+"/"+p.maxHP;
  var xpF=document.querySelector(".walker-xpfill"); if(xpF)xpF.style.width=Math.min(100,Math.round(p.xp/p.xpToNext*100))+"%";
  var xpT=document.querySelector(".walker-xptxt"); if(xpT)xpT.textContent="EP "+p.xp+"/"+p.xpToNext;
  var tv=document.getElementById("viewTeam");
  if(tv&&tv.style.display!=="none"&&typeof renderTeamScreen==="function") renderTeamScreen();
}
