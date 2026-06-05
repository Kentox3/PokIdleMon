
// ══════════════════════════════════════════════════════════════
// renderer_patch.js — Überschreibt Funktionen aus renderer.js
// ══════════════════════════════════════════════════════════════

var SD_SHINY_FRONT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/";
var SD_SHINY_BACK  = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/shiny/";
var PNG_SHINY      = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/";
var PNG_SHINY_BACK = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/";

function spriteUrl(dexId, back, shiny) {
  if (shiny) return (back ? SD_SHINY_BACK : SD_SHINY_FRONT) + dexId + ".gif";
  var SD_F = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/";
  return (back ? SD_F+"back/" : SD_F) + dexId + ".gif";
}
function spriteFallback(dexId, back, shiny) {
  if (shiny) return (back ? PNG_SHINY_BACK : PNG_SHINY) + dexId + ".png";
  var PNG_F = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
  return (back ? PNG_F+"back/" : PNG_F) + dexId + ".png";
}

// ── Hintergrundbild-Cache ─────────────────────────────────────
var _bgImageCache = {};

// Gym-Nummerierung: gym1.png, gym2.png, ...
// Wird einmalig aus WORLD aufgebaut
var _gymIndexMap = null;
function _getGymImgKey(zone) {
  if (!_gymIndexMap) {
    _gymIndexMap = {};
    var n = 0;
    WORLD.forEach(function(z) {
      if (z.type === "gym") { n++; _gymIndexMap[z.id] = "gym" + n; }
    });
  }
  return _gymIndexMap[zone.id] || null;
}

function renderZoneBg(zone) {
  if (!zone) return;
  if (_sceneAnimId) cancelAnimationFrame(_sceneAnimId);
  getSceneCanvas(); if (!_sceneCtx) return;
  _sceneT = 0;

  // Dateiname: Gyms → "gym1", "gym2", ...; alle anderen → Zonen-Index
  var imgKey;
  if (zone.type === "gym") {
    imgKey = _getGymImgKey(zone); // z.B. "gym1"
  } else {
    var zoneIdx = WORLD ? WORLD.findIndex(function(z){ return z.id===zone.id; }) : -1;
    imgKey = String(zoneIdx + 1);  // z.B. "1", "2", ...
  }

  var drawFn;
  if      (zone.type==="sea")     drawFn=function(){ drawSea(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT); };
  else if (zone.type==="gym")     drawFn=function(){ drawGym(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT); };
  else if (zone.type==="city")    drawFn=function(){ drawCity(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT); };
  else if (zone.type==="dungeon") {
    if (zone.id.indexOf("forest")>=0)    drawFn=function(){ drawForest(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT); };
    else if (zone.id==="pokemon_tower")  drawFn=function(){ drawTower(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT); };
    else                                 drawFn=function(){ drawCave(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT); };
  }
  else drawFn=function(){ drawRoute(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT,zone); };

  if (_bgImageCache[imgKey]===undefined) {
    _bgImageCache[imgKey]='loading';
    var img=new Image();
    img.onload =function(){ _bgImageCache[imgKey]=img; };
    img.onerror=function(){ _bgImageCache[imgKey]=null; };
    img.src='bg/'+imgKey+'.png';
  }
  function loop(){
    var cached=_bgImageCache[imgKey];
    if(cached&&cached!=='loading'){ _sceneCtx.drawImage(cached,0,0,_sceneCanvas.width,_sceneCanvas.height); return; }
    try{ drawFn(); }catch(e){}
    _sceneT++; _sceneAnimId=requestAnimationFrame(loop);
  }
  loop();
}

