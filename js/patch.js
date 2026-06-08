// ═══════════════════════════════════════════════════════════════
//  patch.js — Bugfixes & System-Patches
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
//  _backTravel bleibt TRUE bis eine STADT betreten wird.
//  Es wird NICHT zwischen Routen zurückgesetzt!
//  Mehrstufige Rückreisen (Route3→Wald→Route2→Stadt) funktionieren so.
// ══════════════════════════════════════════════════════════════
var _backTravel = false;

window.travelBack = function(exitId){
  var zone=getZone(STATE.currentZoneId);
  var exit=zone&&zone.exits?zone.exits.find(function(e){return e.id===exitId;}):null;
  if(exit&&exit.condition&&!checkExitCondition(exit.condition)){
    showToast(exit.lockedMsg||"Zugang gesperrt!",4000);
    return;
  }
  _backTravel=true;
  navigateTo(exitId);
};

// handleTerminus-Patch
// _backTravel wird hier NICHT zurückgesetzt (bleibt bis zur Stadt!)
(function patchHandleTerminus(){
  if(typeof handleTerminus!=="function"){setTimeout(patchHandleTerminus,300);return;}
  var _orig=handleTerminus;
  handleTerminus=function(zone){
    if(!zone)return;
    if(_backTravel&&zone.terminus_back){
      var exits=zone.terminus_back.exits;
      if(!exits||exits.length===0){
        showToast("Kein Weg zurück — Ende der Route.");
        _backTravel=false;_orig(zone);return;
      }
      if(exits.length===1){
        var target=getZone(exits[0].id);
        if(target&&target.type==="city"){
          // Stadt erreicht → goToCity setzt _backTravel=false
          goToCity(exits[0].id);
        }else{
          // Weitere Route → _backTravel bleibt true
          navigateTo(exits[0].id);
        }
      }else{
        clearInterval(STAGE_INTERVAL);_waitingForInput=true;
        renderRouteChoice(zone,exits);
      }
      return;
    }
    _orig(zone);
  };
})();

// goToCity: setzt _backTravel=false wenn Stadt betreten
(function patchGoToCity(){
  if(typeof goToCity!=="function"){setTimeout(patchGoToCity,300);return;}
  var _orig=goToCity;
  goToCity=function(cityId){
    _backTravel=false;
    _orig(cityId);
  };
})();

// ══════════════════════════════════════════════════════════════
//  terminus_back — Rückwärts-Ziele aller Routen
// ══════════════════════════════════════════════════════════════
(function addTerminiBack(){
  if(typeof WORLD==="undefined")return;
  var map={
    "route1":         {exits:[{id:"alabastia"}]},
    "route2":         {exits:[{id:"viridian_city"}]},
    "viridian_forest":{exits:[{id:"route2"}]},
    "route3_west":    {exits:[{id:"viridian_forest"}]},
    "route3_east":    {exits:[{id:"pewter_city"}]},
    "route4":         {exits:[{id:"mt_moon"}]},
    "mt_moon":        {exits:[{id:"route3_east"}]},
    "route5_6":       {exits:[{id:"cerulean_city"}]},
    "route9":         {exits:[{id:"cerulean_city"}]},
    "rock_tunnel":    {exits:[{id:"route9"}]},
    "route10_south":  {exits:[{id:"rock_tunnel"}]},
    "route11_12":     {exits:[{id:"vermilion_city"}]},
    "route7_8":       {exits:[{id:"lavender_town"}]},
    "route16_18":     {exits:[{id:"celadon_city"}]},
    "route15":        {exits:[{id:"fuchsia_city"}]},
    "route19_20":     {exits:[{id:"fuchsia_city"}]},
    "route21_return": {exits:[{id:"cinnabar_island"}]},
    "route22":        {exits:[{id:"viridian_city"}]},
    "route23":        {exits:[{id:"viridian_city"}]},
    "victory_road":   {exits:[{id:"route23"}]},
    "route24_25":     {exits:[{id:"cerulean_city"}]},
    "cerulean_cave":  {exits:[{id:"cerulean_city"}]},
  };
  Object.keys(map).forEach(function(id){
    var z=WORLD.find(function(z){return z.id===id;});
    if(z&&!z.terminus_back)z.terminus_back=map[id];
  });
})();

