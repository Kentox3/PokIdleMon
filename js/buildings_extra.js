// ═══════════════════════════════════════════════════════════════
//  buildings_extra.js — Neue Features + Waypoint-Handler
//  FIX: BATTLE.autoFight → _autoFightEnabled (persistente Präferenz)
// ═══════════════════════════════════════════════════════════════

// ── STATE init ────────────────────────────────────────────────
(function patchStateInit(){
  if(typeof initNewGame==="function"){
    var _o=initNewGame;
    initNewGame=function(uid,n,s){var st=_o(uid,n,s);if(st)st.coins=st.coins||0;return st;};
  }
  if(typeof loadGameState==="function"){
    var _o2=loadGameState;
    loadGameState=function(uid,saved){var r=_o2(uid,saved);if(STATE)STATE.coins=STATE.coins||0;return r;};
  }
})();

// ── ITEM_DEFS Erweiterungen ───────────────────────────────────
(function addExtraItemDefs(){
  if(typeof ITEM_DEFS==="undefined")return;
  var extras={
    pokefloete:{name:"Pokéflöte",desc:"Weckt schlafende Relaxo auf.",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-flute.png",isKey:true},
    silph_scope:{name:"Silph-Fernglas",desc:"Sieht Geist-Pokémon.",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/silph-scope.png",isKey:true},
    secret_key:{name:"Geheimschlüssel",desc:"Öffnet die Zinnoberinsel-Arena.",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/secret-key.png",isKey:true},
    dome_fossil:{name:"Kuppelfossil",desc:"Urzeitfossil → Kabuto.",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dome-fossil.png",isKey:true},
    helix_fossil:{name:"Spiralenfossil",desc:"Urzeitfossil → Amonitas.",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/helix-fossil.png",isKey:true},
    old_amber:{name:"Altes Bernstein",desc:"Urzeitfossil → Aerodactyl.",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/old-amber.png",isKey:true},
    bootsticket:{name:"Bootsticket",desc:"Eintrittskarte für die S.S. Anne.",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ss-ticket.png",isKey:true},
  };
  Object.keys(extras).forEach(function(k){if(!ITEM_DEFS[k])ITEM_DEFS[k]=extras[k];});
})();

// ══════════════════════════════════════════════════════════════
//  processStage PATCH — neue Waypoint-Typen
// ══════════════════════════════════════════════════════════════
(function patchProcessStageExtra(){
  if(typeof processStage!=="function"){setTimeout(patchProcessStageExtra,200);return;}
  var _orig=processStage;
  processStage=function(){
    if(!STATE||_waitingForInput)return;
    var zone=getZone(STATE.currentZoneId);if(!zone)return;
    if(zone.waypoints){
      var relaxo=zone.waypoints.find(function(w){return w.atStage===STATE.currentStage&&w.type==="relaxo_block"&&!isEventFlagSet(w.flagId);});
      if(relaxo){clearInterval(STAGE_INTERVAL);_waitingForInput=true;renderRelaxoBlock(zone,relaxo);return;}
      var fossil=zone.waypoints.find(function(w){return w.atStage===STATE.currentStage&&w.type==="fossil_choice"&&!isEventFlagSet(w.flagId);});
      if(fossil){clearInterval(STAGE_INTERVAL);_waitingForInput=true;renderFossilChoice(zone,fossil);return;}
      var mewtu=zone.waypoints.find(function(w){return w.atStage===STATE.currentStage&&w.type==="mewtu_encounter"&&!isEventFlagSet(w.flagId);});
      if(mewtu){clearInterval(STAGE_INTERVAL);_waitingForInput=true;triggerMewtuEncounter(zone,mewtu);return;}
      var moneyWp=zone.waypoints.find(function(w){return w.atStage===STATE.currentStage&&w.type==="event"&&w.money&&!isEventFlagSet(w.flagId);});
      if(moneyWp){STATE.money+=moneyWp.money;updateHUD();setEventFlag(moneyWp.flagId);if(moneyWp.message)showToast(moneyWp.message,4500);saveGame();}
    }
    _orig();
  };
})();

// ══════════════════════════════════════════════════════════════
//  renderFeature PATCH
// ══════════════════════════════════════════════════════════════
(function patchRenderFeature(){
  if(typeof renderFeature!=="function"){setTimeout(patchRenderFeature,200);return;}
  var _orig=renderFeature;
  renderFeature=function(feat,bldgId){
    switch(feat.type){
      case "coin_buy":      return renderCoinBuy(feat,bldgId);
      case "coin_shop":     return renderCoinShop(feat,bldgId);
      case "rocket_switch": return renderRocketSwitch(feat,bldgId);
      case "rocket_floor":
      case "mansion_battle":
      case "dojo_battle":   return renderBattleSequence(feat,bldgId);
      case "dojo_choice":   return renderDojoChoice(feat,bldgId);
      case "give_item_hq":  return renderGiveItemHQ(feat,bldgId);
      case "gift_pokemon":  return renderGiftPokemon(feat,bldgId);
      case "bill_rescue":   return renderBillRescue(feat,bldgId);
      default:              return _orig(feat,bldgId);
    }
  };
})();

// ══════════════════════════════════════════════════════════════
//  🪨 FOSSIL-WAHL
// ══════════════════════════════════════════════════════════════
function renderFossilChoice(zone,wp){
  var container=document.getElementById("viewWorld");if(!container)return;
  switchTab("World");
  var html="<div class='fossil-scene'><div class='fossil-title'>🪨 Fossil-Wahl!</div><div class='fossil-desc'>"+wp.text+"</div><div class='fossil-grid'>";
  (wp.choices||[]).forEach(function(c,i){
    var pd=PKMN[c.dexId];
    html+="<div class='fossil-card' onclick='chooseFossil("+i+",\""+zone.id+"\")'>" +
      "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+c.dexId+".png' style='width:80px;height:80px;image-rendering:pixelated'>" +
      "<div class='fossil-name'>"+c.itemName+"</div>" +
      "<div class='fossil-desc-s'>"+(pd?pd.name:c.desc)+" — "+c.desc+"</div>" +
      "<button class='feat-btn feat-btn-primary' style='margin-top:8px'>Nehmen</button></div>";
  });
  html+="</div></div>";
  container.innerHTML=html;
}
window.chooseFossil=function(idx,zoneId){
  var zone=getZone(zoneId);if(!zone)return;
  var wp=zone.waypoints.find(function(w){return w.type==="fossil_choice"&&!isEventFlagSet(w.flagId);});
  if(!wp)return;
  var choice=wp.choices[idx];if(!choice)return;
  STATE.items[choice.item]=(STATE.items[choice.item]||0)+1;
  setEventFlag(wp.flagId);
  showToast("🪨 "+choice.itemName+" erhalten! Bring es zum Labor auf der Zinnoberinsel.",5000);
  saveGame();_waitingForInput=false;advanceStage();startStageLoop();
};

// ══════════════════════════════════════════════════════════════
//  🔮 MEWTU-ENCOUNTER
// ══════════════════════════════════════════════════════════════
function triggerMewtuEncounter(zone,wp){
  var container=document.getElementById("viewWorld");
  if(container){
    switchTab("World");
    container.innerHTML="<div style='text-align:center;padding:20px'>" +
      "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png' style='width:140px;height:140px;image-rendering:pixelated;animation:relaxo-bob 2s ease-in-out infinite'>" +
      "<div style='font-size:22px;font-weight:800;color:#a78bfa;margin:12px 0'>⚠️ MEWTU</div>" +
      "<div style='font-size:13px;color:#aaa;max-width:300px;margin:0 auto 16px'>"+wp.message+"</div>" +
      (wp.hintMsg?"<div style='font-size:11px;color:#818cf8;background:rgba(129,140,248,.1);border:1px solid rgba(129,140,248,.25);border-radius:8px;padding:8px 14px;margin-bottom:14px'>"+wp.hintMsg+"</div>":"")+
      "<button class='feat-btn feat-btn-danger' style='max-width:280px;margin:0 auto;font-size:16px' onclick='startMewtuFight(\""+zone.id+"\")'>⚔️ Kampf beginnen!</button></div>";
  }
}
window.startMewtuFight=function(zoneId){
  var zone=getZone(zoneId);if(!zone)return;
  var wp=zone.waypoints.find(function(w){return w.type==="mewtu_encounter"&&!isEventFlagSet(w.flagId);});
  if(!wp)return;
  var mewtu=createPkmnInstance(wp.mewtoDexId||150,wp.mewtuLevel||70);
  mewtu._isMewtuBlock=true;mewtu._mewtuFlagId=wp.flagId;
  _waitingForInput=true;startBattle("wild",mewtu);
  renderEnemySprite(BATTLE.enemy,true);showBattleUI(BATTLE.enemy);clearBattleLog();
  appendBattleLog("⚠️ Ein wildes Mewtu Lv."+mewtu.level+" erscheint! Catchrate: 3 — Meisterball empfohlen!");
  // ── FIX: _autoFightEnabled statt BATTLE.autoFight ──────────
  if(_autoFightEnabled)startBattleLoop();
};

// Mewtu-Kampf-Ende
(function patchMewtuBattleEnd(){
  var _done=false;
  function tryPatch(){
    if(typeof onBattleEnd!=="function"||_done)return;
    _done=true;
    var _o=onBattleEnd;
    onBattleEnd=function(result){
      if(BATTLE&&BATTLE.enemy&&BATTLE.enemy._isMewtuBlock){
        var flagId=BATTLE.enemy._mewtuFlagId||"mewtu_fought";
        clearInterval(BATTLE_INTERVAL);_animRunning=false;hideTrainerPortrait();
        if(result==="win"){var xp=BATTLE.xpGained||0,lead=getActivePkmn();if(lead&&xp>0){applyXP(lead,xp).forEach(function(m){appendBattleLog(m);});showXPPopup(xp);}appendBattleLog("💥 Mewtu wurde besiegt... es entweicht!");}
        else if(result==="catch"){appendBattleLog("🎉 Mewtu wurde gefangen!");}
        else{appendBattleLog("Mewtu hat dich besiegt!");}
        setEventFlag(flagId);saveGame();
        showToast(result==="catch"?"🏆 Mewtu gefangen!":"Mewtu ist verschwunden...",4000);
        setTimeout(function(){
          hideBattleUI();renderEnemySprite(null,false);_waitingForInput=false;_animRunning=false;renderPlayerSprites();
          if(result==="lose"){STATE.currentZoneId=findRecoveryCity(STATE.currentZoneId);STATE.currentStage=1;healPartyFully();var z=getZone(STATE.currentZoneId);if(z)renderZoneBg(z);renderStageInfo();renderWorldTab();showToast("Team geheilt!",4000);}
          advanceStage();startStageLoop();
        },3000);return;
      }
      if(result==="win"&&BATTLE&&BATTLE.trainerData&&BATTLE.trainerData._seqNext){
        clearInterval(BATTLE_INTERVAL);_animRunning=false;hideTrainerPortrait();
        var xp2=BATTLE.xpGained||0,lead2=getActivePkmn();
        if(lead2&&xp2>0){applyXP(lead2,xp2).forEach(function(m){appendBattleLog(m);});showXPPopup(xp2);}
        if(BATTLE.moneyGained>0){STATE.money+=BATTLE.moneyGained;appendBattleLog("+"+BATTLE.moneyGained+" ₽!");updateHUD();}
        renderPlayerSprites();saveGame();
        var next=BATTLE.trainerData._seqNext,bid=BATTLE.trainerData._seqBldg;
        setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=true;_inCity=true;
          STATE.currentBuilding=bid;appendBattleLog("Sieg! Weiter...");setTimeout(function(){var b=getZone(bid);if(b)next();},1500);},2000);
        return;
      }
      _o.call(this,result);
    };
  }
  setTimeout(tryPatch,500);
})();

// ══════════════════════════════════════════════════════════════
//  🎵 RELAXO-BLOCKADE
// ══════════════════════════════════════════════════════════════
function renderRelaxoBlock(zone,wp){
  var container=document.getElementById("viewWorld");if(!container)return;
  var hasFloete=STATE.items&&(STATE.items[wp.needsItem||"pokefloete"]||0)>0;
  switchTab("World");
  var html="<div class='relaxo-block-scene'>" +
    "<img class='relaxo-img' src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png'>" +
    "<div class='relaxo-zzz'>💤 Z Z Z</div><div class='relaxo-title'>Relaxo schläft!</div>" +
    "<div class='relaxo-desc'>"+wp.blockedMsg+"</div>";
  if(hasFloete){
    html+="<div class='relaxo-has-floete'>🎵 Du hast die Pokéflöte!</div>" +
      "<button class='feat-btn feat-btn-primary relaxo-wake-btn' onclick='wakeRelaxo(\""+zone.id+"\")'>🎵 Pokéflöte spielen!</button>" +
      "<div class='relaxo-hint'>Relaxo Lv.30 erscheint. Fangen oder besiegen!</div>";
  }else{
    html+="<div class='relaxo-no-floete'>❌ Du brauchst die Pokéflöte!</div>" +
      "<div class='relaxo-no-desc'>Mr. Fuji in Lavendeldorf gibt sie dir nach dem Rival-Kampf im Pokémon-Turm.</div>" +
      "<button class='feat-btn feat-btn-back' onclick='goBackFromRelaxo()'>← Zurückgehen</button>";
  }
  container.innerHTML=html+"</div>";
}
window.wakeRelaxo=function(zoneId){
  var zone=getZone(zoneId);if(!zone)return;
  var wp=zone.waypoints&&zone.waypoints.find(function(w){return w.type==="relaxo_block"&&!isEventFlagSet(w.flagId);});
  if(!wp)return;
  showToast("🎵 Die Pokéflöte erklingt...",3000);
  setTimeout(function(){
    var relaxo=createPkmnInstance(wp.relaxoDexId||143,wp.relaxoLevel||30);
    relaxo._isRelaxoBlock=true;relaxo._relaxoFlagId=wp.flagId;
    _waitingForInput=true;startBattle("wild",relaxo);
    renderEnemySprite(BATTLE.enemy,true);showBattleUI(BATTLE.enemy);clearBattleLog();
    appendBattleLog(wp.wakeMsg);appendBattleLog("Ein wildes Relaxo Lv."+relaxo.level+" erscheint!");
    // ── FIX: _autoFightEnabled statt BATTLE.autoFight ──────
    if(_autoFightEnabled)startBattleLoop();
  },1500);
};
window.goBackFromRelaxo=function(){
  _waitingForInput=false;
  var backCity="cerulean_city";
  if(STATE.currentZoneId==="route16_18")backCity="celadon_city";
  if(STATE.currentZoneId==="route7_8")backCity="lavender_town";
  STATE.currentZoneId=backCity;STATE.currentStage=1;
  var z=getZone(backCity);if(z){renderZoneBg(z);markZoneVisited(backCity);}
  saveGame();showToast("Du kehrst nach "+(z?z.name:backCity)+" zurück.",3000);
  clearInterval(STAGE_INTERVAL);clearInterval(BATTLE_INTERVAL);
  _inCity=true;_waitingForInput=true;STATE.currentBuilding=null;
  hideBattleUI();renderEnemySprite(null,false);
  setTimeout(function(){if(z)renderCityHub(z);},200);
};

// Relaxo-Ende
(function patchRelaxoEnd(){
  var _done=false;
  function tryPatch(){
    if(typeof onBattleEnd!=="function"||_done)return;
    _done=true;
    var _o=onBattleEnd;
    onBattleEnd=function(result){
      if(BATTLE&&BATTLE.enemy&&BATTLE.enemy._isRelaxoBlock){
        var flagId=BATTLE.enemy._relaxoFlagId||"relaxo_cleared";
        clearInterval(BATTLE_INTERVAL);_animRunning=false;hideTrainerPortrait();
        if(result==="win"){var xp=BATTLE.xpGained||0,lead=getActivePkmn();if(lead&&xp>0){applyXP(lead,xp).forEach(function(m){appendBattleLog(m);});showXPPopup(xp);}appendBattleLog("💥 Relaxo wurde besiegt!");}
        else if(result==="catch"){appendBattleLog("✅ Relaxo gefangen!");}
        else{appendBattleLog("Du bist geflohen.");}
        setEventFlag(flagId);saveGame();
        appendBattleLog("💤 Relaxo ist aufgewacht und hat den Weg geräumt!");
        showToast("✅ Der Weg ist frei!",4000);
        setTimeout(function(){hideBattleUI();renderEnemySprite(null,false);_waitingForInput=false;_animRunning=false;renderPlayerSprites();advanceStage();startStageLoop();},2500);
        return;
      }
      _o.call(this,result);
    };
  }
  setTimeout(tryPatch,600);
})();

// ══════════════════════════════════════════════════════════════
//  🔬 BILLS HAUS
// ══════════════════════════════════════════════════════════════
function renderBillRescue(feat,bldgId){
  var done=isEventFlagSet(feat.flagId);
  var html="<div class='feat-section'><div class='feat-title'>"+feat.label+"</div><div class='feat-desc'>"+feat.desc+"</div>";
  if(done){html+="<div class='feat-success'>✅ Bootsticket erhalten!</div>";}
  else{
    html+="<div style='text-align:center;margin:10px 0'><img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png' style='width:80px;height:80px;image-rendering:pixelated'><div style='font-size:12px;color:#aaa;margin-top:4px'>Bill ist gefangen...</div></div>";
    html+="<button class='feat-btn feat-btn-primary' onclick='claimBillRescue(\""+bldgId+"\",\""+feat.id+"\")'>🔬 Teleporter aktivieren</button>";
  }
  return html+"</div>";
}
window.claimBillRescue=function(bldgId,featId){
  var bldg=getZone(bldgId);if(!bldg)return;
  var feat=bldg.features.find(function(f){return f.id===featId;});if(!feat)return;
  if(isEventFlagSet(feat.flagId)){showToast("Bereits erledigt!");return;}
  STATE.items["bootsticket"]=(STATE.items["bootsticket"]||0)+1;
  if(typeof ITEM_DEFS!=="undefined"&&!ITEM_DEFS["bootsticket"])ITEM_DEFS["bootsticket"]={name:"Bootsticket",desc:"Eintrittskarte für die S.S. Anne.",isKey:true};
  setEventFlag(feat.flagId);showToast("🎟️ Bootsticket erhalten!",5000);
  if(feat.text)showToast(feat.text,7000);
  saveGame();renderBuildingView(bldg);
};

// ══════════════════════════════════════════════════════════════
//  Spielhalle / Rocket / Dojo / Items
// ══════════════════════════════════════════════════════════════
function checkFeatureCondition(cond){
  if(!cond)return true;
  if(cond.eventFlag&&!isEventFlagSet(cond.eventFlag))return false;
  if(cond.hasBadge&&STATE.badgeIds.indexOf(cond.hasBadge)<0)return false;
  if(cond.minBadges&&STATE.badges<cond.minBadges)return false;
  if(cond.hasItem&&(!STATE.items[cond.hasItem]||(STATE.items[cond.hasItem]||0)<=0))return false;
  return true;
}
function renderCoinBuy(feat,bldgId){
  var coins=STATE.coins||0;
  var html="<div class='feat-section'><div class='feat-title'>"+feat.label+"</div><div class='feat-desc'>"+feat.desc+"</div><div class='coin-balance'>🪙 Deine Münzen: <b>"+coins+"</b></div>";
  (feat.packs||[]).forEach(function(pack,i){var ok=STATE.money>=(pack.cost||500);html+="<div class='coin-pack'><div class='coin-pack-info'><b>"+pack.label+"</b><span class='coin-pack-price'>"+pack.cost+"₽</span></div><button "+(ok?"":"disabled")+" onclick='buyCoinPack("+i+",\""+bldgId+"\")'>Kaufen</button></div>";});
  return html+"</div>";
}
window.buyCoinPack=function(idx,bldgId){var bldg=getZone(bldgId);if(!bldg)return;var feat=bldg.features.find(function(f){return f.type==="coin_buy";});if(!feat)return;var pack=feat.packs[idx];if(!pack)return;if(STATE.money<pack.cost){showToast("Nicht genug Geld!");return;}STATE.money-=pack.cost;STATE.coins=(STATE.coins||0)+pack.coins;showToast("🪙 +"+pack.coins+" Münzen!");updateHUD();saveGame();renderBuildingView(bldg);};
function renderCoinShop(feat,bldgId){
  var coins=STATE.coins||0;
  var html="<div class='feat-section'><div class='feat-title'>"+feat.label+"</div><div class='feat-desc'>"+feat.desc+"</div><div class='coin-balance'>🪙 Münzen: <b>"+coins+"</b></div>";
  (feat.items||[]).forEach(function(item,i){var owned=isEventFlagSet("coinshop_"+item.id),ok=coins>=item.cost;html+="<div class='coin-shop-item"+(owned?" cs-owned":"")+"'>"+(item.dexId?"<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+item.dexId+".png' width='36' height='36' style='image-rendering:pixelated'>":"")+"<div class='cs-info'><b>"+item.name+"</b><span class='cs-desc'>"+item.desc+"</span></div><div class='cs-right'><span class='cs-cost'>🪙"+item.cost+"</span>"+(owned?"<span class='cs-badge'>✓</span>":"<button "+(ok?"":"disabled")+" onclick='buyCoinItem("+i+",\""+bldgId+"\")'>Nehmen</button>")+"</div></div>";});
  return html+"</div>";
}
window.buyCoinItem=function(idx,bldgId){var bldg=getZone(bldgId);if(!bldg)return;var feat=bldg.features.find(function(f){return f.type==="coin_shop";});if(!feat)return;var item=feat.items[idx];if(!item)return;if((STATE.coins||0)<item.cost){showToast("Nicht genug Münzen!");return;}if(isEventFlagSet("coinshop_"+item.id)){showToast("Bereits genommen!");return;}STATE.coins-=item.cost;if(item.dexId){var p=createPkmnInstance(item.dexId,25);if(p){p.nick=item.name;if(!addToParty(p))addToBox(p);STATE.caught[p.dexId]=true;STATE.seen[p.dexId]=true;}}setEventFlag("coinshop_"+item.id);saveGame();showToast("🪙 "+item.name+" erhalten!");renderBuildingView(bldg);};
function renderRocketSwitch(feat,bldgId){var found=isEventFlagSet(feat.flagId||"rocket_switch_found");var html="<div class='feat-section'><div class='feat-title'>"+feat.label+"</div><div class='feat-desc'>"+feat.desc+"</div>";if(found){html+="<div class='feat-success'>"+feat.unlockedMsg+"</div>";}else{html+="<button class='feat-btn feat-btn-danger' onclick='activateRocketSwitch(\""+feat.flagId+"\",\""+bldgId+"\")'>🔴 Drücken</button>";}return html+"</div>";}
window.activateRocketSwitch=function(flagId,bldgId){setEventFlag(flagId||"rocket_switch_found");saveGame();showToast("⚡ Geheimtreppe öffnet sich!",4000);var bldg=getZone(bldgId);if(bldg)renderBuildingView(bldg);};
function renderBattleSequence(feat,bldgId){
  if(feat.condition&&!checkFeatureCondition(feat.condition))return "<div class='feat-section'><div class='feat-title'>"+feat.label+"</div><div class='feat-locked'>🔒 "+feat.lockedMsg+"</div></div>";
  var cleared=isEventFlagSet(feat.flagId);
  var html="<div class='feat-section'><div class='feat-title'>"+feat.label+"</div><div class='feat-desc'>"+feat.desc+"</div>";
  if(cleared){html+="<div class='feat-success'>✅ Abgeschlossen!</div>";}
  else{
    (feat.trainers||[]).forEach(function(t){html+="<div class='bseq-trainer"+(t.isBoss?" bseq-boss":"")+"'>"+(t.isBoss?"👑 ":"⚡ ")+t.name+" <span class='bseq-lv'>Lv."+(t.party?Math.max.apply(null,t.party.map(function(p){return p.lv;})):0)+"</span></div>";});
    html+="<button class='feat-btn feat-btn-danger' onclick='startBattleSeq(\""+bldgId+"\",\""+feat.id+"\")'>⚔️ Kämpfen!</button>";
  }
  return html+"</div>";
}
window.startBattleSeq=function(bldgId,featId){
  var bldg=getZone(bldgId);if(!bldg)return;
  var feat=bldg.features.find(function(f){return f.id===featId;});if(!feat)return;
  var trainers=(feat.trainers||[]).slice();
  function fightNext(){
    if(!trainers.length){setEventFlag(feat.flagId);showToast("✅ Abgeschlossen!",4000);saveGame();setTimeout(function(){renderBuildingView(bldg);},500);return;}
    var t=trainers.shift();
    clearInterval(STAGE_INTERVAL);_waitingForInput=true;_animRunning=true;
    startBattle("trainer",{name:t.name,party:t.party,reward:t.reward||500,returnToCity:false,_seqNext:fightNext,_seqBldg:bldgId});
    var epd=PKMN[BATTLE.enemy.dexId];
    showBattleUI(BATTLE.enemy);clearBattleLog();
    var spr=getTrainerSprite({name:t.name});if(spr)renderTrainerPortrait(t.name,spr);
    appendBattleLog((t.isBoss?"👑 Boss: ":"⚡ ")+t.name+" fordert heraus!");
    appendBattleLog("Er schickt "+(epd?epd.name:"?")+" Lv."+BATTLE.enemy.level+"!");
    _animRunning=false;
    // ── FIX: _autoFightEnabled statt BATTLE.autoFight ──────
    if(_autoFightEnabled)startBattleLoop();
  }
  fightNext();
};
function renderDojoChoice(feat,bldgId){
  if(feat.condition&&!checkFeatureCondition(feat.condition))return "<div class='feat-section'><div class='feat-title'>"+feat.label+"</div><div class='feat-locked'>🔒 "+feat.lockedMsg+"</div></div>";
  var taken=isEventFlagSet(feat.flagId);
  var html="<div class='feat-section'><div class='feat-title'>"+feat.label+"</div><div class='feat-desc'>"+feat.desc+"</div>";
  if(taken){html+="<div class='feat-success'>✅ Kampfpokémon erhalten!</div>";}
  else{html+="<div class='dojo-choice-grid'>";(feat.choices||[]).forEach(function(c,i){html+="<div class='dojo-choice-card' onclick='takeDojoPokemon("+i+",\""+bldgId+"\",\""+feat.id+"\")'><img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+c.dexId+".png' width='80' height='80' style='image-rendering:pixelated'><div class='dc-name'>"+c.label+"</div><div class='dc-desc'>"+c.desc+"</div><button class='feat-btn'>Wählen</button></div>";});html+="</div>";}
  return html+"</div>";
}
window.takeDojoPokemon=function(idx,bldgId,featId){var bldg=getZone(bldgId);if(!bldg)return;var feat=bldg.features.find(function(f){return f.id===featId;});if(!feat)return;if(isEventFlagSet(feat.flagId)){showToast("Bereits gewählt!");return;}var c=feat.choices[idx];if(!c)return;var p=createPkmnInstance(c.dexId,c.level||25);if(!p)return;if(!addToParty(p))addToBox(p);STATE.caught[p.dexId]=true;STATE.seen[p.dexId]=true;setEventFlag(feat.flagId);showToast("🥊 "+c.name+" tritt bei!",5000);saveGame();renderTeamScreen();renderBuildingView(bldg);};
function renderGiveItemHQ(feat,bldgId){
  if(feat.condition&&!checkFeatureCondition(feat.condition))return "<div class='feat-section'><div class='feat-title'>"+feat.label+"</div><div class='feat-locked'>🔒 "+feat.lockedMsg+"</div></div>";
  var taken=isEventFlagSet(feat.flagId);
  var html="<div class='feat-section'><div class='feat-title'>"+feat.label+"</div><div class='feat-desc'>"+feat.desc+"</div>";
  if(taken){html+="<div class='feat-success'>✅ "+feat.itemName+" erhalten!</div>";}
  else{html+="<div class='feat-reward-preview'><span class='feat-reward-icon'>📦</span><span>"+feat.itemName+"</span></div><button class='feat-btn feat-btn-primary' onclick='claimHQItem(\""+bldgId+"\",\""+feat.id+"\")'>🎁 Nehmen</button>";}
  return html+"</div>";
}
window.claimHQItem=function(bldgId,featId){var bldg=getZone(bldgId);if(!bldg)return;var feat=bldg.features.find(function(f){return f.id===featId;});if(!feat)return;if(isEventFlagSet(feat.flagId)){showToast("Bereits erhalten!");return;}STATE.items[feat.item]=(STATE.items[feat.item]||0)+1;if(typeof ITEM_DEFS!=="undefined"&&!ITEM_DEFS[feat.item])ITEM_DEFS[feat.item]={name:feat.itemName,desc:feat.text||"Schlüsselitem.",isKey:true,img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/cleanse-tag.png"};setEventFlag(feat.flagId);showToast("✅ "+feat.itemName+" erhalten!",4000);if(feat.text)appendBattleLog(feat.text);saveGame();renderBuildingView(bldg);};
function renderGiftPokemon(feat,bldgId){
  if(feat.condition&&!checkFeatureCondition(feat.condition))return "<div class='feat-section'><div class='feat-title'>"+feat.label+"</div><div class='feat-locked'>🔒 "+feat.lockedMsg+"</div></div>";
  var taken=isEventFlagSet(feat.flagId),pd=PKMN[feat.dexId];
  var html="<div class='feat-section'><div class='feat-title'>"+feat.label+"</div>";
  if(taken){html+="<div class='feat-success'>✅ "+(pd?pd.name:"Pokémon")+" erhalten!</div>";}
  else{html+="<div class='feat-desc'>"+feat.desc+"</div>";if(feat.dexId)html+="<div style='text-align:center;margin:10px 0'><img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+feat.dexId+".png' style='width:90px;height:90px;image-rendering:pixelated'><div style='font-weight:700;margin-top:6px'>"+(pd?pd.name:"?")+" Lv."+(feat.level||25)+"</div></div>";html+="<button class='feat-btn feat-btn-primary' onclick='claimGiftPokemon(\""+bldgId+"\",\""+feat.id+"\")'>🎁 Annehmen</button>";}
  return html+"</div>";
}
window.claimGiftPokemon=function(bldgId,featId){var bldg=getZone(bldgId);if(!bldg)return;var feat=bldg.features.find(function(f){return f.id===featId;});if(!feat)return;if(isEventFlagSet(feat.flagId)){showToast("Bereits erhalten!");return;}var p=createPkmnInstance(feat.dexId,feat.level||25);if(!p)return;if(feat.nick)p.nick=feat.nick;if(!addToParty(p))addToBox(p);STATE.caught[p.dexId]=true;STATE.seen[p.dexId]=true;setEventFlag(feat.flagId);var pd=PKMN[feat.dexId];showToast("🎁 "+(pd?pd.name:"Pokémon")+" erhalten!",5000);if(feat.text)showToast(feat.text,7000);saveGame();renderTeamScreen();renderPlayerSprites();renderBuildingView(bldg);};

// ══════════════════════════════════════════════════════════════
//  CSS
// ══════════════════════════════════════════════════════════════
(function injectCSS(){
  var s=document.createElement("style");
  s.textContent=`
    .relaxo-block-scene{display:flex;flex-direction:column;align-items:center;padding:16px 8px;text-align:center;gap:8px;}
    .relaxo-img{width:140px;height:140px;image-rendering:pixelated;animation:relaxo-bob 2s ease-in-out infinite;}
    @keyframes relaxo-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
    .relaxo-zzz{font-size:28px;color:#a78bfa;animation:zzz-fade 1.5s ease-in-out infinite;}
    @keyframes zzz-fade{0%,100%{opacity:.3;transform:translateY(0);}50%{opacity:1;transform:translateY(-6px);}}
    .relaxo-title{font-size:20px;font-weight:800;color:#fff;}
    .relaxo-desc{font-size:13px;color:#aaa;max-width:300px;line-height:1.5;}
    .relaxo-has-floete{font-size:13px;color:#fde68a;background:rgba(250,204,21,.12);border:1px solid rgba(250,204,21,.3);border-radius:8px;padding:6px 14px;}
    .relaxo-no-floete{font-size:13px;color:#f87171;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:6px 14px;}
    .relaxo-no-desc{font-size:12px;color:#888;max-width:280px;line-height:1.5;}
    .relaxo-hint{font-size:11px;color:#818cf8;margin-top:4px;}
    .relaxo-wake-btn{font-size:16px!important;padding:12px 20px!important;background:linear-gradient(135deg,#6366f1,#a78bfa)!important;animation:wake-pulse 1.5s ease-in-out infinite;max-width:280px;margin:0 auto;}
    @keyframes wake-pulse{0%,100%{box-shadow:0 0 0 0 rgba(129,140,248,0);}50%{box-shadow:0 0 12px 4px rgba(129,140,248,.4);}}
    .feat-btn-back{background:rgba(255,255,255,.08)!important;color:#ccc!important;border:1px solid rgba(255,255,255,.15)!important;}
    .fossil-scene{display:flex;flex-direction:column;align-items:center;padding:12px;gap:10px;text-align:center;}
    .fossil-title{font-size:20px;font-weight:800;color:#f0c040;}
    .fossil-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:340px;}
    .fossil-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:14px 10px;cursor:pointer;transition:.2s;text-align:center;}
    .fossil-card:hover{background:rgba(99,102,241,.15);border-color:rgba(99,102,241,.4);}
    .fossil-name{font-size:13px;font-weight:700;margin:6px 0 3px;color:#ddd;}
    .fossil-desc-s{font-size:11px;color:#888;margin-bottom:4px;}
    .coin-balance{background:rgba(250,204,21,.12);border:1px solid rgba(250,204,21,.3);border-radius:8px;padding:8px 12px;font-size:14px;margin:8px 0;color:#fde68a;}
    .coin-pack{display:flex;align-items:center;justify-content:space-between;padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.06);}
    .coin-pack-info{display:flex;align-items:center;gap:12px;}
    .coin-pack-price{color:#ffd700;font-size:12px;}
    .coin-shop-item{display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid rgba(255,255,255,.06);}
    .coin-shop-item.cs-owned{opacity:.4;}
    .cs-info{flex:1;display:flex;flex-direction:column;gap:2px;}
    .cs-desc{font-size:11px;color:#888;}
    .cs-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;}
    .cs-cost{font-size:12px;color:#facc15;font-weight:700;}
    .cs-badge{font-size:11px;color:#10b981;}
    .feat-section{margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.07);}
    .feat-section:last-child{border-bottom:none;}
    .feat-title{font-size:14px;font-weight:700;color:#ddd;margin-bottom:6px;}
    .feat-desc{font-size:12px;color:#888;margin-bottom:8px;}
    .feat-locked{font-size:12px;color:#f87171;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:8px 12px;}
    .feat-success{font-size:13px;color:#10b981;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:8px;padding:8px 12px;}
    .feat-btn{padding:9px 14px;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;margin-top:6px;transition:.15s;width:100%;display:block;}
    .feat-btn:hover{opacity:.85;}
    .feat-btn:disabled{opacity:.4;cursor:not-allowed;}
    .feat-btn-primary{background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;}
    .feat-btn-danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;}
    .bseq-trainer{display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:rgba(255,255,255,.05);border-radius:6px;font-size:12px;margin-bottom:3px;}
    .bseq-boss{background:rgba(239,68,68,.12)!important;border:1px solid rgba(239,68,68,.3);}
    .bseq-lv{font-size:11px;color:#888;}
    .dojo-choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0;}
    .dojo-choice-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;text-align:center;cursor:pointer;transition:.2s;}
    .dojo-choice-card:hover{background:rgba(99,102,241,.15);border-color:rgba(99,102,241,.4);}
    .dc-name{font-size:13px;font-weight:700;margin:6px 0 3px;}
    .dc-desc{font-size:11px;color:#888;margin-bottom:8px;}
    .feat-reward-preview{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);border-radius:8px;padding:10px;margin:6px 0;}
    .feat-reward-icon{font-size:28px;}
  `;
  document.head.appendChild(s);
})();