// ── Gegner-Sprite ─────────────────────────────────────────────
function renderEnemySprite(enemy, visible) {
  var container=document.getElementById("enemySprite"); if(!container) return;
  if(!enemy||!visible){ container.innerHTML=""; container.style.opacity="0"; return; }
  var pd=PKMN[enemy.dexId], name=pd?pd.name:"?", shiny=!!enemy.shiny, dn=(shiny?"✨ ":"")+name;
  var typeHtml=pd?pd.types.map(function(t){ return "<span class='type-badge' style='background:"+(TYPE_COLORS[t]||"#aaa")+"'>"+t+"</span>"; }).join("") : "";
  container.style.opacity="1"; container.className=shiny?"enemy-shiny":"";
  container.innerHTML=
    "<div class='enemy-info'><div class='enemy-nameline'>"+dn+" <span class='enemy-lv'>Lv."+enemy.level+"</span>"+typeHtml+"</div>"+
    "<div class='enemy-hprow'><div class='enemy-hpbar'><div class='enemy-hpfill' id='enemyHpFill' style='width:"+Math.max(0,Math.round(enemy.currentHP/enemy.maxHP*100))+"%;background:"+hpColor(enemy.currentHP,enemy.maxHP)+"'></div></div>"+
    "<span class='enemy-hptxt' id='enemyHpTxt'>"+enemy.currentHP+"/"+enemy.maxHP+"</span></div>"+
    (enemy.status?"<span class='status-badge status-"+enemy.status+"'>"+statusText(enemy.status)+"</span>":"")+
    "</div><img class='enemy-img enemy-appear"+(shiny?" shiny-sprite":"")+"' src='"+spriteUrl(enemy.dexId,false,shiny)+"' alt='"+dn+"' onerror='this.src=\""+spriteFallback(enemy.dexId,false,shiny)+"\"'>";
}

// ── Spieler-Sprite ────────────────────────────────────────────
function renderPlayerSprites() {
  var container=document.getElementById("playerSprites"); if(!container||!STATE) return;
  container.innerHTML="";
  var lead=STATE.party.find(function(p){ return p.currentHP>0; }); if(!lead) return;
  var pd=PKMN[lead.dexId], shiny=!!lead.shiny, div=document.createElement("div");
  div.className="walker walker-lead"+(shiny?" walker-shiny":"");
  var hpPct=Math.max(0,Math.round(lead.currentHP/lead.maxHP*100));
  div.innerHTML="<img class='walker-sprite"+(shiny?" shiny-sprite":"")+"' src='"+spriteUrl(lead.dexId,true,shiny)+"' alt='"+(pd?pd.name:"?")+"' onerror='this.src=\""+spriteFallback(lead.dexId,true,shiny)+"\"'>"+
    "<div class='walker-hpbar'><div class='walker-hpfill' style='width:"+hpPct+"%;background:"+hpColor(lead.currentHP,lead.maxHP)+"'></div></div>";
  container.appendChild(div);
}

// ══════════════════════════════════════════════════════════════
//  GYM-SKIP HILFSFUNKTIONEN
// ══════════════════════════════════════════════════════════════

function _getCityGym(zone) {
  if (!zone || !zone.next) return null;
  var next = getZone(zone.next);
  return (next && next.type === "gym") ? next : null;
}

function continueFromCity() {
  _waitingForInput = false; _inCity = false;
  var zone = getZone(STATE.currentZoneId);
  var gym  = _getCityGym(zone);

  if (gym && gym.gymLeader) {
    if (STATE.badgeIds.indexOf(gym.gymLeader.badgeId) >= 0) {
      var afterGym = gym.next;
      if (afterGym) {
        STATE.currentZoneId = afterGym; STATE.currentStage = 1;
        markZoneVisited(afterGym);
        var az = getZone(afterGym); if (az) renderZoneBg(az);
        renderStageInfo(); renderPlayerSprites(); renderWorldTab();
        showToast("⏩ " + gym.name + " übersprungen – Orden bereits erhalten!");
        saveGame(); startStageLoop(); return;
      }
    }
    if (gym.minBadges && STATE.badges < gym.minBadges) {
      showToast("🔒 " + gym.name + " – " + gym.minBadges + " Orden nötig! (Du: " + STATE.badges + ")", 4000);
      var afterGym2 = gym.next;
      if (afterGym2) {
        STATE.currentZoneId = afterGym2; STATE.currentStage = 1;
        markZoneVisited(afterGym2);
        var az2 = getZone(afterGym2); if (az2) renderZoneBg(az2);
        renderStageInfo(); renderPlayerSprites(); renderWorldTab();
        saveGame(); startStageLoop(); return;
      }
    }
  }
  advanceStage(); startStageLoop();
}

