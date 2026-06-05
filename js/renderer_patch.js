
// ══════════════════════════════════════════════════════════════
// renderer_patch.js — Komplettes Hub/Gebäude/Terminus-System
// ══════════════════════════════════════════════════════════════

// ── updateEnemyHp ─────────────────────────────────────────────
function updateEnemyHp(enemy) {
  if(!enemy) return;
  var fill=document.getElementById("enemyHpFill"), txt=document.getElementById("enemyHpTxt");
  if(fill){fill.style.width=Math.max(0,Math.round(enemy.currentHP/enemy.maxHP*100))+"%";fill.style.background=hpColor(enemy.currentHP,enemy.maxHP);}
  if(txt) txt.textContent=enemy.currentHP+"/"+enemy.maxHP;
}

// ── renderMoveButtons — PP-aware ─────────────────────────────
function renderMoveButtons() {
  var container=document.getElementById("moveButtons"); if(!container) return;
  var player=getActivePkmn(); if(!player){container.innerHTML=""; return;}
  container.innerHTML="";
  player.moves.forEach(function(mid){
    var move=MOVES[mid]; if(!move) return;
    var pp=(player.pp&&player.pp[mid]!==undefined)?player.pp[mid]:(move.pp||0);
    var ppMax=move.pp||0, empty=(pp<=0);
    var col=(typeof TYPE_COLORS!=="undefined"&&TYPE_COLORS[move.type])?TYPE_COLORS[move.type]:"#888";
    var btn=document.createElement("button");
    btn.className="move-btn"+(empty?" move-btn-empty":"");
    btn.style.borderColor=empty?"#444":col; btn.style.opacity=empty?"0.45":"1";
    btn.innerHTML=
      "<span class='move-name'>"+move.name+"</span>"+
      "<span class='move-type' style='background:"+(empty?"#555":col)+"'>"+move.type+"</span>"+
      "<span class='move-pwr'>"+(move.pwr>0?move.pwr+"Stk":"Status")+"</span>"+
      "<span class='move-pp "+(empty?"move-pp-empty":pp<=Math.ceil(ppMax/4)?"move-pp-low":"")+"'>"+pp+"/"+ppMax+" AP</span>";
    btn.onclick=(function(m){return function(){onMoveClick(m);};})(mid);
    container.appendChild(btn);
  });
}

// ── Sprite-URLs ───────────────────────────────────────────────
var SD_SHINY_FRONT="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/";
var SD_SHINY_BACK ="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/shiny/";
var PNG_SHINY     ="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/";
var PNG_SHINY_BACK="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/";

function spriteUrl(dexId,back,shiny){
  if(shiny)return(back?SD_SHINY_BACK:SD_SHINY_FRONT)+dexId+".gif";
  var F="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/";
  return(back?F+"back/":F)+dexId+".gif";
}
function spriteFallback(dexId,back,shiny){
  if(shiny)return(back?PNG_SHINY_BACK:PNG_SHINY)+dexId+".png";
  var F="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
  return(back?F+"back/":F)+dexId+".png";
}

