// ═══════════════════════════════════════════════════════════════
//  patch.js — diverse Bugfixes & System-Patches
// ═══════════════════════════════════════════════════════════════

// ── Rad-Coupon zu ITEM_DEFS ───────────────────────────────────
(function patchItemDefs(){
  if(typeof ITEM_DEFS==="undefined")return;
  if(!ITEM_DEFS.rad_coupon)
    ITEM_DEFS.rad_coupon={name:"Rad-Coupon",desc:"Gutschein für ein kostenloses Fahrrad in Azuria City.",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/bicycle.png",isKey:true};
})();

// ══════════════════════════════════════════════════════════════
//  BIDIREKTIONALES ROUTEN-SYSTEM
//
//  Jede Route hat:
//    terminus      → Ziel beim normalen Vorwärtslaufen
//    terminus_back → Ziel beim Zurücklaufen
//
//  _backTravel = true: nächste Terminus-Auflösung nutzt terminus_back
//  Wird automatisch zurückgesetzt wenn eine Stadt betreten wird.
// ══════════════════════════════════════════════════════════════
var _backTravel = false;

// Rückreise-Exit starten (aus Stadthub)
window.travelBack = function(exitId){
  _backTravel = true;
  var zone = getZone(STATE.currentZoneId);
  var exit = null;
  if(zone && zone.exits) exit = zone.exits.find(function(e){ return e.id===exitId; });
  if(exit && exit.condition && !checkExitCondition(exit.condition)){
    showToast(exit.lockedMsg||"Zugang gesperrt!",4000);
    _backTravel = false;
    return;
  }
  navigateTo(exitId);
};

// handleTerminus-Patch: nutzt terminus_back wenn _backTravel
(function patchHandleTerminus(){
  if(typeof handleTerminus!=="function"){setTimeout(patchHandleTerminus,300);return;}
  var _orig=handleTerminus;
  handleTerminus=function(zone){
    if(!zone)return;
    // Rückreise-Modus: terminus_back nutzen falls vorhanden
    if(_backTravel && zone.terminus_back){
      _backTravel=false; // Reset nach erstem Schritt (neue Route setzt neu)
      var exits=zone.terminus_back.exits;
      if(!exits||exits.length===0){showToast("Kein Weg zurück.");return;}
      if(exits.length===1){
        var target=getZone(exits[0].id);
        if(target&&target.type==="city"){_backTravel=false;goToCity(exits[0].id);}
        else{navigateTo(exits[0].id);}
      }else{
        clearInterval(STAGE_INTERVAL);_waitingForInput=true;
        renderRouteChoice(zone,exits);
      }
      return;
    }
    _orig(zone);
  };
})();

// goToCity-Patch: _backTravel beim Stadteintritt zurücksetzen
(function patchGoToCity(){
  if(typeof goToCity!=="function"){setTimeout(patchGoToCity,300);return;}
  var _orig=goToCity;
  goToCity=function(cityId){
    _backTravel=false; // In Stadt angekommen → Richtung zurücksetzen
    _orig(cityId);
  };
})();

// ══════════════════════════════════════════════════════════════
//  terminus_back zu allen Routen hinzufügen
//  (in world_patch.js wird das auf die Zonen-Objekte angewandt)
// ══════════════════════════════════════════════════════════════
(function addTerminiBack(){
  var map={
    // Route → wohin beim Zurücklaufen
    "route1":        { exits:[{id:"alabastia"}] },
    "route2":        { exits:[{id:"viridian_city"}] },
    "viridian_forest":{ exits:[{id:"route2"}] },
    "route3_west":   { exits:[{id:"viridian_forest"}] },
    "route3_east":   { exits:[{id:"pewter_city"}] },
    "route4":        { exits:[{id:"mt_moon"}] },
    "mt_moon":       { exits:[{id:"route3_east"}] },
    "route5_6":      { exits:[{id:"cerulean_city"}] },
    "route9":        { exits:[{id:"cerulean_city"}] },
    "rock_tunnel":   { exits:[{id:"route9"}] },
    "route10_south": { exits:[{id:"rock_tunnel"}] },
    "route11_12":    { exits:[{id:"vermilion_city"}] },
    "route7_8":      { exits:[{id:"lavender_town"}] },
    "route16_18":    { exits:[{id:"celadon_city"}] },
    "route15":       { exits:[{id:"fuchsia_city"}] },
    "route19_20":    { exits:[{id:"fuchsia_city"}] },
    "route21_return":{ exits:[{id:"cinnabar_island"}] },
    "route22":       { exits:[{id:"viridian_city"}] },
    "route23":       { exits:[{id:"viridian_city"}] },
    "victory_road":  { exits:[{id:"route23"}] },
    "route24_25":    { exits:[{id:"cerulean_city"}] },
    "cerulean_cave": { exits:[{id:"cerulean_city"}] },
  };
  if(typeof WORLD==="undefined")return;
  Object.keys(map).forEach(function(id){
    var zone=WORLD.find(function(z){return z.id===id;});
    if(zone&&!zone.terminus_back)zone.terminus_back=map[id];
  });
})();

// ══════════════════════════════════════════════════════════════
//  Rückreise-Exits zu Städten hinzufügen
//  Format: exits mit _back:true → wird als travelBack() aufgerufen
// ══════════════════════════════════════════════════════════════
(function addBackExits(){
  if(typeof WORLD==="undefined")return;
  var backExits={
    // Stadt-ID → [back-exits]
    "pewter_city":[
      {id:"route3_west", label:"← Route 3 / Vertania-Wald", desc:"Zurück Richtung Vertania City", direction:"west", _back:true}
    ],
    "cerulean_city":[
      {id:"route4", label:"← Route 4 / Rotes Gebirge", desc:"Zurück Richtung Marmoria City", direction:"north", _back:true}
    ],
    "vermilion_city":[
      {id:"route5_6", label:"← Route 5-6 / Azuria City", desc:"Zurück Richtung Azuria City", direction:"north", _back:true}
    ],
    "lavender_town":[
      {id:"route11_12", label:"← Route 11-12 / Zinnia City", desc:"Zurück Richtung Zinnia City", direction:"south", _back:true}
    ],
    "celadon_city":[
      {id:"route7_8", label:"← Route 7-8 / Lavendeldorf", desc:"Zurück Richtung Lavendeldorf", direction:"east", _back:true}
    ],
    "fuchsia_city":[
      {id:"route16_18", label:"← Fahrradroute / Prismania City", desc:"Zurück Richtung Prismania City", direction:"east", _back:true}
    ],
    "saffron_city":[
      {id:"route15", label:"← Route 15 / Pokérosia City", desc:"Zurück Richtung Pokérosia City", direction:"west", _back:true}
    ],
    "cinnabar_island":[
      {id:"route19_20", label:"← Route 19-20 / Meer", desc:"Zurück Richtung Pokérosia / Saffronia", direction:"north", _back:true}
    ],
  };
  Object.keys(backExits).forEach(function(cityId){
    var city=WORLD.find(function(z){return z.id===cityId;});
    if(!city)return;
    if(!city.exits)city.exits=[];
    backExits[cityId].forEach(function(backExit){
      if(!city.exits.find(function(e){return e.id===backExit.id;}))
        city.exits.push(backExit);
    });
  });
})();

// ══════════════════════════════════════════════════════════════
//  renderCityHub-Patch: _back:true Exits als travelBack() rendern
// ══════════════════════════════════════════════════════════════
(function patchRenderCityHubBack(){
  if(typeof renderCityHub!=="function"){setTimeout(patchRenderCityHubBack,300);return;}
  var _orig=renderCityHub;
  renderCityHub=function(zone){
    _orig(zone);
    if(!zone||!zone.exits)return;
    // Rückreise-Exits nachträglich als "travelBack()" verlinken
    // (renderer_patch.js hat sie schon gerendert, aber mit falschem onclick)
    // Neues Rendering: füge separaten Rückreise-Block ein
    var backExits=zone.exits.filter(function(e){return e._back;});
    if(!backExits.length)return;
    var container=document.getElementById("viewWorld");
    if(!container)return;
    var cityView=container.querySelector(".city-view");
    if(!cityView)return;
    var section=document.createElement("div");
    section.innerHTML="<div class='hub-section-title'>↩ Zurückgehen</div><div class='hub-exits hub-exits-back'>";
    backExits.forEach(function(exit){
      var card=document.createElement("div");
      card.className="hub-exit-card hub-exit-back";
      card.innerHTML=
        "<div class='hub-exit-label'>"+exit.label+"</div>"+
        (exit.desc?"<div class='hub-exit-desc'>"+exit.desc+"</div>":"");
      card.onclick=(function(id){return function(){travelBack(id);};})(exit.id);
      section.querySelector(".hub-exits-back").appendChild(card);
    });
    section.style.cssText="margin-top:8px;border-top:1px solid rgba(255,255,255,.07);padding-top:8px";
    cityView.appendChild(section);
  };
})();

// ══════════════════════════════════════════════════════════════
//  fastTravelTo — NUR mit VM02 Fliegen erlaubt
// ══════════════════════════════════════════════════════════════
function fastTravelTo(zoneId){
  if(!STATE)return;
  if(BATTLE&&!BATTLE.over){showToast("Im Kampf nicht möglich!");return;}
  var hasFly=(STATE.items&&(STATE.items["hm_fly"]||0)>0);
  if(!hasFly){showToast("✈️ Schnellreise erfordert VM02 Fliegen!",3500);return;}
  if(!isZoneVisited(zoneId)){showToast("Diese Stadt noch nicht besucht!");return;}
  clearInterval(STAGE_INTERVAL);clearInterval(BATTLE_INTERVAL);
  _waitingForInput=false;_inCity=false;_animRunning=false;_backTravel=false;
  STATE.currentBuilding=null;hideBattleUI();renderEnemySprite(null,false);
  STATE.currentZoneId=zoneId;STATE.currentStage=1;
  var zone=getZone(zoneId);if(zone)renderZoneBg(zone);
  renderStageInfo();renderPlayerSprites();
  showToast("✈️ Fliege nach "+(zone?zone.name:zoneId)+"!",3000);
  saveGame();
  if(zone&&zone.type==="city"){
    _waitingForInput=true;_inCity=true;
    if(!isTrainerDefeated(zoneId,0)){markTrainerDefeated(zoneId,0);healPartyFully();renderPlayerSprites();updateHUD();}
    renderCityHub(zone);STAGE_INTERVAL=setInterval(processStage,STAGE_TICK_MS);
  }else{renderWorldTab();startStageLoop();}
}

// ══════════════════════════════════════════════════════════════
//  checkExitCondition
// ══════════════════════════════════════════════════════════════
function checkExitCondition(cond){
  if(!cond||!STATE)return true;
  if(cond.minBadges&&STATE.badges<cond.minBadges)return false;
  if(cond.hasBadge&&(!STATE.badgeIds||STATE.badgeIds.indexOf(cond.hasBadge)<0))return false;
  if(cond.hasItem&&(!STATE.items||!(STATE.items[cond.hasItem]>0)))return false;
  if(cond.eventFlag&&!isEventFlagSet(cond.eventFlag))return false;
  return true;
}

// ══════════════════════════════════════════════════════════════
//  renderMapScreen
// ══════════════════════════════════════════════════════════════
function renderMapScreen(){
  var container=document.getElementById("mapList");if(!container||!STATE)return;
  container.innerHTML="";
  var br=document.getElementById("badgeRow");
  if(br){
    var badgeIds=["stone","cascade","thunder","rainbow","soul","marsh","volcano","earth"];
    br.innerHTML=badgeIds.map(function(b,i){
      var earned=STATE.badgeIds&&STATE.badgeIds.indexOf(b)>=0;
      return "<span class='badge-icon"+(earned?" badge-earned":"")+"'>🏅</span>";
    }).join("");
  }
  var curZone=getZone(STATE.currentZoneId);
  if(curZone){
    var curDiv=document.createElement("div");curDiv.className="map-current-loc";
    var zIcon={route:"🌿",dungeon:"🕳️",city:"🏙️",gym:"⚔️",sea:"🌊"}[curZone.type]||"📍";
    curDiv.innerHTML="<b>📍 Hier:</b> "+zIcon+" <b>"+curZone.name+"</b>"+
      (curZone.stageCount?" — Etappe "+STATE.currentStage+"/"+curZone.stageCount:"");
    container.appendChild(curDiv);
  }
  var hasFly=STATE.items&&(STATE.items["hm_fly"]||0)>0;
  var flySection=document.createElement("div");flySection.className="map-section-title";flySection.style.marginTop="14px";
  if(hasFly){
    flySection.innerHTML="✈️ Schnellreise (VM02 Fliegen)";container.appendChild(flySection);
    var visited=WORLD.filter(function(z){return z.type==="city"&&isZoneVisited(z.id)&&z.id!==STATE.currentZoneId;});
    if(visited.length){
      var grid=document.createElement("div");grid.className="city-travel-grid";
      visited.forEach(function(zone){
        var btn=document.createElement("button");btn.className="city-travel-btn";
        btn.innerHTML="🏙️ "+zone.name;
        btn.onclick=(function(zid){return function(){fastTravelTo(zid);};})(zone.id);
        grid.appendChild(btn);
      });
      container.appendChild(grid);
    }
  }else{
    flySection.innerHTML="✈️ Schnellreise";container.appendChild(flySection);
    var hint=document.createElement("div");
    hint.style.cssText="font-size:12px;color:#556070;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px 12px;margin-bottom:10px;line-height:1.6";
    hint.innerHTML="🔒 Kein VM02 Fliegen. Zu finden auf Route 16 westlich von Prismania City.";
    container.appendChild(hint);
  }
  var ph=document.createElement("div");ph.className="map-section-title";ph.style.marginTop="14px";
  ph.textContent="🗺️ Kanto-Fortschritt";container.appendChild(ph);
  WORLD.forEach(function(zone){
    if(zone.type==="building")return;
    var isCurrent=(zone.id===STATE.currentZoneId),isVisited=isZoneVisited(zone.id);
    var row=document.createElement("div");
    var cls="map-zone map-compact"+(isCurrent?" map-current":isVisited?" map-unlocked":" map-locked");
    row.className=cls;
    var zIcon={route:"🌿",dungeon:"🕳️",city:"🏙️",gym:"⚔️",sea:"🌊"}[zone.type]||"📍";
    var badgeHtml=zone.gymLeader&&isVisited?"<span class='map-badge'>"+(STATE.badgeIds&&STATE.badgeIds.indexOf(zone.gymLeader.badgeId)>=0?"🏅":"⬜")+"</span>":"";
    row.innerHTML=zIcon+" "+zone.name+(isCurrent?" <span class='map-here'>← hier</span>":"")+(!isVisited?"<span style='margin-left:auto;color:#444;font-size:11px'>🔒</span>":"")+badgeHtml;
    container.appendChild(row);
  });
}

// ══════════════════════════════════════════════════════════════
//  renderMoveButtons — PATCH: entfernt "Stk"-Suffix
// ══════════════════════════════════════════════════════════════
(function patchRenderMoveButtons(){
  window.addEventListener("load",function(){
    renderMoveButtons=function(){
      var container=document.getElementById("moveButtons");if(!container)return;
      var player=getActivePkmn();if(!player){container.innerHTML="";return;}
      container.innerHTML="";
      if(!player.pp)player.pp=initPP(player.moves);
      var allEmpty=!hasPP(player);
      player.moves.forEach(function(mid){
        var move=MOVES[mid];if(!move)return;
        var curPP=Math.max(0,parseInt(player.pp[mid],10)||0);
        var maxPP=Math.max(1,parseInt(ppMax(mid),10)||10);
        var noPP=curPP<=0&&!allEmpty;
        var col=(typeof TYPE_COLORS!=="undefined"&&TYPE_COLORS[move.type])||"#888";
        var tName=(typeof typeName==="function")?typeName(move.type):move.type;
        var btn=document.createElement("button");
        btn.className="move-btn"+(noPP?" move-btn-empty":"");
        btn.disabled=noPP;
        btn.style.borderColor=noPP?"#444":col;
        btn.innerHTML=
          "<span class='move-name'>"+move.name+"</span>"+
          "<span class='move-type' style='background:"+(noPP?"#333":col)+"'>"+tName+"</span>"+
          "<span class='move-pp "+(curPP===0?"move-pp-empty":curPP<=Math.floor(maxPP/4)?"move-pp-low":"")+"'>"+curPP+"/"+maxPP+"</span>";
        if(!noPP)(function(m){btn.onclick=function(){onMoveClick(m);};})(mid);
        container.appendChild(btn);
      });
      if(allEmpty){
        var sb=document.createElement("button");sb.className="move-btn move-btn-struggle";
        sb.innerHTML="<span class='move-name'>Kräftemessen</span><span class='move-type' style='background:#888'>Normal</span>";
        sb.onclick=function(){onMoveClick("struggle");};
        container.appendChild(sb);
      }
    };
  });
})();

// CSS für Rückreise-Exits
(function injectBackCss(){
  var s=document.createElement("style");
  s.textContent=`
    .hub-exit-back {
      border-color: rgba(99,102,241,.3) !important;
      background: rgba(99,102,241,.06) !important;
    }
    .hub-exit-back:hover {
      background: rgba(99,102,241,.15) !important;
      border-color: rgba(99,102,241,.5) !important;
    }
    .hub-exit-back .hub-exit-label::before { content: '↩ '; }
  `;
  document.head.appendChild(s);
})();