function advanceStage() {
  if (!STATE) return;
  var zone = getZone(STATE.currentZoneId); if (!zone) return;
  STATE.currentStage++;
  if (STATE.currentStage > zone.stageCount) {
    STATE.currentStage = 1;
    if (zone.next) {
      var nextZone = getZone(zone.next);
      if (nextZone && nextZone.type==="gym" && nextZone.minBadges && STATE.badges < nextZone.minBadges) {
        showToast("🔒 " + nextZone.name + " gesperrt – " + nextZone.minBadges + " Orden nötig! (Du: " + STATE.badges + ")", 4000);
        var skipTo = nextZone.next;
        if (skipTo) { STATE.currentZoneId = skipTo; markZoneVisited(skipTo); var sz = getZone(skipTo); if (sz) renderZoneBg(sz); }
        else { STATE.currentZoneId = zone.next; markZoneVisited(zone.next); }
      }
      else if (nextZone && nextZone.type==="gym" && nextZone.gymLeader &&
               STATE.badgeIds.indexOf(nextZone.gymLeader.badgeId) >= 0) {
        var skipTo2 = nextZone.next;
        if (skipTo2) { STATE.currentZoneId = skipTo2; markZoneVisited(skipTo2); var sz2 = getZone(skipTo2); if (sz2) renderZoneBg(sz2); }
        else { STATE.currentZoneId = zone.next; markZoneVisited(zone.next); }
      }
      else {
        STATE.currentZoneId = zone.next; markZoneVisited(zone.next);
        if (nextZone) { renderZoneBg(nextZone); showToast("Neue Zone: " + nextZone.name + "!"); }
      }
    } else { showToast("🏆 Kanto komplett!"); }
  }
  renderStageInfo(); renderPlayerSprites(); renderWorldTab(); saveGame();
}

function challengeGym(gymZoneId) {
  var gym = getZone(gymZoneId); if (!gym) return;
  if (gym.minBadges && STATE.badges < gym.minBadges) {
    showToast("🔒 " + gym.name + " – " + gym.minBadges + " Orden nötig! (Du: " + STATE.badges + "/8)", 4000);
    return;
  }
  _waitingForInput = false; _inCity = false;
  STATE.currentZoneId = gymZoneId; STATE.currentStage = 1;
  markZoneVisited(gymZoneId);
  renderZoneBg(gym); renderStageInfo(); renderPlayerSprites(); renderWorldTab();
  showToast("⚔️ Du betrittst " + gym.name + "!");
  saveGame(); startStageLoop();
}

