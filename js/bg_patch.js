// ═══════════════════════════════════════════════════════════════
//  bg_patch.js — Stadtbilder + Gary-Fix + Trainer-Reveal
// ═══════════════════════════════════════════════════════════════

// ── Städte → benannte BG-Dateien ─────────────────────────────
var CITY_BG_MAP = {
  alabastia:       "Alabastia.png",
  viridian_city:   "VertaniaCity.png",
  pewter_city:     "MamoriaCity.png",
  cerulean_city:   "AzuriaCity.png",
  vermilion_city:  "OraniaCity.png",
  lavender_town:   "LavandiaCity.png",
  celadon_city:    "PrismaniaCity.png",
  fuchsia_city:    "FuchsaniaCity.png",
  saffron_city:    "SafroniaCity.png",
  cinnabar_island: "Zinnoberinsel.png",
};

function renderZoneBg(zone){
  if(!zone)return;
  if(_sceneAnimId)cancelAnimationFrame(_sceneAnimId);
  getSceneCanvas();if(!_sceneCtx)return; _sceneT=0;

  var bgFile=CITY_BG_MAP[zone.id]||null;
  if(!bgFile&&zone.type==="gym"){var k=_getGymImgKey(zone);if(k)bgFile=k+".png";}
  var cacheKey=bgFile||(String((WORLD?WORLD.findIndex(function(z){return z.id===zone.id;}):0)+1));

  var drawFn;
  if(zone.type==="sea")                             drawFn=function(){drawSea(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  else if(zone.type==="gym"||zone.type==="building")drawFn=function(){drawGym(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  else if(zone.type==="city")                       drawFn=function(){drawCity(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  else if(zone.type==="dungeon"){
    if(zone.id.indexOf("forest")>=0)                drawFn=function(){drawForest(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
    else if(zone.id==="pokemon_tower")               drawFn=function(){drawTower(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
    else                                             drawFn=function(){drawCave(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  }
  else drawFn=function(){drawRoute(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT,zone);};

  if(_bgImageCache[cacheKey]===undefined){
    _bgImageCache[cacheKey]="loading";
    var img=new Image();
    img.onload=function(){_bgImageCache[cacheKey]=img;};
    img.onerror=function(){_bgImageCache[cacheKey]=null;};
    img.src="bg/"+(bgFile||cacheKey+".png");
  }
  function loop(){
    var c=_bgImageCache[cacheKey];
    if(c&&c!=="loading"){_sceneCtx.drawImage(c,0,0,_sceneCanvas.width,_sceneCanvas.height);return;}
    try{drawFn();}catch(e){} _sceneT++;_sceneAnimId=requestAnimationFrame(loop);
  }
  loop();
}

// ── Gary-Level-Patch: rivalLevel direkt im WORLD-Objekt setzen ──
(function(){
  var alabastia=WORLD.find(function(z){return z.id==="alabastia";});
  if(alabastia&&alabastia.cityRival&&!alabastia.cityRival.rivalLevel){
    alabastia.cityRival.rivalLevel=5;
    console.log("[patch] Gary in Alabastia: rivalLevel gesetzt auf 5");
  }
})();

// ══════════════════════════════════════════════════════════════
//  TRAINER-REVEAL — Trainer steht kurz an Pokémon-Stelle
// ══════════════════════════════════════════════════════════════
function showTrainerBeforePkmn(enemy, trainerSprUrl, trainerName, onReady) {
  var container=document.getElementById("enemySprite");
  if(!container||!trainerSprUrl){
    renderEnemySprite(enemy,true);
    if(onReady) onReady();
    return;
  }
  // Trainer-Sprite an Pokémon-Position zeigen
  container.style.opacity="1";
  container.className="trainer-reveal";
  container.innerHTML=
    "<div class='trainer-reveal-inner'>"+
      "<img class='trainer-reveal-sprite' src='"+trainerSprUrl+"' "+
           "alt='"+trainerName+"' onerror='this.style.opacity=0'>"+
      "<div class='trainer-reveal-name'>"+trainerName+"</div>"+
    "</div>";

  // Nach 1.4s: ausblenden, Pokémon einblenden
  setTimeout(function(){
    container.style.transition="opacity 0.3s";
    container.style.opacity="0";
    setTimeout(function(){
      container.style.transition="";
      container.className="";
      renderEnemySprite(enemy,true);
      if(onReady) onReady();
    },300);
  },1400);
}

// ══════════════════════════════════════════════════════════════
//  BATTLE-TRIGGER OVERRIDES — Trainer-Reveal + korrekte Level
// ══════════════════════════════════════════════════════════════

// Normaler Trainer-Kampf (auf Route)
function triggerTrainerBattle(trainer) {
  clearInterval(STAGE_INTERVAL); _waitingForInput=true; _animRunning=true;
  startBattle("trainer", trainer);
  var epd=PKMN[BATTLE.enemy.dexId];
  showBattleUI(BATTLE.enemy); clearBattleLog();
  var spr=getTrainerSprite(trainer);
  if(spr) renderTrainerPortrait(trainer.name, spr);
  appendBattleLog((trainer.isRival?"⚡ Rival: ":"")+trainer.name+" fordert dich heraus!");
  appendBattleLog("Er schickt "+(epd?epd.name:"?")+" Lv."+BATTLE.enemy.level+"!");
  showTrainerBeforePkmn(BATTLE.enemy, spr, trainer.name, function(){
    _animRunning=false;
    if(BATTLE&&!BATTLE.over&&BATTLE.autoFight) startBattleLoop();
  });
}

// Arenaleiter-Kampf
function triggerGymLeader(zone) {
  clearInterval(STAGE_INTERVAL); _waitingForInput=true; _animRunning=true;
  var gl=zone.gymLeader;
  startBattle("gym", {name:gl.name, party:gl.party, reward:gl.reward});
  var epd=PKMN[BATTLE.enemy.dexId];
  showBattleUI(BATTLE.enemy); clearBattleLog();
  var spr=getGymLeaderSprite(gl.name);
  if(spr) renderTrainerPortrait(gl.name+" ("+gl.title+")", spr);
  appendBattleLog("⚔️ Arenaleiter "+gl.name+" tritt an!");
  appendBattleLog(gl.name+" schickt "+(epd?epd.name:"?")+" Lv."+BATTLE.enemy.level+"!");
  showTrainerBeforePkmn(BATTLE.enemy, spr, gl.name, function(){
    _animRunning=false;
    if(BATTLE&&!BATTLE.over&&BATTLE.autoFight) startBattleLoop();
  });
}

// Gary in Alabastia / Städten — Level aus cityRival.rivalLevel
function triggerCityRivalHub(zone) {
  if(!zone||!zone.cityRival) return;
  var riv=zone.cityRival;
  if(isEventFlagSet(riv.flagId)){showToast(riv.name+" wurde schon besiegt!");return;}
  var rivalLevel=riv.rivalLevel||10;
  var party=riv.party||[{dexId:getRivalStarterDexId(),lv:rivalLevel}];
  var rivalTrainer={
    name:riv.name, isRival:true, party:party,
    reward:riv.reward||100,
    returnToCity:true, cityZoneId:zone.id, rivalKey:riv.flagId,
  };
  clearInterval(STAGE_INTERVAL); _animRunning=true;
  startBattle("trainer",rivalTrainer);
  var epd=PKMN[BATTLE.enemy.dexId];
  showBattleUI(BATTLE.enemy); clearBattleLog();
  var spr=TRAINER_SPRITES[riv.sprite]||TRAINER_SPRITES.rival;
  if(spr) renderTrainerPortrait(riv.name, spr);
  if(riv.dialogBefore) appendBattleLog("⚡ "+riv.name+": \""+riv.dialogBefore+"\"");
  else appendBattleLog("⚡ "+riv.name+" fordert dich heraus!");
  appendBattleLog(riv.name+" schickt "+(epd?epd.name:"?")+" Lv."+BATTLE.enemy.level+"!");
  showTrainerBeforePkmn(BATTLE.enemy, spr, riv.name, function(){
    _animRunning=false;
    if(BATTLE&&!BATTLE.over&&BATTLE.autoFight) startBattleLoop();
  });
}

// Waypoint-Rival auf Routen
function triggerWaypointRival(zone, wp) {
  clearInterval(STAGE_INTERVAL); _waitingForInput=true; _animRunning=true;
  var party=wp.party||[{dexId:getRivalStarterDexId(),lv:wp.rivalLevel||10}];
  var rivalTrainer={
    name:wp.rivalName||"Gary", isRival:true, party:party, reward:wp.reward||200,
    returnToCity:false, waypointReturn:true, waypointFlagId:wp.flagId,
  };
  startBattle("trainer",rivalTrainer);
  var epd=PKMN[BATTLE.enemy.dexId];
  showBattleUI(BATTLE.enemy); clearBattleLog();
  var spr=TRAINER_SPRITES.rival;
  if(spr) renderTrainerPortrait(wp.rivalName||"Gary", spr);
  if(wp.dialogBefore) appendBattleLog(wp.dialogBefore);
  appendBattleLog((wp.rivalName||"Gary")+" schickt "+(epd?epd.name:"?")+" Lv."+BATTLE.enemy.level+"!");
  showTrainerBeforePkmn(BATTLE.enemy, spr, wp.rivalName||"Gary", function(){
    _animRunning=false;
    if(BATTLE&&!BATTLE.over&&BATTLE.autoFight) startBattleLoop();
  });
}

// Gebäude-Rival (S.S. Anne, Silph AG)
function triggerBuildingRival(bldgId, featId) {
  var bldg=getZone(bldgId); if(!bldg||!bldg.features) return;
  var feat=bldg.features.find(function(f){return f.id===featId;});
  if(!feat||isEventFlagSet(feat.flagId)) return;
  var party=feat.party||[{dexId:getRivalStarterDexId(),lv:feat.rivalLevel||15}];
  clearInterval(STAGE_INTERVAL); _waitingForInput=true; _animRunning=true;
  var rivalTrainer={
    name:"Gary", isRival:true, party:party, reward:feat.reward||500,
    returnToCity:false, returnToBuilding:true, buildingId:bldgId, rivalKey:feat.flagId,
  };
  startBattle("trainer",rivalTrainer);
  var epd=PKMN[BATTLE.enemy.dexId];
  showBattleUI(BATTLE.enemy); clearBattleLog();
  var spr=TRAINER_SPRITES.rival;
  if(spr) renderTrainerPortrait("Gary", spr);
  appendBattleLog("⚡ Gary fordert dich heraus!");
  appendBattleLog("Gary schickt "+(epd?epd.name:"?")+" Lv."+BATTLE.enemy.level+"!");
  showTrainerBeforePkmn(BATTLE.enemy, spr, "Gary", function(){
    _animRunning=false;
    if(BATTLE&&!BATTLE.over&&BATTLE.autoFight) startBattleLoop();
  });
}
