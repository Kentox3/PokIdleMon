// ═══════════════════════════════════════════════════════════════
//  buildings_extra.js — Renderer für neue Gebäude-Feature-Typen
//
//  Ergänzt renderer_patch.js um:
//  - coin_buy / coin_shop (Spielhalle)
//  - rocket_switch (Schalter → Rocket HQ)
//  - rocket_floor / mansion_battle / dojo_battle (Kampf-Sequenzen)
//  - give_item_hq (Item-Belohnung nach Kampf)
//  - gift_pokemon (Pokémon als Geschenk)
//  - dojo_choice (Wahl zwischen zwei Pokémon)
// ═══════════════════════════════════════════════════════════════

// ── STATE: Spielmünzen initialisieren ─────────────────────────
(function patchInitNewGame(){
  if(typeof initNewGame==="function"){
    var _orig=initNewGame;
    initNewGame=function(uid,trainerName,starterDexId){
      var s=_orig(uid,trainerName,starterDexId);
      if(s) s.coins=s.coins||0;
      return s;
    };
  }
  if(typeof loadGameState==="function"){
    var _orig2=loadGameState;
    loadGameState=function(uid,savedState){
      var r=_orig2(uid,savedState);
      if(STATE) STATE.coins=STATE.coins||0;
      return r;
    };
  }
})();

// ══════════════════════════════════════════════════════════════
//  RENDERER-PATCH: renderFeature überschreiben
// ══════════════════════════════════════════════════════════════
(function patchRenderFeature(){
  if(typeof renderFeature!=="function"){setTimeout(patchRenderFeature,200);return;}
  var _orig=renderFeature;

  renderFeature=function(feat,bldgId){
    // ── Neue Feature-Typen abfangen ──────────────────────────
    switch(feat.type){
      case "coin_buy":      return renderCoinBuy(feat,bldgId);
      case "coin_shop":     return renderCoinShop(feat,bldgId);
      case "rocket_switch": return renderRocketSwitch(feat,bldgId);
      case "rocket_floor":  return renderBattleSequence(feat,bldgId,"⚡ Rocket Etage");
      case "mansion_battle":return renderBattleSequence(feat,bldgId,"⚡ Herrenhaus");
      case "dojo_battle":   return renderBattleSequence(feat,bldgId,"🥊 Dojo");
      case "dojo_choice":   return renderDojoChoice(feat,bldgId);
      case "give_item_hq":  return renderGiveItemHQ(feat,bldgId);
      case "gift_pokemon":  return renderGiftPokemon(feat,bldgId);
      default:              return _orig(feat,bldgId);
    }
  };
})();

// ══════════════════════════════════════════════════════════════
//  🪙 SPIELHALLE — Münzen kaufen
// ══════════════════════════════════════════════════════════════
function renderCoinBuy(feat, bldgId){
  var coins=STATE.coins||0;
  var html="<div class='feat-section'>";
  html+="<div class='feat-title'>"+feat.label+"</div>";
  html+="<div class='feat-desc'>"+feat.desc+"</div>";
  html+="<div class='coin-balance'>🪙 Deine Münzen: <b>"+coins+"</b></div>";
  (feat.packs||[]).forEach(function(pack,i){
    var canAfford=STATE.money>=(pack.cost||500);
    html+="<div class='coin-pack'><div class='coin-pack-info'>"+
      "<b>"+pack.label+"</b><span class='coin-pack-price'>"+pack.cost+"₽</span></div>"+
      "<button "+(canAfford?"":"disabled")+" onclick='buyCoinPack("+i+",\""+bldgId+"\")'>Kaufen</button></div>";
  });
  html+="</div>";
  return html;
}

window.buyCoinPack=function(packIdx, bldgId){
  var bldg=getZone(bldgId); if(!bldg) return;
  var feat=bldg.features.find(function(f){return f.type==="coin_buy";});
  if(!feat) return;
  var pack=feat.packs[packIdx]; if(!pack) return;
  if(STATE.money<pack.cost){showToast("Nicht genug Geld!");return;}
  STATE.money-=pack.cost;
  STATE.coins=(STATE.coins||0)+pack.coins;
  showToast("🪙 +"+pack.coins+" Spielmünzen erhalten!");
  updateHUD(); saveGame();
  renderBuildingView(bldg);
};

