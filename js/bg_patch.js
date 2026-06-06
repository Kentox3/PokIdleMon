// ═══════════════════════════════════════════════════════════════
//  bg_patch.js — Stadtbilder + Gary-Fix + Trainer-Reveal + Player-UI
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

// ── Gary-Level-Patch ─────────────────────────────────────────
(function(){
  var alabastia=WORLD.find(function(z){return z.id==="alabastia";});
  if(alabastia&&alabastia.cityRival&&!alabastia.cityRival.rivalLevel){
    alabastia.cityRival.rivalLevel=5;
  }
})();

// ══════════════════════════════════════════════════════════════
//  PLAYER SPRITES — mit Name, Level, Typen, HP-Text, XP-Bar
// ══════════════════════════════════════════════════════════════
function renderPlayerSprites(){
  var container=document.getElementById("playerSprites");
  if(!container||!STATE) return;
  container.innerHTML="";
  var lead=STATE.party.find(function(p){return p.currentHP>0;});
  if(!lead) return;

  var pd=PKMN[lead.dexId], shiny=!!lead.shiny;
  var name=lead.nick||(pd?pd.name:"?");
  var hpPct=Math.max(0,Math.round(lead.currentHP/lead.maxHP*100));
  var xpPct=Math.min(100,Math.round(lead.xp/lead.xpToNext*100));

  var typeHtml=(pd?pd.types.map(function(t){
    return "<span class='type-badge' style='background:"+(TYPE_COLORS[t]||"#aaa")+"'>"+t+"</span>";
  }).join(""):"");
  var statusHtml=lead.status?"<span class='status-badge status-"+lead.status+"'>"+statusText(lead.status)+"</span>":"";

  var div=document.createElement("div");
  div.className="walker walker-lead"+(shiny?" walker-shiny":"");
  div.innerHTML=
    "<img class='walker-sprite"+(shiny?" shiny-sprite":"")+"' "+
         "src='"+spriteUrl(lead.dexId,true,shiny)+"' alt='"+name+"' "+
         "onerror='this.src=\""+spriteFallback(lead.dexId,true,shiny)+"\"'>"+
    "<div class='walker-info'>"+
      "<div class='walker-hprow'>"+
        "<div class='walker-hpbar'><div class='walker-hpfill' style='width:"+hpPct+"%;background:"+hpColor(lead.currentHP,lead.maxHP)+"'></div></div>"+
        "<span class='walker-hptxt'>"+lead.currentHP+"/"+lead.maxHP+"</span>"+
      "</div>"+
      "<div class='walker-nameline'>"+
        "<b>"+(shiny?"✨ ":"")+name+"</b>"+
        "<span class='walker-lv'>Lv."+lead.level+"</span>"+
        statusHtml+
      "</div>"+
      "<div class='walker-types'>"+typeHtml+"</div>"+
      "<div class='walker-xprow'>"+
        "<div class='walker-xpbar'><div class='walker-xpfill' style='width:"+xpPct+"%'></div></div>"+
        "<span class='walker-xptxt'>EP "+lead.xp+"/"+lead.xpToNext+"</span>"+
      "</div>"+
    "</div>";
  container.appendChild(div);
}

// ── updatePlayerHp — HP + XP + Realtime Team-Tab ─────────────
function updatePlayerHp(){
  var p=getActivePkmn(); if(!p) return;
  var fill=document.querySelector(".walker-hpfill");
  if(fill){fill.style.width=Math.max(0,Math.round(p.currentHP/p.maxHP*100))+"%";fill.style.background=hpColor(p.currentHP,p.maxHP);}
  var txt=document.querySelector(".walker-hptxt");
  if(txt) txt.textContent=p.currentHP+"/"+p.maxHP;
  var xpF=document.querySelector(".walker-xpfill");
  if(xpF) xpF.style.width=Math.min(100,Math.round(p.xp/p.xpToNext*100))+"%";
  var xpT=document.querySelector(".walker-xptxt");
  if(xpT) xpT.textContent="EP "+p.xp+"/"+p.xpToNext;
  // Realtime Team-Tab
  var tv=document.getElementById("viewTeam");
  if(tv&&tv.style.display!=="none"&&typeof renderTeamScreen==="function") renderTeamScreen();
}

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
  container.style.opacity="1";
  container.className="trainer-reveal";
  container.innerHTML=
    "<div class='trainer-reveal-inner'>"+
      "<img class='trainer-reveal-sprite' src='"+trainerSprUrl+"' "+
           "alt='"+trainerName+"' onerror='this.style.opacity=0'>"+
      "<div class='trainer-reveal-name'>"+trainerName+"</div>"+
    "</div>";
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
//  BATTLE-TRIGGER OVERRIDES
// ══════════════════════════════════════════════════════════════
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

function triggerCityRivalHub(zone) {
  if(!zone||!zone.cityRival) return;
  var riv=zone.cityRival;
  if(isEventFlagSet(riv.flagId)){showToast(riv.name+" wurde schon besiegt!");return;}
  var rivalLevel=riv.rivalLevel||10;
  var party=riv.party||[{dexId:getRivalStarterDexId(),lv:rivalLevel}];
  var rivalTrainer={name:riv.name,isRival:true,party:party,reward:riv.reward||100,returnToCity:true,cityZoneId:zone.id,rivalKey:riv.flagId};
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

function triggerWaypointRival(zone, wp) {
  clearInterval(STAGE_INTERVAL); _waitingForInput=true; _animRunning=true;
  var party=wp.party||[{dexId:getRivalStarterDexId(),lv:wp.rivalLevel||10}];
  var rivalTrainer={name:wp.rivalName||"Gary",isRival:true,party:party,reward:wp.reward||200,returnToCity:false,waypointReturn:true,waypointFlagId:wp.flagId};
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

function triggerBuildingRival(bldgId, featId) {
  var bldg=getZone(bldgId); if(!bldg||!bldg.features) return;
  var feat=bldg.features.find(function(f){return f.id===featId;});
  if(!feat||isEventFlagSet(feat.flagId)) return;
  var party=feat.party||[{dexId:getRivalStarterDexId(),lv:feat.rivalLevel||15}];
  clearInterval(STAGE_INTERVAL); _waitingForInput=true; _animRunning=true;
  var rivalTrainer={name:"Gary",isRival:true,party:party,reward:feat.reward||500,returnToCity:false,returnToBuilding:true,buildingId:bldgId,rivalKey:feat.flagId};
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
