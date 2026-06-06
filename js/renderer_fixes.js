// ═══════════════════════════════════════════════════════════════
//  renderer_fixes.js — Routing-Fix + Team-Screen Override
//  Wird als LETZTES Script geladen → überschreibt was nötig ist
// ═══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
//  BUG-FIX: homeCity für falsch sortierte Zonen
//
//  Problem: Route22, viridian_gym, route23 etc. stehen im
//  WORLD-Array NACH cinnabar_island → Rückwärtslauf beim KO
//  landet fälschlicherweise in Zinnoberinsel.
//
//  Lösung: homeCity-Feld direkt auf WORLD-Objekte patchen.
//  findRecoveryCity() (engine.js) liest dieses Feld.
// ══════════════════════════════════════════════════════════════
(function patchHomeCities() {
  var map = {
    route22:      "viridian_city",   // Umweg von Vertania → nicht nach Zinnoberinsel
    viridian_gym: "viridian_city",   // Vertania Arena → nach Vertania
    route23:      "viridian_city",   // Siegerstraße-Zugang
    victory_road: "viridian_city",   // Siegerstraße
    elite_four:   "viridian_city",   // Liga → nach Vertania (logisch)
  };
  if(typeof WORLD === "undefined") return;
  WORLD.forEach(function(z) {
    if(map[z.id]) z.homeCity = map[z.id];
  });
  console.log("[routing-fix] homeCity für", Object.keys(map).length, "Zonen gesetzt");
})();

// ══════════════════════════════════════════════════════════════
//  TEAM-SCREEN — Realtime + Up/Down/Lead/Box + Evolutions-Button
// ══════════════════════════════════════════════════════════════
function renderTeamScreen() {
  var container=document.getElementById("teamList"); if(!container||!STATE) return;
  container.innerHTML="";
  var n=STATE.party.length;
  STATE.party.forEach(function(p,idx){
    var pd=PKMN[p.dexId], name=pd?pd.name:"?";
    var hpPct=Math.max(0,Math.round(p.currentHP/p.maxHP*100));
    var xpPct=Math.min(100,Math.round(p.xp/p.xpToNext*100));
    var readyEvo=!!p.readyToEvolve;
    var evoPd=readyEvo?PKMN[p.readyToEvolve]:null;

    var card=document.createElement("div");
    card.className="team-card"+(p.currentHP<=0?" team-fainted":"")+(readyEvo?" team-evo-ready":"");
    card.innerHTML=
      "<img class='team-sprite' src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+p.dexId+".png' alt='"+name+"'>"+
      "<div class='team-info'>"+
        "<div class='team-nameline'><b>"+(p.nick||name)+"</b> <span class='team-lv'>Lv."+p.level+"</span>"+
          (p.status?"<span class='status-badge status-"+p.status+"'>"+statusText(p.status)+"</span>":"")+
          (idx===0?"<span class='team-lead-badge'>★ Lead</span>":"")+
          (readyEvo?"<span class='team-evo-badge'>✨ Entwicklung!</span>":"")+
        "</div>"+
        "<div class='team-types'>"+(pd?pd.types.map(function(t){return "<span class='type-badge' style='background:"+(TYPE_COLORS[t]||"#aaa")+"'>"+t+"</span>";}).join(""):"")+"</div>"+
        "<div class='team-hprow'><div class='team-hpbar'><div class='team-hpfill' style='width:"+hpPct+"%;background:"+hpColor(p.currentHP,p.maxHP)+"'></div></div> <span class='team-hptxt'>"+p.currentHP+"/"+p.maxHP+"</span></div>"+
        "<div class='team-xprow'><div class='team-xpbar'><div class='team-xpfill' style='width:"+xpPct+"%'></div></div> <span class='team-xptxt'>EP "+p.xp+"/"+p.xpToNext+"</span></div>"+
        "<div class='team-moves'>"+p.moves.map(function(m){var mv=MOVES[m];return mv?"<span class='mini-move' style='border-color:"+(TYPE_COLORS[mv.type]||"#888")+"'>"+mv.name+"</span>":"";}).join("")+"</div>"+
        (readyEvo?"<button class='team-evo-btn' onclick='triggerEvolution("+idx+")'>"+
          "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+(p.readyToEvolve||0)+".png' class='team-evo-preview'>"+
          "✨ Zu "+(evoPd?evoPd.name:"?")+" entwickeln!"+
        "</button>":"")+
      "</div>"+
      "<div class='team-actions'>"+
        "<button class='team-act-sm' "+(idx===0?"disabled":"")+" onclick='movePartyUp("+idx+")' title='Nach oben'>↑</button>"+
        "<button class='team-act-sm' "+(idx===n-1?"disabled":"")+" onclick='movePartyDown("+idx+")' title='Nach unten'>↓</button>"+
        "<button class='team-act-sm' "+(idx===0?"disabled":"")+" onclick='setLeadPkmn("+idx+")' title='Als Lead setzen'>★</button>"+
        "<button class='team-act-sm' onclick='sendToBox("+idx+")' title='In Box senden'>📦</button>"+
      "</div>";
    container.appendChild(card);
  });
  var boxSection=document.getElementById("boxPreview");
  if(boxSection){
    boxSection.innerHTML=STATE.box.length===0
      ?"<p style='color:#888;text-align:center;padding:12px'>Box ist leer</p>"
      :STATE.box.map(function(p,i){
        var pd=PKMN[p.dexId];
        return "<div class='box-mini' onclick='recallFromBox("+i+")'>"+
          "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+p.dexId+".png'>"+
          "<div>"+(pd?pd.name:"?")+" Lv."+p.level+(p.readyToEvolve?" ✨":"")+"</div></div>";
      }).join("");
  }
}