// ── Münzshop ──────────────────────────────────────────────────
function renderCoinShop(feat, bldgId){
  var coins=STATE.coins||0;
  var html="<div class='feat-section'>";
  html+="<div class='feat-title'>"+feat.label+"</div>";
  html+="<div class='feat-desc'>"+feat.desc+"</div>";
  html+="<div class='coin-balance'>🪙 Deine Münzen: <b>"+coins+"</b></div>";
  (feat.items||[]).forEach(function(item,i){
    var owned=isEventFlagSet("coinshop_"+item.id);
    var canAfford=coins>=item.cost;
    var pd=item.dexId?PKMN[item.dexId]:null;
    html+="<div class='coin-shop-item"+(owned?" cs-owned":"")+"'>"+
      (item.dexId?"<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+item.dexId+".png' width='36' height='36' style='image-rendering:pixelated'>":"")+
      "<div class='cs-info'><b>"+item.name+"</b><span class='cs-desc'>"+item.desc+"</span></div>"+
      "<div class='cs-right'><span class='cs-cost'>🪙"+item.cost+"</span>"+
      (owned?"<span class='cs-badge'>✓ Genommen</span>":
        "<button "+(canAfford?"":"disabled")+" onclick='buyCoinItem("+i+",\""+bldgId+"\")'>Nehmen</button>")+
      "</div></div>";
  });
  html+="</div>";
  return html;
}

window.buyCoinItem=function(itemIdx, bldgId){
  var bldg=getZone(bldgId); if(!bldg) return;
  var feat=bldg.features.find(function(f){return f.type==="coin_shop";});
  if(!feat) return;
  var item=feat.items[itemIdx]; if(!item) return;
  if((STATE.coins||0)<item.cost){showToast("Nicht genug Münzen!");return;}
  if(isEventFlagSet("coinshop_"+item.id)){showToast("Bereits genommen!");return;}
  STATE.coins-=item.cost;
  // Pokémon erhalten
  if(item.dexId){
    var p=createPkmnInstance(item.dexId,25);
    if(p){
      p.nick=item.name;
      if(!addToParty(p))addToBox(p);
      if(!STATE.caught)STATE.caught={};if(!STATE.seen)STATE.seen={};
      STATE.caught[p.dexId]=true;STATE.seen[p.dexId]=true;
      showToast("🪙 "+item.name+" aus dem Münzshop erhalten!",4000);
    }
  }
  setEventFlag("coinshop_"+item.id);
  saveGame(); renderBuildingView(bldg);
};

// ══════════════════════════════════════════════════════════════
//  🔴 ROCKET-SCHALTER
// ══════════════════════════════════════════════════════════════
function renderRocketSwitch(feat, bldgId){
  var found=isEventFlagSet(feat.flagId||"rocket_switch_found");
  var html="<div class='feat-section'>";
  html+="<div class='feat-title'>"+feat.label+"</div>";
  html+="<div class='feat-desc'>"+feat.desc+"</div>";
  if(found){
    html+="<div class='feat-success'>"+feat.unlockedMsg+"</div>";
  }else{
    html+="<button class='feat-btn feat-btn-danger' onclick='activateRocketSwitch(\""+feat.flagId+"\",\""+bldgId+"\")'>"+
          "🔴 Schalter drücken</button>";
  }
  html+="</div>";
  return html;
}

window.activateRocketSwitch=function(flagId, bldgId){
  setEventFlag(flagId||"rocket_switch_found");
  showToast("⚡ Eine geheime Treppe öffnet sich! Team Rocket HQ darunter!",5000);
  saveGame();
  var bldg=getZone(bldgId);if(bldg)renderBuildingView(bldg);
};

// ══════════════════════════════════════════════════════════════
//  ⚔️ KAMPF-SEQUENZ (Rocket/Mansion/Dojo allgemein)
// ══════════════════════════════════════════════════════════════
function renderBattleSequence(feat, bldgId, label){
  // Bedingung prüfen
  if(feat.condition && !checkFeatureCondition(feat.condition)){
    return "<div class='feat-section'><div class='feat-title'>"+feat.label+"</div>"+
           "<div class='feat-locked'>🔒 "+feat.lockedMsg+"</div></div>";
  }
  var cleared=isEventFlagSet(feat.flagId);
  var html="<div class='feat-section'>";
  html+="<div class='feat-title'>"+feat.label+"</div>";
  html+="<div class='feat-desc'>"+feat.desc+"</div>";
  if(cleared){
    html+="<div class='feat-success'>✅ Erfolgreich abgeschlossen!</div>";
  }else{
    var trainers=feat.trainers||[];
    html+="<div class='battle-seq-preview'>";
    trainers.forEach(function(t){
      var pd=t.party&&t.party.length>0?PKMN[t.party[0].dexId]:null;
      html+="<div class='bseq-trainer"+(t.isBoss?" bseq-boss":"")+"'>"+
        "<span>"+(t.isBoss?"👑 ":"⚡ ")+t.name+"</span>"+
        "<span class='bseq-lv'>Lv."+(t.party&&t.party.length>0?Math.max.apply(null,t.party.map(function(p){return p.lv;})):0)+"</span>"+
      "</div>";
    });
    html+="</div>";
    html+="<button class='feat-btn feat-btn-danger' onclick='startBattleSeq(\""+bldgId+"\",\""+feat.id+"\")'>"+
          "⚔️ Kämpfen!</button>";
  }
  html+="</div>";
  return html;
}

// Hilfsfunktion: condition prüfen
function checkFeatureCondition(cond){
  if(!cond) return true;
  if(cond.eventFlag && !isEventFlagSet(cond.eventFlag)) return false;
  if(cond.hasBadge && STATE.badgeIds.indexOf(cond.hasBadge)<0) return false;
  if(cond.minBadges && STATE.badges<cond.minBadges) return false;
  return true;
}

// Kampf-Sequenz starten
window.startBattleSeq=function(bldgId, featId){
  var bldg=getZone(bldgId); if(!bldg) return;
  var feat=bldg.features.find(function(f){return f.id===featId;}); if(!feat) return;
  var trainers=(feat.trainers||[]).slice();

  function fightNext(){
    if(trainers.length===0){
      // Alle besiegt!
      setEventFlag(feat.flagId);
      showToast("✅ "+feat.label+" abgeschlossen!",4000);
      saveGame();
      setTimeout(function(){renderBuildingView(bldg);},500);
      return;
    }
    var t=trainers.shift();
    clearInterval(STAGE_INTERVAL); _waitingForInput=true; _animRunning=true;
    startBattle("trainer",{name:t.name,party:t.party,reward:t.reward||500,returnToCity:false,_seqNext:fightNext,_seqBldg:bldgId});
    var epd=PKMN[BATTLE.enemy.dexId];
    showBattleUI(BATTLE.enemy); clearBattleLog();
    var spr=getTrainerSprite({name:t.name,isRival:false});
    if(spr)renderTrainerPortrait(t.name,spr);
    appendBattleLog("⚡ "+(t.isBoss?"👑 Boss: ":"")+t.name+" fordert dich heraus!");
    appendBattleLog("Er schickt "+(epd?epd.name:"?")+" Lv."+BATTLE.enemy.level+"!");
    _animRunning=false;
    if(BATTLE.autoFight)startBattleLoop();
  }
  fightNext();
};

// Sequenz-Sieg: nächsten Kampf starten (patcht onBattleEnd)
(function patchSeqBattle(){
  var _origOBE=window.onBattleEnd;
  if(typeof _origOBE!=="function")return;
  window.onBattleEnd=function(result){
    if(result==="win"&&BATTLE&&BATTLE.trainerData&&BATTLE.trainerData._seqNext){
      clearInterval(BATTLE_INTERVAL);_animRunning=false;hideTrainerPortrait();
      var xp=BATTLE.xpGained||0;
      if(xp>0){
        var lead=getActivePkmn();
        if(lead){applyXP(lead,xp).forEach(function(m){appendBattleLog(m);});}
      }
      if(BATTLE.moneyGained>0){STATE.money+=BATTLE.moneyGained;appendBattleLog("+"+BATTLE.moneyGained+" ₽!");updateHUD();}
      renderPlayerSprites();saveGame();
      var next=BATTLE.trainerData._seqNext;
      var bldgId=BATTLE.trainerData._seqBldg;
      setTimeout(function(){
        hideBattleUI();renderEnemySprite(null,false);_waitingForInput=true;
        _inCity=true;STATE.currentBuilding=bldgId;
        var bldg=getZone(bldgId);
        appendBattleLog("Sieg! Weiter geht's…");
        setTimeout(function(){next();},1500);
      },2000);
      return;
    }
    _origOBE.call(this,result);
  };
})();

// ══════════════════════════════════════════════════════════════
//  🏆 DOJO-WAHL (Hitmonchan oder Hitmonlee)
// ══════════════════════════════════════════════════════════════
function renderDojoChoice(feat, bldgId){
  if(feat.condition && !checkFeatureCondition(feat.condition)){
    return "<div class='feat-section'><div class='feat-title'>"+feat.label+"</div>"+
           "<div class='feat-locked'>🔒 "+feat.lockedMsg+"</div></div>";
  }
  var taken=isEventFlagSet(feat.flagId);
  var html="<div class='feat-section'>";
  html+="<div class='feat-title'>"+feat.label+"</div>";
  html+="<div class='feat-desc'>"+feat.desc+"</div>";
  if(taken){
    html+="<div class='feat-success'>✅ Du hast dein Kampfpokémon bereits erhalten!</div>";
  }else{
    html+="<div class='dojo-choice-grid'>";
    (feat.choices||[]).forEach(function(c,i){
      var pd=PKMN[c.dexId];
      html+="<div class='dojo-choice-card' onclick='takeDojoPokemon("+i+",\""+bldgId+"\",\""+feat.id+"\")'>"+
        "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+c.dexId+".png' width='80' height='80' style='image-rendering:pixelated'>"+
        "<div class='dc-name'>"+c.label+"</div>"+
        "<div class='dc-desc'>"+c.desc+"</div>"+
        "<button class='feat-btn'>Wählen</button>"+
      "</div>";
    });
    html+="</div>";
  }
  html+="</div>";
  return html;
}

window.takeDojoPokemon=function(choiceIdx, bldgId, featId){
  var bldg=getZone(bldgId); if(!bldg) return;
  var feat=bldg.features.find(function(f){return f.id===featId;}); if(!feat) return;
  if(isEventFlagSet(feat.flagId)){showToast("Du hast bereits gewählt!");return;}
  var choice=feat.choices[choiceIdx]; if(!choice) return;
  var p=createPkmnInstance(choice.dexId,choice.level||25);
  if(!p){showToast("Fehler!"); return;}
  if(!addToParty(p))addToBox(p);
  if(!STATE.caught)STATE.caught={};if(!STATE.seen)STATE.seen={};
  STATE.caught[p.dexId]=true;STATE.seen[p.dexId]=true;
  setEventFlag(feat.flagId);
  showToast("🥊 "+choice.name+" tritt deiner Party bei!",5000);
  saveGame(); renderTeamScreen(); renderBuildingView(bldg);
};

// ══════════════════════════════════════════════════════════════
//  🎁 ITEM-BELOHNUNG nach Kampf
// ══════════════════════════════════════════════════════════════
function renderGiveItemHQ(feat, bldgId){
  if(feat.condition && !checkFeatureCondition(feat.condition)){
    return "<div class='feat-section'><div class='feat-title'>"+feat.label+"</div>"+
           "<div class='feat-locked'>🔒 "+feat.lockedMsg+"</div></div>";
  }
  var taken=isEventFlagSet(feat.flagId);
  var html="<div class='feat-section'>";
  html+="<div class='feat-title'>"+feat.label+"</div>";
  html+="<div class='feat-desc'>"+feat.desc+"</div>";
  if(taken){
    html+="<div class='feat-success'>✅ "+feat.itemName+" erhalten!</div>";
  }else{
    html+="<div class='feat-reward-preview'>"+
      "<span class='feat-reward-icon'>📦</span>"+
      "<span>"+feat.itemName+"</span>"+
    "</div>";
    html+="<button class='feat-btn feat-btn-primary' onclick='claimHQItem(\""+bldgId+"\",\""+feat.id+"\")'>"+
          "🎁 Nehmen</button>";
  }
  html+="</div>";
  return html;
}

window.claimHQItem=function(bldgId, featId){
  var bldg=getZone(bldgId); if(!bldg) return;
  var feat=bldg.features.find(function(f){return f.id===featId;}); if(!feat) return;
  if(isEventFlagSet(feat.flagId)){showToast("Bereits erhalten!");return;}
  // Item zu STATE hinzufügen (als Schlüsselitem)
  if(!STATE.items)STATE.items={};
  STATE.items[feat.item]=(STATE.items[feat.item]||0)+1;
  // ITEM_DEFS erweitern falls nötig
  if(typeof ITEM_DEFS!=="undefined"&&!ITEM_DEFS[feat.item]){
    ITEM_DEFS[feat.item]={name:feat.itemName,desc:feat.text||"Schlüsselitem.",isKey:true,
      img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/cleanse-tag.png"};
  }
  setEventFlag(feat.flagId);
  showToast("✅ "+feat.itemName+" erhalten!",4000);
  if(feat.text) appendBattleLog(feat.text);
  saveGame(); renderBuildingView(bldg);
};

// ══════════════════════════════════════════════════════════════
//  🎁 GESCHENK-POKÉMON
// ══════════════════════════════════════════════════════════════
function renderGiftPokemon(feat, bldgId){
  if(feat.condition && !checkFeatureCondition(feat.condition)){
    return "<div class='feat-section'><div class='feat-title'>"+feat.label+"</div>"+
           "<div class='feat-locked'>🔒 "+feat.lockedMsg+"</div></div>";
  }
  var taken=isEventFlagSet(feat.flagId);
  var pd=PKMN[feat.dexId];
  var html="<div class='feat-section'>";
  html+="<div class='feat-title'>"+feat.label+"</div>";
  if(taken){
    html+="<div class='feat-success'>✅ "+(pd?pd.name:"Pokémon")+" wurde erhalten!</div>";
  }else{
    html+="<div class='feat-desc'>"+feat.desc+"</div>";
    if(feat.dexId){
      html+="<div style='text-align:center;margin:10px 0'>"+
        "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+feat.dexId+".png' "+
        "style='width:90px;height:90px;image-rendering:pixelated'>"+
        "<div style='font-weight:700;margin-top:6px'>"+(pd?pd.name:"?")+" Lv."+(feat.level||25)+"</div>"+
      "</div>";
    }
    html+="<button class='feat-btn feat-btn-primary' onclick='claimGiftPokemon(\""+bldgId+"\",\""+feat.id+"\")'>"+
          "🎁 Annehmen</button>";
  }
  html+="</div>";
  return html;
}

window.claimGiftPokemon=function(bldgId, featId){
  var bldg=getZone(bldgId); if(!bldg) return;
  var feat=bldg.features.find(function(f){return f.id===featId;}); if(!feat) return;
  if(isEventFlagSet(feat.flagId)){showToast("Bereits erhalten!");return;}
  var p=createPkmnInstance(feat.dexId,feat.level||25);
  if(!p){showToast("Fehler!"); return;}
  if(feat.nick)p.nick=feat.nick;
  if(!addToParty(p))addToBox(p);
  if(!STATE.caught)STATE.caught={};if(!STATE.seen)STATE.seen={};
  STATE.caught[p.dexId]=true;STATE.seen[p.dexId]=true;
  setEventFlag(feat.flagId);
  var pd=PKMN[feat.dexId];
  showToast("🎁 "+(pd?pd.name:"Pokémon")+" erhalten!",5000);
  if(feat.text) showToast(feat.text,6000);
  saveGame(); renderTeamScreen(); renderPlayerSprites(); renderBuildingView(bldg);
};

// ══════════════════════════════════════════════════════════════
//  CSS für neue Features (inline injiziert)
// ══════════════════════════════════════════════════════════════
(function injectCSS(){
  var style=document.createElement("style");
  style.textContent=`
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
    .cs-badge{font-size:11px;color:#10b981;background:rgba(16,185,129,.15);padding:2px 6px;border-radius:4px;}
    .feat-section{margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.07);}
    .feat-section:last-child{border-bottom:none;}
    .feat-title{font-size:14px;font-weight:700;color:#ddd;margin-bottom:6px;}
    .feat-desc{font-size:12px;color:#888;margin-bottom:8px;}
    .feat-locked{font-size:12px;color:#f87171;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:8px 12px;}
    .feat-success{font-size:13px;color:#10b981;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:8px;padding:8px 12px;}
    .feat-btn{padding:9px 14px;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;margin-top:6px;transition:.15s;width:100%;}
    .feat-btn:hover{opacity:.85;transform:scale(1.02);}
    .feat-btn:disabled{opacity:.4;cursor:not-allowed;}
    .feat-btn-primary{background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;}
    .feat-btn-danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;}
    .battle-seq-preview{margin:6px 0;display:flex;flex-direction:column;gap:4px;}
    .bseq-trainer{display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:rgba(255,255,255,.05);border-radius:6px;font-size:12px;}
    .bseq-boss{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);}
    .bseq-lv{font-size:11px;color:#888;}
    .dojo-choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0;}
    .dojo-choice-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;text-align:center;cursor:pointer;transition:.2s;}
    .dojo-choice-card:hover{background:rgba(99,102,241,.15);border-color:rgba(99,102,241,.4);}
    .dc-name{font-size:13px;font-weight:700;margin:6px 0 3px;}
    .dc-desc{font-size:11px;color:#888;margin-bottom:8px;}
    .feat-reward-preview{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);border-radius:8px;padding:10px;margin:6px 0;}
    .feat-reward-icon{font-size:28px;}
    .rocket_hq-badge{display:inline-block;background:rgba(239,68,68,.2);color:#f87171;border:1px solid rgba(239,68,68,.4);border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;margin-left:6px;}
  `;
  document.head.appendChild(style);
})();