// ══════════════════════════════════════════════════════════════
//  Rückreise-Exits zu Städten
//  FIX: viridian_city jetzt enthalten!
// ══════════════════════════════════════════════════════════════
(function addBackExits(){
  if(typeof WORLD==="undefined")return;
  var backExits={
    // ── Vertania City → Route 1 → Alabastia ────────────────
    "viridian_city":[
      {id:"route1",label:"← Route 1 Süd / Alabastia",desc:"Zurück nach Alabastia",direction:"south",_back:true}
    ],
    // ── Marmoria City → Route 3 West → Wald → Vertania ─────
    "pewter_city":[
      {id:"route3_west",label:"← Route 3 / Vertania-Wald",desc:"Zurück Richtung Vertania City",direction:"west",_back:true}
    ],
    // ── Azuria City → Route 4 → Rotes Gebirge → Marmoria ───
    "cerulean_city":[
      {id:"route4",label:"← Route 4 / Rotes Gebirge",desc:"Zurück Richtung Marmoria City",direction:"north",_back:true}
    ],
    // ── Zinnia City → Route 5-6 → Azuria ───────────────────
    "vermilion_city":[
      {id:"route5_6",label:"← Route 5-6 / Azuria City",desc:"Zurück Richtung Azuria City",direction:"north",_back:true}
    ],
    // ── Lavendeldorf → Route 11-12 → Zinnia ────────────────
    "lavender_town":[
      {id:"route11_12",label:"← Route 11-12 / Zinnia City",desc:"Zurück Richtung Zinnia City",direction:"south",_back:true}
    ],
    // ── Prismania City → Route 7-8 → Lavendeldorf ──────────
    "celadon_city":[
      {id:"route7_8",label:"← Route 7-8 / Lavendeldorf",desc:"Zurück Richtung Lavendeldorf",direction:"east",_back:true}
    ],
    // ── Pokérosia City → Fahrradroute → Prismania ──────────
    "fuchsia_city":[
      {id:"route16_18",label:"← Fahrradroute / Prismania City",desc:"Zurück Richtung Prismania City",direction:"east",_back:true}
    ],
    // ── Saffronia City → Route 15 → Pokérosia ──────────────
    "saffron_city":[
      {id:"route15",label:"← Route 15 / Pokérosia City",desc:"Zurück Richtung Pokérosia City",direction:"west",_back:true}
    ],
    // ── Zinnoberinsel → Meer → Saffronia / Pokérosia ───────
    "cinnabar_island":[
      {id:"route19_20",label:"← Route 19-20 / Meer",desc:"Zurück Richtung Pokérosia / Saffronia",direction:"north",_back:true}
    ],
  };
  Object.keys(backExits).forEach(function(cityId){
    var city=WORLD.find(function(z){return z.id===cityId;});
    if(!city)return;
    if(!city.exits)city.exits=[];
    backExits[cityId].forEach(function(be){
      if(!city.exits.find(function(e){return e.id===be.id;}))
        city.exits.push(be);
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
    var backExits=zone.exits.filter(function(e){return e._back;});
    if(!backExits.length)return;
    var container=document.getElementById("viewWorld");if(!container)return;
    var cityView=container.querySelector(".city-view");if(!cityView)return;
    var wrap=document.createElement("div");
    wrap.style.cssText="margin-top:8px;border-top:1px solid rgba(255,255,255,.07);padding-top:8px";
    var title=document.createElement("div");title.className="hub-section-title";title.textContent="↩ Zurückgehen";
    wrap.appendChild(title);
    var grid=document.createElement("div");grid.className="hub-exits hub-exits-back";
    backExits.forEach(function(exit){
      var card=document.createElement("div");card.className="hub-exit-card hub-exit-back";
      card.innerHTML="<div class='hub-exit-label'>"+exit.label+"</div>"+
        (exit.desc?"<div class='hub-exit-desc'>"+exit.desc+"</div>":"");
      card.onclick=(function(id){return function(){travelBack(id);};})(exit.id);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    cityView.appendChild(wrap);
  };
})();

// ══════════════════════════════════════════════════════════════
//  fastTravelTo — NUR mit VM02 Fliegen
// ══════════════════════════════════════════════════════════════
function fastTravelTo(zoneId){
  if(!STATE)return;
  if(BATTLE&&!BATTLE.over){showToast("Im Kampf nicht möglich!");return;}
  if(!(STATE.items&&(STATE.items["hm_fly"]||0)>0)){
    showToast("✈️ Schnellreise erfordert VM02 Fliegen!",3500);return;
  }
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
//  renderMapScreen — sequential zone discovery
// ══════════════════════════════════════════════════════════════
function renderMapScreen(){
  var container=document.getElementById("mapList");if(!container||!STATE)return;
  container.innerHTML="";
  // Orden
  var br=document.getElementById("badgeRow");
  if(br){
    var bids=["stone","cascade","thunder","rainbow","soul","marsh","volcano","earth"];
    br.innerHTML=bids.map(function(b){
      return "<span class='badge-icon"+(STATE.badgeIds&&STATE.badgeIds.indexOf(b)>=0?" badge-earned":"")+"'>🏅</span>";
    }).join("");
  }
  // Aktueller Standort
  var cur=getZone(STATE.currentZoneId);
  if(cur){
    var d=document.createElement("div");d.className="map-current-loc";
    var zi={route:"🌿",dungeon:"🕳️",city:"🏙️",gym:"⚔️",sea:"🌊"}[cur.type]||"📍";
    d.innerHTML="<b>📍 Hier:</b> "+zi+" <b>"+cur.name+"</b>"+(cur.stageCount?" — Etappe "+STATE.currentStage+"/"+cur.stageCount:"");
    container.appendChild(d);
  }
  // Schnellreise
  var hasFly=STATE.items&&(STATE.items["hm_fly"]||0)>0;
  var fs=document.createElement("div");fs.className="map-section-title";fs.style.marginTop="14px";
  if(hasFly){
    fs.textContent="✈️ Schnellreise (VM02 Fliegen)";container.appendChild(fs);
    var cities=WORLD.filter(function(z){return z.type==="city"&&isZoneVisited(z.id)&&z.id!==STATE.currentZoneId;});
    if(cities.length){
      var g=document.createElement("div");g.className="city-travel-grid";
      cities.forEach(function(zone){
        var btn=document.createElement("button");btn.className="city-travel-btn";
        btn.textContent="🏙️ "+zone.name;
        btn.onclick=(function(zid){return function(){fastTravelTo(zid);};})(zone.id);
        g.appendChild(btn);
      });
      container.appendChild(g);
    }else{
      var nc=document.createElement("p");nc.className="map-no-travel";
      nc.textContent="Noch keine weiteren Städte freigeschaltet.";container.appendChild(nc);
    }
  }else{
    fs.textContent="✈️ Schnellreise";container.appendChild(fs);
    var hint=document.createElement("div");
    hint.style.cssText="font-size:12px;color:#556070;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px 12px;margin-bottom:10px;line-height:1.6";
    hint.innerHTML="🔒 Kein VM02 Fliegen.<br>Zu finden auf <b>Route 16</b> westlich von Prismania City.";
    container.appendChild(hint);
  }
  // Kanto-Fortschritt — nur besuchte Zonen sichtbar
  var ph=document.createElement("div");ph.className="map-section-title";ph.style.marginTop="14px";
  ph.textContent="🗺️ Kanto-Fortschritt";container.appendChild(ph);
  var visited=0,total=0;
  WORLD.forEach(function(zone){
    if(zone.type==="building")return;
    total++;
    if(isZoneVisited(zone.id))visited++;
    var isCurrent=(zone.id===STATE.currentZoneId);
    var isVis=isZoneVisited(zone.id);
    var row=document.createElement("div");
    row.className="map-zone map-compact"+(isCurrent?" map-current":isVis?" map-unlocked":" map-locked");
    var zi={route:"🌿",dungeon:"🕳️",city:"🏙️",gym:"⚔️",sea:"🌊"}[zone.type]||"📍";
    var bh=zone.gymLeader&&isVis?"<span class='map-badge'>"+(STATE.badgeIds&&STATE.badgeIds.indexOf(zone.gymLeader.badgeId)>=0?"🏅":"⬜")+"</span>":"";
    row.innerHTML=zi+" "+zone.name+(isCurrent?" <span class='map-here'>← hier</span>":"")+(!isVis?"<span style='margin-left:auto;color:#444;font-size:11px'>🔒</span>":"")+bh;
    container.appendChild(row);
  });
  // Fortschrittsanzeige
  var prog=document.createElement("div");
  prog.style.cssText="font-size:11px;color:#556070;text-align:center;margin-top:10px;padding:6px;border-top:1px solid rgba(255,255,255,.06)";
  prog.textContent="Erkundet: "+visited+" / "+total+" Gebiete";
  container.appendChild(prog);
}

// ══════════════════════════════════════════════════════════════
//  renderMoveButtons — kein "Stk"-Suffix, dt. Typ-Namen
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

// CSS
(function(){
  var s=document.createElement("style");
  s.textContent=`
    .hub-exit-back{border-color:rgba(99,102,241,.3)!important;background:rgba(99,102,241,.06)!important;}
    .hub-exit-back:hover{background:rgba(99,102,241,.15)!important;border-color:rgba(99,102,241,.5)!important;}
    .hub-exit-back .hub-exit-label::before{content:'↩ ';}
  `;
  document.head.appendChild(s);
})();