// ══════════════════════════════════════════════════════════════
//  BUG-FIX: onBattleEnd — lose-Branch nutzt findRecoveryCity()
//
//  Ersetzt den kaputten Rückwärtslauf im WORLD-Array durch
//  die smarte findRecoveryCity()-Funktion aus engine.js.
// ══════════════════════════════════════════════════════════════
function onBattleEnd(result) {
  clearInterval(BATTLE_INTERVAL); _animRunning=false; hideTrainerPortrait();

  // ── Sieg: Rückkehr zur Stadt (Gary/Rival-Kämpfe) ──────────
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

  // ── Sieg: Rückkehr zu Gebäude ─────────────────────────────
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

  // ── Sieg: Waypoint-Rival ──────────────────────────────────
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

  // ── Normaler Sieg ─────────────────────────────────────────
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

  // ── Gefangen / Geflohen ───────────────────────────────────
  }else if(result==="catch"||result==="flee"){
    appendBattleLog(result==="flee"?"Du bist geflohen!":"Pokémon gefangen!");saveGame();
    setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=false;
      renderPlayerSprites();advanceStage();startStageLoop();},1800);

  // ── NIEDERLAGE — findRecoveryCity statt kaputtem Array-Walk ──
  }else{
    clearInterval(STAGE_INTERVAL);
    setTimeout(function(){showBlackout(function(){
      healPartyFully();
      STATE.party.forEach(function(p){p._faintAnnounced=false;});

      // ✅ FIX: findRecoveryCity respektiert homeCity-Feld
      //    → route22 KO → viridian_city statt cinnabar_island
      var recoveryCity = findRecoveryCity(STATE.currentZoneId);
      STATE.currentZoneId = recoveryCity;
      STATE.currentStage  = 1;

      saveGame();
      hideBattleUI();
      renderEnemySprite(null,false);
      _waitingForInput=false;
      var zn=getZone(STATE.currentZoneId); if(zn)renderZoneBg(zn);
      renderStageInfo();renderPlayerSprites();renderWorldTab();
      showToast("Du bist in "+(zn?zn.name:"einer Stadt")+" aufgewacht! Team geheilt.",4000);
      startStageLoop();
    });},600);
  }
}

// ── Trainer-Portrait: rechts oben (Gegner-Seite) ─────────────
function renderTrainerPortrait(name, url2) {
  hideTrainerPortrait();
  var scene=document.getElementById("sceneView"); if(!scene) return;
  var div=document.createElement("div");
  div.id="trainerPortrait";
  div.style.cssText="position:absolute;right:8px;top:8px;z-index:20;text-align:center;animation:portrait-in .3s ease-out";
  div.innerHTML=
    "<img src='"+url2+"' style='width:52px;height:52px;image-rendering:pixelated;display:block;margin:0 auto;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.6)' onerror='this.parentNode.remove()'>"+
    "<div style='font-size:9px;color:#fff;background:rgba(0,0,0,.65);border-radius:3px;padding:1px 4px;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px'>"+name+"</div>";
  scene.appendChild(div);
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
  var tv=document.getElementById("viewTeam");
  if(tv&&tv.style.display!=="none"&&typeof renderTeamScreen==="function") renderTeamScreen();
}