// ══════════════════════════════════════════════════════════════
//  STADT-ANSICHT
// ══════════════════════════════════════════════════════════════
function renderCityView(zone) {
  var container = document.getElementById("viewWorld"); if (!container) return;
  var npc = zone.id ? NPC_TRADES[zone.id] : null, npcHtml = "";
  if (npc && !npc._done) {
    var gPd = PKMN[npc.give], rPd = PKMN[npc.get];
    npcHtml = "<div class='city-npc'><img src='"+npc.sprite+"' class='npc-portrait' onerror='this.style.display=\"none\"'>"+
      "<div class='npc-bubble'><b>"+npc.npcName+":</b> "+npc.text+"</div>"+
      "<div class='npc-trade'>"+
        "<div class='trade-pkmn'><img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+npc.give+".png'><span>"+(gPd?gPd.name:"?")+"</span></div>"+
        "<span class='trade-arrow'>⇆</span>"+
        "<div class='trade-pkmn'><img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+npc.get+".png'><span>"+(rPd?rPd.name:"?")+"</span></div>"+
      "</div><button class='city-btn trade-btn' onclick='doNPCTrade(\""+zone.id+"\")'>Tauschen</button></div>";
  }
  var rivalHtml = "";
  if (zone.cityRival) {
    var rKey = zone.id+"_rival", done = isTrainerDefeated(rKey, 0);
    var spr = (TRAINER_SPRITES && TRAINER_SPRITES[zone.cityRival.sprite]) ? TRAINER_SPRITES[zone.cityRival.sprite] : "";
    rivalHtml =
      "<div class='city-rival-block"+(done?" city-rival-done":"")+"'>"+
        "<div class='city-rival-inner'>"+
          (spr?"<img src='"+spr+"' class='city-rival-portrait' onerror='this.style.display=\"none\"'>":"")+
          "<div class='city-rival-text'>"+
            (done ? "<b>"+zone.cityRival.name+":</b> „Du bist gar nicht schlecht… aber ich werde stärker!"<br><small>✅ Besiegt</small>"
                  : "<b>"+zone.cityRival.name+":</b> „Hey! Ich bin "+zone.cityRival.name+"! Ich werde der weltbeste Trainer!" ")+
          "</div></div>"+
        (!done ? "<button class='city-btn city-rival-btn' onclick='triggerCityRival(getZone(\""+zone.id+"\"))'>⚔️ Gegen "+zone.cityRival.name+" kämpfen!</button>" : "")+
      "</div>";
  }
  var rivalPending = zone.cityRival && !isTrainerDefeated(zone.id+"_rival", 0);
  var gymHtml = "";
  var gym = _getCityGym(zone);
  if (gym && gym.gymLeader) {
    var gl = gym.gymLeader, badgeEarned = STATE.badgeIds.indexOf(gl.badgeId) >= 0;
    var badgesOk = !gym.minBadges || STATE.badges >= gym.minBadges;
    var glSpr = (typeof getGymLeaderSprite === "function") ? getGymLeaderSprite(gl.name) : "";
    gymHtml =
      "<div class='city-gym-block"+(badgeEarned?" city-gym-beaten":"")+"'>"+
        "<div class='city-gym-inner'>"+
          (glSpr?"<img src='"+glSpr+"' class='city-gym-portrait' onerror='this.style.display=\"none\"'>":"")+
          "<div class='city-gym-info'>"+
            "<div class='city-gym-name'>⚔️ "+gym.name+"</div>"+
            "<div class='city-gym-leader'>Arenaleiter: <b>"+gl.name+"</b></div>"+
            (gym.minBadges?"<div class='city-gym-req'>"+(badgesOk?"✅":"🔒")+" "+gym.minBadges+" Orden nötig</div>":"")+
            (badgeEarned?"<div class='city-gym-req'>🏅 "+gl.badge+" bereits erhalten</div>":"")+
          "</div>"+
        "</div>"+
        "<button class='city-gym-btn"+(badgesOk?"":" city-gym-btn-locked")+"' "+
          (badgesOk?"onclick='challengeGym(\""+gym.id+"\")'":"disabled title='"+(gym.minBadges||"?")+" Orden nötig'")+">"+
          (badgeEarned?"🔄 Nochmal herausfordern":"⚔️ Arena herausfordern")+
        "</button>"+
      "</div>";
  }
  var continueBtn = rivalPending
    ? "<button class='city-continue-btn city-continue-disabled' disabled>🔒 Besiege zuerst "+(zone.cityRival?zone.cityRival.name:"Rivalen")+"!</button>"
    : "<button class='city-continue-btn' onclick='continueFromCity()'>➡ Weiter reisen</button>";

  container.innerHTML =
    "<div class='city-view'>"+
      "<div class='city-header'>"+
        "<div class='city-title'>🏙️ "+zone.name+"</div>"+
        "<div class='city-subtitle'>"+(rivalPending?"Dein Rival <b>"+zone.cityRival.name+"</b> wartet!":"Du hast die Stadt erreicht – Team geheilt!")+"</div>"+
      "</div>"+
      rivalHtml+gymHtml+
      "<div class='city-services'>"+
        "<div class='city-service'><div class='service-icon'>🏥</div><div class='service-name'>Pokémon-Center</div>"+
          "<div class='service-desc'>Team vollständig geheilt!</div>"+
          "<button class='city-btn' onclick='healInCity()'>Nochmal heilen</button></div>"+
        (zone.shopItems&&zone.shopItems.length>0
          ?"<div class='city-service'><div class='service-icon'>🛒</div><div class='service-name'>Shop</div>"+
            "<div class='service-desc'>Kaufe Items</div>"+
            "<button class='city-btn' onclick='showCityShop(getZone(STATE.currentZoneId))'>Shop öffnen</button></div>":"")+
      "</div>"+npcHtml+continueBtn+"</div>";
  switchTab("World");
}

// ══════════════════════════════════════════════════════════════
//  RIVAL-KAMPF IN DER STADT
// ══════════════════════════════════════════════════════════════
function triggerCityRival(zone) {
  if(!zone||!zone.cityRival) return;
  var rKey=zone.id+"_rival";
  if(isTrainerDefeated(rKey,0)){ showToast(zone.cityRival.name+" wurde schon besiegt!"); return; }
  var sm={1:4,4:7,7:1};
  var rivalDexId=sm[STATE.starter]||4, rivalPd=PKMN[rivalDexId];
  var rivalTrainer={
    name:zone.cityRival.name, isRival:true,
    party:[{dexId:rivalDexId,lv:5}],
    reward:zone.cityRival.reward||100,
    returnToCity:true, cityZoneId:zone.id, rivalKey:rKey,
  };
  clearInterval(STAGE_INTERVAL);
  startBattle("trainer",rivalTrainer);
  var epd=PKMN[BATTLE.enemy.dexId];
  renderEnemySprite(BATTLE.enemy,true); showBattleUI(BATTLE.enemy); clearBattleLog();
  var spr=TRAINER_SPRITES[zone.cityRival.sprite]||TRAINER_SPRITES.rival;
  if(spr) renderTrainerPortrait(zone.cityRival.name,spr);
  appendBattleLog("⚡ Rival "+zone.cityRival.name+" fordert dich heraus!");
  appendBattleLog(zone.cityRival.name+" schickt "+(rivalPd?rivalPd.name:"?")+" Lv.5!");
  if(BATTLE.autoFight) startBattleLoop();
}

// ── Tab-System ────────────────────────────────────────────────
function switchTab(tabName) {
  ["World","Team","Bag","Map","Dex"].forEach(function(t){
    var btn=document.getElementById("tab"+t), view=document.getElementById("view"+t);
    if(btn) btn.classList.toggle("active",t===tabName);
    if(view) view.style.display=(t===tabName)?"block":"none";
  });
  if(tabName==="Team")  renderTeamScreen();
  if(tabName==="Bag")   renderBagScreen();
  if(tabName==="Map")   renderMapScreen();
  if(tabName==="World") renderWorldTab();
  if(tabName==="Dex")   renderPokedexScreen();
}
function onTabWorld(){ switchTab("World"); }
function onTabTeam() { switchTab("Team");  }
function onTabBag()  { switchTab("Bag");   }
function onTabMap()  { switchTab("Map");   }
function onTabDex()  { switchTab("Dex");   }

function triggerWildBattle(wildPkmn) {
  clearInterval(STAGE_INTERVAL); _waitingForInput=true;
  var epd=PKMN[wildPkmn.dexId], name=epd?epd.name:"?";
  if(STATE){ if(!STATE.seen) STATE.seen={}; STATE.seen[wildPkmn.dexId]=true; }
  startBattle("wild",wildPkmn);
  renderEnemySprite(BATTLE.enemy,true); showBattleUI(BATTLE.enemy); clearBattleLog();
  if(wildPkmn.shiny){ appendBattleLog("✨✨✨ Ein SCHILLERNDES "+name+" erscheint! ✨✨✨"); showToast("✨ Schillerndes "+name+"! ✨",6000); }
  else { appendBattleLog("Ein wildes "+name+" Lv."+wildPkmn.level+" taucht auf!"); }
  if(BATTLE.autoFight) startBattleLoop();
}

function showBattleUI(enemy){
  var ui=document.getElementById("battlePanel"); if(ui) ui.classList.add("battle-active");
  var ibtn=document.getElementById("itemBattleBtn"); if(ibtn) ibtn.style.display="block";
  renderMoveButtons(); renderCatchBalls(false); updateCatchButton(enemy);
}
function hideBattleUI(){
  var ui=document.getElementById("battlePanel"); if(ui) ui.classList.remove("battle-active");
  var mb=document.getElementById("moveButtons"); if(mb) mb.innerHTML="";
  var ibtn=document.getElementById("itemBattleBtn"); if(ibtn) ibtn.style.display="none";
  renderCatchBalls(false); hideTrainerPortrait(); clearFxCanvas(); closeBattleItemPanel();
}

var BATTLE_USABLE_ITEMS=["maxpotion","fullrestore","hyperpotion","superpotion","potion","fullheal","antidote","awakening","paralysheal","revive"];
function showBattleItemPanel(){
  if(document.getElementById("battleItemPanel")){ closeBattleItemPanel(); return; }
  if(!STATE||!ITEM_DEFS) return;
  var hasAny=BATTLE_USABLE_ITEMS.some(function(k){ return (STATE.items[k]||0)>0; });
  if(!hasAny){ showToast("Keine Items dabei!"); return; }
  var panel=document.createElement("div"); panel.id="battleItemPanel"; panel.className="battle-item-panel";
  panel.innerHTML="<div class='bip-header'><span>🎒 Item wählen</span><button class='bip-close' onclick='closeBattleItemPanel()'>✕</button></div><div class='bip-grid' id='bipGrid'></div>";
  var actions=document.getElementById("battleActions"), mb=document.getElementById("moveButtons");
  if(actions&&mb) actions.insertBefore(panel,mb);
  var grid=document.getElementById("bipGrid");
  BATTLE_USABLE_ITEMS.forEach(function(key){
    var count=STATE.items[key]||0; if(count<=0) return;
    var def=ITEM_DEFS[key]; if(!def) return;
    var player=getActivePkmn(), usable=true;
    if((key==="potion"||key==="superpotion"||key==="hyperpotion"||key==="maxpotion")&&player&&player.currentHP>=player.maxHP) usable=false;
    if(key==="antidote"    &&player&&player.status!=="poison")    usable=false;
    if(key==="awakening"   &&player&&player.status!=="sleep")     usable=false;
    if(key==="paralysheal" &&player&&player.status!=="paralysis") usable=false;
    if(key==="fullheal"    &&player&&!player.status)              usable=false;
    if(key==="revive"      &&!STATE.party.find(function(p){ return p.currentHP<=0; })) usable=false;
    var btn=document.createElement("button");
    btn.className="bip-item"+(usable?"":" bip-item-disabled"); btn.disabled=!usable; btn.title=def.name+": "+def.desc;
    btn.innerHTML="<img src='"+(def.img||"")+"' class='bip-sprite' onerror='this.style.display=\"none\"'><span class='bip-name'>"+def.name+"</span><span class='bip-count'>x"+count+"</span>";
    if(usable) btn.onclick=(function(k){ return function(){ useBattleItem(k); }; })(key);
    grid.appendChild(btn);
  });
}
function closeBattleItemPanel(){ var el=document.getElementById("battleItemPanel"); if(el&&el.parentNode) el.parentNode.removeChild(el); }

// ══════════════════════════════════════════════════════════════
//  onBattleEnd
// ══════════════════════════════════════════════════════════════
function onBattleEnd(result) {
  clearInterval(BATTLE_INTERVAL); _animRunning=false; hideTrainerPortrait();
  if(result==="win"&&BATTLE.trainerData&&BATTLE.trainerData.returnToCity){
    setTimeout(function(){
      var xp=BATTLE.xpGained||0, msgs=[];
      STATE.party.forEach(function(p){ if(p.currentHP>0) applyXP(p,xp).forEach(function(m){ msgs.push(m); }); });
      msgs.forEach(function(m){ appendBattleLog(m); });
      if(xp>0) showXPPopup(xp);
      if(BATTLE.moneyGained>0){ STATE.money+=BATTLE.moneyGained; appendBattleLog("+"+BATTLE.moneyGained+" ₽!"); updateHUD(); }
      markTrainerDefeated(BATTLE.trainerData.rivalKey||(BATTLE.trainerData.cityZoneId+"_rival"),0);
      saveGame();
      setTimeout(function(){
        hideBattleUI(); renderEnemySprite(null,false); _waitingForInput=true; _inCity=true;
        var zone=getZone(BATTLE.trainerData.cityZoneId); if(zone) renderCityView(zone);
      },1500);
    },500);
    return;
  }
  if(result==="win"){
    setTimeout(function(){
      var xp=BATTLE.xpGained||0, msgs=[], eid=BATTLE.enemy?BATTLE.enemy.dexId:null;
      STATE.party.forEach(function(p){ if(p.currentHP>0) applyXP(p,xp,eid).forEach(function(m){ msgs.push(m); }); });
      msgs.forEach(function(m){ appendBattleLog(m); });
      if(xp>0) showXPPopup(xp);
      if(BATTLE.moneyGained>0){ STATE.money+=BATTLE.moneyGained; appendBattleLog("+"+BATTLE.moneyGained+" ₽!"); updateHUD(); }
      if(BATTLE.type==="gym"){
        var zone=getZone(STATE.currentZoneId);
        if(zone&&zone.gymLeader){ var gl=zone.gymLeader;
          if(STATE.badgeIds.indexOf(gl.badgeId)<0){ STATE.badges++; STATE.badgeIds.push(gl.badgeId);
            appendBattleLog("🏅 "+gl.winText); showToast("🏅 "+gl.badge+" erhalten!",4000); updateHUD(); } }
      }
      markTrainerDefeated(STATE.currentZoneId,STATE.currentStage); saveGame();
      setTimeout(function(){ hideBattleUI(); renderEnemySprite(null,false); _waitingForInput=false;
        renderPlayerSprites(); advanceStage(); startStageLoop(); },2500);
    },500);
  } else if(result==="catch"||result==="flee"){
    appendBattleLog(result==="flee"?"Du bist geflohen!":"Pokémon gefangen!"); saveGame();
    setTimeout(function(){ hideBattleUI(); renderEnemySprite(null,false); _waitingForInput=false;
      renderPlayerSprites(); advanceStage(); startStageLoop(); },1800);
  } else {
    clearInterval(STAGE_INTERVAL);
    setTimeout(function(){ showBlackout(function(){
      healPartyFully(); STATE.party.forEach(function(p){ p._faintAnnounced=false; });
      var ci=WORLD.findIndex(function(z){ return z.id===STATE.currentZoneId; });
      for(var i=ci;i>=0;i--){ if(WORLD[i].type==="city"||i===0){ STATE.currentZoneId=WORLD[i].id; STATE.currentStage=1; break; } }
      saveGame(); hideBattleUI(); renderEnemySprite(null,false); _waitingForInput=false;
      var zn=getZone(STATE.currentZoneId); if(zn) renderZoneBg(zn);
      renderStageInfo(); renderPlayerSprites(); renderWorldTab();
      showToast("Du bist in "+(zn?zn.name:"einer Stadt")+" aufgewacht! Team geheilt.",4000);
      startStageLoop();
    }); },600);
  }
}