// ── Hintergrund-Rendering ─────────────────────────────────────
var _bgImageCache={}, _gymIndexMap=null;
function _getGymImgKey(zone){
  if(!_gymIndexMap){_gymIndexMap={};var n=0;WORLD.forEach(function(z){if(z.type==="gym"){n++;_gymIndexMap[z.id]="gym"+n;}});}
  return _gymIndexMap[zone.id]||null;
}
function renderZoneBg(zone){
  if(!zone)return;
  if(_sceneAnimId)cancelAnimationFrame(_sceneAnimId);
  getSceneCanvas();if(!_sceneCtx)return; _sceneT=0;
  var imgKey=zone.type==="gym"?_getGymImgKey(zone):String((WORLD?WORLD.findIndex(function(z){return z.id===zone.id;}):0)+1);
  var drawFn;
  if(zone.type==="sea")     drawFn=function(){drawSea(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  else if(zone.type==="gym"||zone.type==="building") drawFn=function(){drawGym(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  else if(zone.type==="city")    drawFn=function(){drawCity(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  else if(zone.type==="dungeon"){
    if(zone.id.indexOf("forest")>=0)   drawFn=function(){drawForest(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
    else if(zone.id==="pokemon_tower") drawFn=function(){drawTower(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
    else                               drawFn=function(){drawCave(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  }
  else drawFn=function(){drawRoute(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT,zone);};
  if(_bgImageCache[imgKey]===undefined){
    _bgImageCache[imgKey]='loading';
    var img=new Image(); img.onload=function(){_bgImageCache[imgKey]=img;}; img.onerror=function(){_bgImageCache[imgKey]=null;};
    img.src='bg/'+imgKey+'.png';
  }
  function loop(){
    var c=_bgImageCache[imgKey];
    if(c&&c!=='loading'){_sceneCtx.drawImage(c,0,0,_sceneCanvas.width,_sceneCanvas.height);return;}
    try{drawFn();}catch(e){} _sceneT++;_sceneAnimId=requestAnimationFrame(loop);
  }
  loop();
}

// ── Sprites ───────────────────────────────────────────────────
function renderEnemySprite(enemy,visible){
  var container=document.getElementById("enemySprite");if(!container)return;
  if(!enemy||!visible){container.innerHTML="";container.style.opacity="0";return;}
  var pd=PKMN[enemy.dexId],name=pd?pd.name:"?",shiny=!!enemy.shiny,dn=(shiny?"✨ ":"")+name;
  var typeHtml=pd?pd.types.map(function(t){return "<span class='type-badge' style='background:"+(TYPE_COLORS[t]||"#aaa")+"'>"+t+"</span>";}).join(""):"";
  container.style.opacity="1";container.className=shiny?"enemy-shiny":"";
  container.innerHTML=
    "<div class='enemy-info'><div class='enemy-nameline'>"+dn+" <span class='enemy-lv'>Lv."+enemy.level+"</span>"+typeHtml+"</div>"+
    "<div class='enemy-hprow'><div class='enemy-hpbar'><div class='enemy-hpfill' id='enemyHpFill' style='width:"+Math.max(0,Math.round(enemy.currentHP/enemy.maxHP*100))+"%;background:"+hpColor(enemy.currentHP,enemy.maxHP)+"'></div></div>"+
    "<span class='enemy-hptxt' id='enemyHpTxt'>"+enemy.currentHP+"/"+enemy.maxHP+"</span></div>"+
    (enemy.status?"<span class='status-badge status-"+enemy.status+"'>"+statusText(enemy.status)+"</span>":"")+
    "</div><img class='enemy-img enemy-appear"+(shiny?" shiny-sprite":"")+"' src='"+spriteUrl(enemy.dexId,false,shiny)+"' alt='"+dn+"' onerror='this.src=\""+spriteFallback(enemy.dexId,false,shiny)+"\"'>";
}
function renderPlayerSprites(){
  var container=document.getElementById("playerSprites");if(!container||!STATE)return;
  container.innerHTML="";
  var lead=STATE.party.find(function(p){return p.currentHP>0;});if(!lead)return;
  var pd=PKMN[lead.dexId],shiny=!!lead.shiny,div=document.createElement("div");
  div.className="walker walker-lead"+(shiny?" walker-shiny":"");
  var hpPct=Math.max(0,Math.round(lead.currentHP/lead.maxHP*100));
  div.innerHTML="<img class='walker-sprite"+(shiny?" shiny-sprite":"")+"' src='"+spriteUrl(lead.dexId,true,shiny)+"' alt='"+(pd?pd.name:"?")+"' onerror='this.src=\""+spriteFallback(lead.dexId,true,shiny)+"\"'>"+
    "<div class='walker-hpbar'><div class='walker-hpfill' style='width:"+hpPct+"%;background:"+hpColor(lead.currentHP,lead.maxHP)+"'></div></div>";
  container.appendChild(div);
}

// ══════════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════════
function navigateTo(zoneId) {
  _waitingForInput=false; _inCity=false;
  STATE.currentZoneId=zoneId; STATE.currentStage=1; markZoneVisited(zoneId);
  var zone=getZone(zoneId); if(zone)renderZoneBg(zone);
  renderStageInfo(); renderPlayerSprites(); renderWorldTab();
  showToast("Unterwegs nach "+(zone?zone.name:zoneId)+"...");
  saveGame(); startStageLoop();
}

function goToCity(cityId) {
  clearInterval(STAGE_INTERVAL); clearInterval(BATTLE_INTERVAL);
  _waitingForInput=true; _inCity=true; _animRunning=false;
  hideBattleUI(); renderEnemySprite(null,false);
  STATE.currentZoneId=cityId; STATE.currentStage=1; STATE.currentBuilding=null;
  markZoneVisited(cityId);
  var city=getZone(cityId); if(city)renderZoneBg(city);
  if(!isTrainerDefeated(cityId,0)){markTrainerDefeated(cityId,0);healPartyFully();renderPlayerSprites();updateHUD();}
  renderStageInfo(); renderPlayerSprites(); renderCityHub(city);
  saveGame(); STAGE_INTERVAL=setInterval(processStage,STAGE_TICK_MS);
}

function travelToExit(exitId) {
  var zone=getZone(STATE.currentZoneId);
  var exit=null;
  if(zone&&zone.exits) exit=zone.exits.find(function(e){return e.id===exitId;});
  if(!exit) exit={id:exitId};
  if(exit.condition&&!checkExitCondition(exit.condition)){showToast(exit.lockedMsg||"Zugang gesperrt!",4000); return;}
  navigateTo(exitId);
}

function handleTerminus(zone) {
  if(!zone||!zone.terminus) return;
  var exits=zone.terminus.exits;
  if(!exits||exits.length===0){showToast("Ende der Zone."); return;}
  if(exits.length===1) {
    var exit=exits[0];
    if(exit.condition&&!checkExitCondition(exit.condition)){
      showToast(exit.lockedMsg||"Gesperrt!",5000);
      if(exit.fallback){
        setTimeout(function(){
          showToast(exit.fallbackMsg||"Du kehrst zurück...",4000);
          setTimeout(function(){goToCity(exit.fallback);},2000);
        },1500);
      }
      return;
    }
    var target=getZone(exit.id);
    if(target&&target.type==="city"){goToCity(exit.id);}
    else navigateTo(exit.id);
  } else {
    clearInterval(STAGE_INTERVAL); _waitingForInput=true;
    renderRouteChoice(zone,exits);
  }
}

function handleWaypointChoice(exitId) { navigateTo(exitId); }

// ══════════════════════════════════════════════════════════════
//  advanceStage
// ══════════════════════════════════════════════════════════════
function advanceStage() {
  if(!STATE)return;
  var zone=getZone(STATE.currentZoneId); if(!zone)return;
  STATE.currentStage++;
  if(STATE.currentStage>zone.stageCount){
    STATE.currentStage=1;
    if(zone.terminus){handleTerminus(zone); return;}
    if(zone.next){
      var nz=getZone(zone.next); STATE.currentZoneId=zone.next; markZoneVisited(zone.next);
      if(nz){if(nz.type==="city"){goToCity(zone.next);return;} renderZoneBg(nz); showToast("Neue Zone: "+nz.name+"!");}
    }else{showToast("Kanto komplett!");}
  }
  renderStageInfo(); renderPlayerSprites(); renderWorldTab(); saveGame();
}

// ══════════════════════════════════════════════════════════════
//  GEBÄUDE-SYSTEM
// ══════════════════════════════════════════════════════════════
function getBuildingIcon(type) {
  return {pokecenter:"🏥",pokemart:"🏪",lab:"🔬",museum:"🏛️",special:"✨"}[type]||"🏠";
}
function enterBuilding(buildingId) {
  var bldg=getZone(buildingId); if(!bldg) return;
  STATE.currentBuilding=buildingId; _waitingForInput=true; _inCity=true;
  renderBuildingView(bldg); saveGame();
}
function leaveBuilding() {
  var bldgId=STATE.currentBuilding;
  var bldg=bldgId?getZone(bldgId):null;
  var parentCityId=bldg?bldg.parentCity:STATE.currentZoneId;
  STATE.currentBuilding=null;
  renderCityHub(getZone(parentCityId||STATE.currentZoneId));
}
function renderBuildingView(bldg) {
  var container=document.getElementById("viewWorld"); if(!container) return;
  var html="<div class='city-view'>";
  html+="<div class='city-header'><div class='city-title'>"+getBuildingIcon(bldg.buildingType)+" "+bldg.name+"</div></div>";
  switch(bldg.buildingType){
    case "pokecenter": html+=renderPokeCenter(bldg); break;
    case "pokemart":   html+=renderPokeMarkt(bldg);  break;
    default:           html+=renderSpecialBuildingContent(bldg); break;
  }
  html+="<button class='city-continue-btn' style='background:linear-gradient(135deg,#6366f1,#818cf8)' onclick='leaveBuilding()'>← Zurück zur Stadt</button>";
  html+="</div>";
  container.innerHTML=html; switchTab("World");
}

// ── Pokémon-Center ────────────────────────────────────────────
function renderPokeCenter(bldg) {
  var html="<div class='bldg-section'>";
  html+="<div class='bldg-section-title'>Krankenschwester Joy</div>";
  html+="<div class='bldg-npc-row'>"+
    "<img src='https://play.pokemonshowdown.com/sprites/trainers/nurse.png' class='bldg-npc-portrait' onerror='this.style.display=\"none\"'>"+
    "<div class='bldg-npc-text'>\"Herzlich willkommen! Wir bringen dein Pokémon wieder auf Vordermann!\"</div>"+
  "</div>"+
  "<button class='city-btn' onclick='healAndRefresh()'>Team vollständig heilen</button></div>";
  // Auch NPC-Tausch anzeigen wenn vorhanden
  if(bldg.features&&bldg.features.length>0){
    html+="<div style='margin-top:8px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px'>";
    bldg.features.forEach(function(feat){
      if(feat.type==="npc_trade") html+=renderNpcTrade(feat, bldg.id);
    });
    html+="</div>";
  }
  return html;
}
function healAndRefresh() {
  healPartyFully(); renderPlayerSprites(); updateHUD();
  showToast("Team vollständig geheilt! 💚");
  var bldg=getZone(STATE.currentBuilding); if(bldg) renderBuildingView(bldg);
}

// ── Pokémart ──────────────────────────────────────────────────
function renderPokeMarkt(bldg) {
  if(!bldg.shopItems||bldg.shopItems.length===0)
    return "<p style='color:var(--color-text-secondary);padding:16px'>Keine Items verfügbar.</p>";
  var html="<div class='bldg-section'><div class='bldg-section-title'>Verkäufer</div>";
  bldg.shopItems.forEach(function(item){
    var canAfford=STATE.money>=item.cost, def=ITEM_DEFS[item.id];
    html+="<div class='shop-item'>"+
      (def&&def.img?"<img src='"+def.img+"' width='28' height='28' style='image-rendering:pixelated;margin-right:8px'>":"")+
      "<div class='shop-item-info'><div class='shop-item-name'>"+item.name+"</div><div class='shop-item-desc'>"+item.desc+"</div></div>"+
      "<div class='shop-item-price'>"+item.cost+" ₽</div>"+
      "<button class='shop-buy-btn' "+(canAfford?"":"disabled")+" onclick='buyItemBuilding(\""+item.id+"\","+item.cost+")'>Kaufen</button>"+
    "</div>";
  });
  return html+"</div>";
}
function buyItemBuilding(itemId, cost) {
  if(!STATE||STATE.money<cost){showToast("Nicht genug Geld!");return;}
  STATE.money-=cost; STATE.items[itemId]=(STATE.items[itemId]||0)+1;
  updateHUD(); var bldg=getZone(STATE.currentBuilding); if(bldg) renderBuildingView(bldg);
  saveGame(); showToast((ITEM_DEFS[itemId]?ITEM_DEFS[itemId].name:itemId)+" gekauft!");
}

// ══════════════════════════════════════════════════════════════
//  SONDERGEBÄUDE — alle Feature-Typen
// ══════════════════════════════════════════════════════════════
function renderSpecialBuildingContent(bldg) {
  if(!bldg.features||bldg.features.length===0) return "";
  var html="";
  bldg.features.forEach(function(feat){
    html+="<div class='bldg-section'>";
    html+="<div class='bldg-section-title'>"+feat.label+"</div>";
    if(feat.desc) html+="<div class='bldg-feat-desc'>"+feat.desc+"</div>";

    switch(feat.type) {
      case "heal":
        html+="<button class='city-btn' onclick='healAndRefresh()'>Team heilen</button>";
        break;

      case "lore":
        if(feat.text) html+="<div class='bldg-lore-text'>"+feat.text+"</div>";
        if(feat.flagId&&!isEventFlagSet(feat.flagId)){
          html+="<button class='city-btn' onclick='doLoreEvent(\""+feat.flagId+"\",\""+bldg.id+"\")'>Gespräch beenden</button>";
        }
        break;

      case "fossil_revival":
        html+=renderFossilRevival(feat);
        break;

      case "rival_fight_ship":
      case "rival_fight_silph":
        if(!isEventFlagSet(feat.flagId)){
          html+="<button class='city-btn city-rival-btn' onclick='triggerBuildingRival(\""+bldg.id+"\",\""+feat.id+"\")'>⚔️ Gary herausfordern!</button>";
        } else {
          html+="<div class='bldg-lore-text'>✅ Gary wurde bereits besiegt.</div>";
        }
        break;

      // ── NEU: VM/HM erhalten ──────────────────────────────
      case "give_hm":
        html+=renderGiveHm(feat, bldg.id);
        break;

      // ── NEU: NPC-Tausch ───────────────────────────────────
      case "npc_trade":
        html+=renderNpcTrade(feat, bldg.id);
        break;
    }
    html+="</div>";
  });
  return html;
}

// ══════════════════════════════════════════════════════════════
//  GIVE_HM — VM erhalten (Zerschneider, Surfer usw.)
// ══════════════════════════════════════════════════════════════
function renderGiveHm(feat, bldgId) {
  var def=ITEM_DEFS[feat.item]||{};
  var alreadyHave=(STATE.items[feat.item]||0)>0;
  var condOk=!feat.condition||checkExitCondition(feat.condition);

  if(alreadyHave){
    return "<div class='bldg-lore-text'>✅ Du besitzt bereits <b>"+def.name+"</b>!</div>";
  }
  if(!condOk){
    return "<div class='bldg-lore-text' style='border-color:rgba(239,68,68,.3)'>"+
      "🔒 "+feat.lockedMsg+"</div>";
  }

  var typeColor=(def.hmType&&typeof TYPE_COLORS!=="undefined"&&TYPE_COLORS[def.hmType])?TYPE_COLORS[def.hmType]:"#818cf8";
  return "<div class='bldg-hm-reward'>"+
    (def.img?"<img src='"+def.img+"' width='40' height='40' style='image-rendering:pixelated;margin-right:12px' onerror='this.style.display=\"none\"'>":"")+
    "<div style='flex:1'>"+
      "<div style='font-size:14px;font-weight:700;color:#ddd'>"+def.name+"</div>"+
      "<div style='font-size:11px;margin-top:3px'><span class='type-badge' style='background:"+typeColor+"'>"+def.hmType+"</span></div>"+
      "<div style='font-size:12px;color:#aaa;margin-top:4px'>"+def.desc+"</div>"+
    "</div>"+
  "</div>"+
  "<button class='city-btn city-rival-btn' style='background:linear-gradient(135deg,#0f6e56,#1d9e75)!important' "+
    "onclick='acquireHm(\""+feat.item+"\",\""+feat.flagId+"\",\""+bldgId+"\")'>"+
    "📀 VM erhalten!</button>";
}

function acquireHm(itemId, flagId, bldgId) {
  if(!STATE) return;
  if((STATE.items[itemId]||0)>0){showToast("Du hast "+itemId+" bereits!"); return;}
  STATE.items[itemId]=(STATE.items[itemId]||0)+1;
  if(flagId) setEventFlag(flagId);
  var def=ITEM_DEFS[itemId]||{};
  showToast("📀 "+def.name+" erhalten! "+def.usageDesc,5000);
  saveGame();
  renderBagScreen(); // Bag aktualisieren
  var bldg=getZone(bldgId); if(bldg) renderBuildingView(bldg);
}

// ══════════════════════════════════════════════════════════════
//  NPC_TRADE — Einmaliger Pokémon-Tausch
// ══════════════════════════════════════════════════════════════
function renderNpcTrade(feat, bldgId) {
  if(isEventFlagSet(feat.flagId)){
    var getPd=PKMN[feat.get];
    return "<div class='bldg-lore-text'>✅ Tausch abgeschlossen! Du hast "+
      (getPd?getPd.name:"das Pokémon")+" erhalten.</div>";
  }
  var givePd=PKMN[feat.give], getPd=PKMN[feat.get];
  var npcSpr=(TRAINER_SPRITES&&TRAINER_SPRITES[feat.npcSprite])?TRAINER_SPRITES[feat.npcSprite]:"";
  var hasGive=STATE.party.some(function(p){return p.dexId===feat.give&&p.currentHP>0;});

  var html="";
  // NPC-Dialog
  html+="<div class='bldg-npc-row'>"+
    (npcSpr?"<img src='"+npcSpr+"' class='bldg-npc-portrait' onerror='this.style.display=\"none\"'>":"")+
    "<div class='bldg-npc-text'><b>"+feat.npcName+":</b> \""+feat.text+"\"</div>"+
  "</div>";
  // Tausch-Vorschau
  html+="<div class='npc-trade-preview'>"+
    "<div class='trade-pkmn-card'>"+
      "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+(feat.give||1)+".png' onerror='this.style.display=\"none\"'>"+
      "<div class='trade-pkmn-name'>"+(givePd?givePd.name:"?")+"</div>"+
      "<div class='trade-pkmn-label'>Dein Pokémon</div>"+
    "</div>"+
    "<div class='trade-arrow-big'>⇆</div>"+
    "<div class='trade-pkmn-card'>"+
      "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+(feat.get||1)+".png' onerror='this.style.display=\"none\"'>"+
      "<div class='trade-pkmn-name'>"+(getPd?getPd.name:"?")+"</div>"+
      "<div class='trade-pkmn-label'>NPC-Pokémon</div>"+
    "</div>"+
  "</div>";
  // Tausch-Button
  if(hasGive){
    html+="<button class='city-btn' style='width:100%;margin-top:8px' onclick='executeNpcTrade(\""+bldgId+"\",\""+feat.flagId+"\","+feat.give+","+feat.get+")'>"+
      "✨ Tauschen"+
    "</button>";
  } else {
    html+="<div class='bldg-lore-text' style='text-align:center;color:#f87171'>"+
      "❌ Du brauchst "+(givePd?givePd.name:"?")+" in deiner Party (bei Bewusstsein)!</div>";
  }
  return html;
}

function executeNpcTrade(bldgId, flagId, giveDexId, getDexId) {
  if(!STATE||isEventFlagSet(flagId)) return;
  var giveIdx=STATE.party.findIndex(function(p){return p.dexId===giveDexId&&p.currentHP>0;});
  if(giveIdx<0){showToast("Pokémon nicht verfügbar!"); return;}
  var givePd=PKMN[giveDexId], getPd=PKMN[getDexId];
  // Pokémon austauschen
  var traded=STATE.party.splice(giveIdx,1)[0];
  var received=createPkmnInstance(getDexId, traded.level);
  received.nick=(getPd?getPd.name:"?")+" (getauscht)";
  if(addToParty(received)){showToast("✨ Tausch erfolgreich!");}
  else{addToBox(received);showToast("✨ "+(getPd?getPd.name:"?")+" → Box!");}
  showToast("Getauscht: "+(givePd?givePd.name:"?")+" → "+(getPd?getPd.name:"?")+"!",4000);
  if(STATE.seen)  STATE.seen[getDexId]=true;
  if(STATE.caught)STATE.caught[getDexId]=true;
  setEventFlag(flagId);
  saveGame(); renderTeamScreen();
  var bldg=getZone(bldgId); if(bldg) renderBuildingView(bldg);
}

// ══════════════════════════════════════════════════════════════
//  Fossil Revival, Lore-Events
// ══════════════════════════════════════════════════════════════
function renderFossilRevival(feat) {
  var html="";
  feat.fossils.forEach(function(f){
    var hasItem=(STATE.items[f.item]||0)>0, pd=PKMN[f.result];
    html+="<div class='shop-item'>"+
      "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+f.result+".png' width='40' style='image-rendering:pixelated'>"+
      "<div class='shop-item-info'><div class='shop-item-name'>"+(pd?pd.name:f.resultName)+"</div><div class='shop-item-desc'>"+f.itemName+"</div></div>"+
      "<button class='shop-buy-btn' "+(hasItem?"":"disabled")+" onclick='reviveFossil(\""+f.item+"\","+f.result+")'>"+
      (hasItem?"Wiederbeleben":"Fossil fehlt")+"</button>"+
    "</div>";
  });
  return html;
}
function reviveFossil(itemId, dexId) {
  if(!STATE||(!STATE.items[itemId]||STATE.items[itemId]<=0)){showToast("Fossil nicht vorhanden!");return;}
  STATE.items[itemId]--;
  var pd=PKMN[dexId], pkmn=createPkmnInstance(dexId,30);
  if(addToParty(pkmn)){showToast("🦕 "+(pd?pd.name:"?")+" Lv.30 → Party!");}
  else{addToBox(pkmn);showToast("🦕 "+(pd?pd.name:"?")+" Lv.30 → Box!");}
  if(STATE.seen)  STATE.seen[dexId]=true;
  if(STATE.caught)STATE.caught[dexId]=true;
  saveGame(); var bldg=getZone(STATE.currentBuilding); if(bldg) renderBuildingView(bldg);
}
function doLoreEvent(flagId, bldgId) {
  setEventFlag(flagId);
  if(flagId==="silph_president_met"){
    STATE.items.masterball=(STATE.items.masterball||0)+1;
    showToast("Du hast einen Meisterball erhalten! 🔮",5000); updateHUD();
  }
  saveGame(); var bldg=getZone(bldgId); if(bldg) renderBuildingView(bldg);
}
function triggerBuildingRival(bldgId, featId) {
  var bldg=getZone(bldgId); if(!bldg||!bldg.features) return;
  var feat=bldg.features.find(function(f){return f.id===featId;});
  if(!feat||isEventFlagSet(feat.flagId)) return;
  var party=feat.party||[{dexId:getRivalStarterDexId(),lv:feat.rivalLevel||15}];
  clearInterval(STAGE_INTERVAL); _waitingForInput=true;
  var rivalTrainer={name:"Gary",isRival:true,party:party,reward:feat.reward||500,
    returnToCity:false,returnToBuilding:true,buildingId:bldgId,rivalKey:feat.flagId};
  startBattle("trainer",rivalTrainer);
  renderEnemySprite(BATTLE.enemy,true);showBattleUI(BATTLE.enemy);clearBattleLog();
  var spr=TRAINER_SPRITES.rival; if(spr)renderTrainerPortrait("Gary",spr);
  appendBattleLog("⚡ Gary fordert dich heraus!");
  if(BATTLE.autoFight)startBattleLoop();
}

// ══════════════════════════════════════════════════════════════
//  WAYPOINTS
// ══════════════════════════════════════════════════════════════
function triggerWaypointRival(zone, wp) {
  clearInterval(STAGE_INTERVAL); _waitingForInput=true;
  var party=wp.party||[{dexId:getRivalStarterDexId(),lv:wp.rivalLevel||10}];
  var rivalTrainer={name:wp.rivalName||"Gary",isRival:true,party:party,reward:wp.reward||200,
    returnToCity:false,waypointReturn:true,waypointFlagId:wp.flagId};
  startBattle("trainer",rivalTrainer);
  var epd=PKMN[BATTLE.enemy.dexId];
  renderEnemySprite(BATTLE.enemy,true);showBattleUI(BATTLE.enemy);clearBattleLog();
  var spr=TRAINER_SPRITES.rival; if(spr)renderTrainerPortrait(wp.rivalName||"Gary",spr);
  if(wp.dialogBefore) appendBattleLog(wp.dialogBefore);
  appendBattleLog((wp.rivalName||"Gary")+" schickt "+(epd?epd.name:"?")+" Lv."+BATTLE.enemy.level+"!");
  if(BATTLE.autoFight)startBattleLoop();
}
function renderRouteChoice(zone, exits) {
  var container=document.getElementById("viewWorld"); if(!container) return;
  var html="<div class='city-view'><div class='city-header'><div class='city-title'>🔀 Wegkreuzung</div>"+
    "<div class='city-subtitle'>Wähle deinen nächsten Weg:</div></div><div class='hub-exits'>";
  exits.forEach(function(exit){
    var locked=exit.condition&&!checkExitCondition(exit.condition);
    html+="<div class='hub-exit-card"+(locked?" hub-exit-locked":"")+"' "+(locked?"":"onclick='handleWaypointChoice(\""+exit.id+"\")'")+">" +
      "<div class='hub-exit-label'>"+(exit.label||exit.id)+"</div>"+
      (exit.desc?"<div class='hub-exit-desc'>"+exit.desc+"</div>":"")+
      (locked?"<div class='hub-exit-locked-msg'>🔒 "+(exit.lockedMsg||"Gesperrt")+"</div>":"")+
    "</div>";
  });
  container.innerHTML=html+"</div></div>"; switchTab("World");
}

// ══════════════════════════════════════════════════════════════
//  CITY HUB
// ══════════════════════════════════════════════════════════════
function renderCityView(zone) { renderCityHub(zone); }

function renderCityHub(zone) {
  var container=document.getElementById("viewWorld"); if(!container||!zone) return;
  var html="<div class='city-view'>";
  var rivalPending=zone.cityRival&&!isEventFlagSet(zone.cityRival.flagId);
  html+="<div class='city-header'>"+
    "<div class='city-title'>🏙️ "+zone.name+"</div>"+
    "<div class='city-subtitle'>"+(rivalPending?"<b>"+zone.cityRival.name+"</b> wartet auf dich!":"Du hast die Stadt erreicht!")+"</div>"+
  "</div>";
  // Rival
  if(rivalPending&&zone.cityRival){
    var riv=zone.cityRival, spr=(TRAINER_SPRITES&&TRAINER_SPRITES[riv.sprite])?TRAINER_SPRITES[riv.sprite]:"";
    html+="<div class='city-rival-block'><div class='city-rival-inner'>"+
      (spr?"<img src='"+spr+"' class='city-rival-portrait' onerror='this.style.display=\"none\"'>":"")+
      "<div class='city-rival-text'><b>"+riv.name+":</b> \""+(riv.dialogBefore||"Hey! Ich fordere dich heraus!")+"\"</div>"+
    "</div><button class='city-btn city-rival-btn' onclick='triggerCityRivalHub(getZone(\""+zone.id+"\"))'>⚔️ Gegen "+riv.name+" kämpfen!</button></div>";
  }
  // Gebäude
  if(zone.buildings&&zone.buildings.length>0){
    html+="<div class='hub-section-title'>Gebäude</div><div class='hub-buildings'>";
    zone.buildings.forEach(function(bid){
      var b=getZone(bid); if(!b) return;
      html+="<div class='hub-building-card' onclick='enterBuilding(\""+bid+"\")'><div class='hub-bldg-icon'>"+getBuildingIcon(b.buildingType)+"</div><div class='hub-bldg-name'>"+b.name+"</div></div>";
    });
    html+="</div>";
  }
  // Exits
  if(zone.exits&&zone.exits.length>0){
    var gymExits=zone.exits.filter(function(e){return e.type==="gym";});
    var routeExits=zone.exits.filter(function(e){return e.type!=="gym";});
    if(gymExits.length>0){
      html+="<div class='hub-section-title'>Arena</div>";
      gymExits.forEach(function(exit){
        var gym=getZone(exit.id);
        var locked=exit.condition&&!checkExitCondition(exit.condition);
        var badgeEarned=gym&&gym.gymLeader&&STATE.badgeIds.indexOf(gym.gymLeader.badgeId)>=0;
        html+="<div class='city-gym-block"+(badgeEarned?" city-gym-beaten":"")+"'>"+
          "<div class='city-gym-inner'>";
        if(gym&&gym.gymLeader){
          var gl=gym.gymLeader, glSpr=getGymLeaderSprite(gl.name);
          html+=(glSpr?"<img src='"+glSpr+"' class='city-gym-portrait' onerror='this.style.display=\"none\"'>":"")+
            "<div class='city-gym-info'>"+
              "<div class='city-gym-name'>⚔️ "+(gym.name||exit.label)+"</div>"+
              "<div class='city-gym-leader'>Arenaleiter: <b>"+gl.name+"</b></div>"+
              (badgeEarned?"<div class='city-gym-req'>🏅 "+gl.badge+" erhalten</div>":"")+
            "</div>";
        }
        html+="</div>";
        if(locked){
          html+="<div class='bldg-lore-text' style='border-color:rgba(239,68,68,.3);font-size:12px;margin-bottom:8px'>🔒 "+exit.lockedMsg+"</div>";
        }
        html+="<button class='city-gym-btn"+(locked?" city-gym-btn-locked":"")+"' "+
          (locked?"disabled":"onclick='challengeGym(\""+exit.id+"\")'")+">" +
          (badgeEarned?"🔄 Nochmal herausfordern":"⚔️ Arena herausfordern")+
        "</button></div>";
      });
    }
    if(routeExits.length>0){
      html+="<div class='hub-section-title'>Reisen</div><div class='hub-exits'>";
      routeExits.forEach(function(exit){
        var locked=exit.condition&&!checkExitCondition(exit.condition);
        html+="<div class='hub-exit-card"+(locked?" hub-exit-locked":"")+"' "+(locked?"":"onclick='travelToExit(\""+exit.id+"\")'")+">" +
          "<div class='hub-exit-label'>"+(exit.label||exit.id)+"</div>"+
          (exit.desc?"<div class='hub-exit-desc'>"+exit.desc+"</div>":"")+
          (locked?"<div class='hub-exit-locked-msg'>🔒 "+(exit.lockedMsg||"Gesperrt")+"</div>":"")+
        "</div>";
      });
      html+="</div>";
    }
  }
  html+="</div>";
  container.innerHTML=html; switchTab("World");
}

function triggerCityRivalHub(zone) {
  if(!zone||!zone.cityRival) return;
  var riv=zone.cityRival; if(isEventFlagSet(riv.flagId)){showToast(riv.name+" wurde schon besiegt!");return;}
  var party=[{dexId:getRivalStarterDexId(),lv:10}];
  var rivalTrainer={name:riv.name,isRival:true,party:party,reward:riv.reward||100,
    returnToCity:true,cityZoneId:zone.id,rivalKey:riv.flagId};
  clearInterval(STAGE_INTERVAL);
  startBattle("trainer",rivalTrainer);
  renderEnemySprite(BATTLE.enemy,true);showBattleUI(BATTLE.enemy);clearBattleLog();
  var spr=TRAINER_SPRITES[riv.sprite]||TRAINER_SPRITES.rival; if(spr)renderTrainerPortrait(riv.name,spr);
  appendBattleLog("⚡ "+riv.name+" fordert dich heraus!");
  appendBattleLog(riv.name+" schickt "+(PKMN[BATTLE.enemy.dexId]?PKMN[BATTLE.enemy.dexId].name:"?")+" Lv."+BATTLE.enemy.level+"!");
  if(BATTLE.autoFight)startBattleLoop();
}

function challengeGym(gymZoneId) {
  var gym=getZone(gymZoneId); if(!gym) return;
  if(gym.minBadges&&STATE.badges<gym.minBadges){showToast("🔒 "+gym.name+" – "+gym.minBadges+" Orden nötig!",4000);return;}
  _waitingForInput=false; _inCity=false; STATE.currentBuilding=null;
  STATE.currentZoneId=gymZoneId; STATE.currentStage=1; markZoneVisited(gymZoneId); renderZoneBg(gym);
  renderStageInfo(); renderPlayerSprites(); renderWorldTab();
  showToast("⚔️ Du betrittst "+gym.name+"!"); saveGame(); startStageLoop();
}

// ── Tab-System ────────────────────────────────────────────────
function switchTab(tabName){
  ["World","Team","Bag","Map","Dex"].forEach(function(t){
    var btn=document.getElementById("tab"+t),view=document.getElementById("view"+t);
    if(btn)btn.classList.toggle("active",t===tabName);
    if(view)view.style.display=(t===tabName)?"block":"none";
  });
  if(tabName==="Team")renderTeamScreen();
  if(tabName==="Bag") renderBagScreen();
  if(tabName==="Map") renderMapScreen();
  if(tabName==="World")renderWorldTab();
  if(tabName==="Dex") renderPokedexScreen();
}
function onTabWorld(){switchTab("World");}
function onTabTeam() {switchTab("Team");}
function onTabBag()  {switchTab("Bag");}
function onTabMap()  {switchTab("Map");}
function onTabDex()  {switchTab("Dex");}

// ── Wildkampf ─────────────────────────────────────────────────
function triggerWildBattle(wildPkmn){
  clearInterval(STAGE_INTERVAL); _waitingForInput=true;
  var epd=PKMN[wildPkmn.dexId],name=epd?epd.name:"?";
  if(STATE){if(!STATE.seen)STATE.seen={};STATE.seen[wildPkmn.dexId]=true;}
  startBattle("wild",wildPkmn);
  renderEnemySprite(BATTLE.enemy,true);showBattleUI(BATTLE.enemy);clearBattleLog();
  if(wildPkmn.shiny){appendBattleLog("✨✨✨ Ein SCHILLERNDES "+name+" erscheint! ✨✨✨");showToast("✨ Schillerndes "+name+"! ✨",6000);}
  else{appendBattleLog("Ein wildes "+name+" Lv."+wildPkmn.level+" taucht auf!");}
  if(BATTLE.autoFight)startBattleLoop();
}

// ── Battle-UI ─────────────────────────────────────────────────
function showBattleUI(enemy){
  var ui=document.getElementById("battlePanel");if(ui)ui.classList.add("battle-active");
  var ibtn=document.getElementById("itemBattleBtn");if(ibtn)ibtn.style.display="block";
  renderMoveButtons();renderCatchBalls(false);updateCatchButton(enemy);
}
function hideBattleUI(){
  var ui=document.getElementById("battlePanel");if(ui)ui.classList.remove("battle-active");
  var mb=document.getElementById("moveButtons");if(mb)mb.innerHTML="";
  var ibtn=document.getElementById("itemBattleBtn");if(ibtn)ibtn.style.display="none";
  renderCatchBalls(false);hideTrainerPortrait();clearFxCanvas();closeBattleItemPanel();
}

var BATTLE_USABLE_ITEMS=["maxpotion","fullrestore","hyperpotion","superpotion","potion","fullheal","antidote","awakening","paralysheal","revive"];
function showBattleItemPanel(){
  if(document.getElementById("battleItemPanel")){closeBattleItemPanel();return;}
  if(!STATE||!ITEM_DEFS)return;
  var hasAny=BATTLE_USABLE_ITEMS.some(function(k){return(STATE.items[k]||0)>0;});
  if(!hasAny){showToast("Keine Items dabei!");return;}
  var panel=document.createElement("div");panel.id="battleItemPanel";panel.className="battle-item-panel";
  panel.innerHTML="<div class='bip-header'><span>🎒 Item wählen</span><button class='bip-close' onclick='closeBattleItemPanel()'>✕</button></div><div class='bip-grid' id='bipGrid'></div>";
  var actions=document.getElementById("battleActions"),mb=document.getElementById("moveButtons");
  if(actions&&mb)actions.insertBefore(panel,mb);
  var grid=document.getElementById("bipGrid");
  BATTLE_USABLE_ITEMS.forEach(function(key){
    var count=STATE.items[key]||0;if(count<=0)return;
    var def=ITEM_DEFS[key];if(!def)return;
    var player=getActivePkmn(),usable=true;
    if((key==="potion"||key==="superpotion"||key==="hyperpotion"||key==="maxpotion")&&player&&player.currentHP>=player.maxHP)usable=false;
    if(key==="antidote"&&player&&player.status!=="poison")usable=false;
    if(key==="awakening"&&player&&player.status!=="sleep")usable=false;
    if(key==="paralysheal"&&player&&player.status!=="paralysis")usable=false;
    if(key==="fullheal"&&player&&!player.status)usable=false;
    if(key==="revive"&&!STATE.party.find(function(p){return p.currentHP<=0;}))usable=false;
    var btn=document.createElement("button");
    btn.className="bip-item"+(usable?"":" bip-item-disabled");btn.disabled=!usable;btn.title=def.name+": "+def.desc;
    btn.innerHTML="<img src='"+(def.img||"")+"' class='bip-sprite' onerror='this.style.display=\"none\"'><span class='bip-name'>"+def.name+"</span><span class='bip-count'>x"+count+"</span>";
    if(usable)btn.onclick=(function(k){return function(){useBattleItem(k);};})(key);
    grid.appendChild(btn);
  });
}
function closeBattleItemPanel(){var el=document.getElementById("battleItemPanel");if(el&&el.parentNode)el.parentNode.removeChild(el);}

// ══════════════════════════════════════════════════════════════
//  onBattleEnd
// ══════════════════════════════════════════════════════════════
function onBattleEnd(result) {
  clearInterval(BATTLE_INTERVAL); _animRunning=false; hideTrainerPortrait();

  if(result==="win"&&BATTLE.trainerData&&BATTLE.trainerData.returnToCity){
    setTimeout(function(){
      var xp=BATTLE.xpGained||0,msgs=[];
      STATE.party.forEach(function(p){if(p.currentHP>0)applyXP(p,xp).forEach(function(m){msgs.push(m);});});
      msgs.forEach(function(m){appendBattleLog(m);}); if(xp>0)showXPPopup(xp);
      if(BATTLE.moneyGained>0){STATE.money+=BATTLE.moneyGained;appendBattleLog("+"+BATTLE.moneyGained+" ₽!");updateHUD();}
      if(BATTLE.trainerData.rivalKey)setEventFlag(BATTLE.trainerData.rivalKey);
      saveGame();
      setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=true;_inCity=true;
        var city=getZone(BATTLE.trainerData.cityZoneId); if(city)renderCityHub(city);},1500);
    },500); return;
  }

  if(result==="win"&&BATTLE.trainerData&&BATTLE.trainerData.returnToBuilding){
    setTimeout(function(){
      var xp=BATTLE.xpGained||0,msgs=[];
      STATE.party.forEach(function(p){if(p.currentHP>0)applyXP(p,xp).forEach(function(m){msgs.push(m);});});
      msgs.forEach(function(m){appendBattleLog(m);}); if(xp>0)showXPPopup(xp);
      if(BATTLE.moneyGained>0){STATE.money+=BATTLE.moneyGained;appendBattleLog("+"+BATTLE.moneyGained+" ₽!");updateHUD();}
      if(BATTLE.trainerData.rivalKey)setEventFlag(BATTLE.trainerData.rivalKey);
      saveGame();
      setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=true;_inCity=true;
        STATE.currentBuilding=BATTLE.trainerData.buildingId;
        var bldg=getZone(BATTLE.trainerData.buildingId); if(bldg)renderBuildingView(bldg);},1500);
    },500); return;
  }

  if(result==="win"&&BATTLE.trainerData&&BATTLE.trainerData.waypointReturn){
    setTimeout(function(){
      var xp=BATTLE.xpGained||0,msgs=[];
      STATE.party.forEach(function(p){if(p.currentHP>0)applyXP(p,xp).forEach(function(m){msgs.push(m);});});
      msgs.forEach(function(m){appendBattleLog(m);}); if(xp>0)showXPPopup(xp);
      if(BATTLE.moneyGained>0){STATE.money+=BATTLE.moneyGained;appendBattleLog("+"+BATTLE.moneyGained+" ₽!");updateHUD();}
      if(BATTLE.trainerData.waypointFlagId)setEventFlag(BATTLE.trainerData.waypointFlagId);
      saveGame();
      setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=false;
        renderPlayerSprites();advanceStage();startStageLoop();},2000);
    },500); return;
  }

  if(result==="win"){
    setTimeout(function(){
      var xp=BATTLE.xpGained||0,msgs=[],eid=BATTLE.enemy?BATTLE.enemy.dexId:null;
      STATE.party.forEach(function(p){if(p.currentHP>0)applyXP(p,xp,eid).forEach(function(m){msgs.push(m);});});
      msgs.forEach(function(m){appendBattleLog(m);}); if(xp>0)showXPPopup(xp);
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
  }else if(result==="catch"||result==="flee"){
    appendBattleLog(result==="flee"?"Du bist geflohen!":"Pokémon gefangen!");saveGame();
    setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=false;
      renderPlayerSprites();advanceStage();startStageLoop();},1800);
  }else{
    clearInterval(STAGE_INTERVAL);
    setTimeout(function(){showBlackout(function(){
      healPartyFully();STATE.party.forEach(function(p){p._faintAnnounced=false;});
      var mainZones=WORLD.filter(function(z){return z.type==="city"||z.type==="route"||z.type==="dungeon"||z.type==="sea"||z.type==="gym";});
      var ci=mainZones.findIndex(function(z){return z.id===STATE.currentZoneId;});
      for(var i=ci;i>=0;i--){if(mainZones[i].type==="city"||i===0){STATE.currentZoneId=mainZones[i].id;STATE.currentStage=1;break;}}
      saveGame();hideBattleUI();renderEnemySprite(null,false);_waitingForInput=false;
      var zn=getZone(STATE.currentZoneId);if(zn)renderZoneBg(zn);
      renderStageInfo();renderPlayerSprites();renderWorldTab();
      showToast("Du bist in "+(zn?zn.name:"einer Stadt")+" aufgewacht! Team geheilt.",4000);
      startStageLoop();
    });},600);
  }
}
