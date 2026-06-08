// ═══════════════════════════════════════════════════════════════
//  ui.js — Starter, Team, Map, Bag, HUD
// ═══════════════════════════════════════════════════════════════

var ITEM_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/";
var PS_TRAINER = "https://play.pokemonshowdown.com/sprites/trainers/";
var PKM_SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

var BALL_SPRITES = {
  pokeball:   ITEM_BASE + "poke-ball.png",
  superball:  ITEM_BASE + "great-ball.png",
  hyperball:  ITEM_BASE + "ultra-ball.png",
  masterball: ITEM_BASE + "master-ball.png",
};

var ITEM_DEFS = {
  pokeball:    { name:"Pokéball",    desc:"Normaler Pokéball.",           img: ITEM_BASE+"poke-ball.png" },
  superball:   { name:"Superball",   desc:"Bessere Fangchance.",          img: ITEM_BASE+"great-ball.png" },
  hyperball:   { name:"Hyperball",   desc:"Beste Fangchance.",            img: ITEM_BASE+"ultra-ball.png" },
  masterball:  { name:"Meisterball", desc:"Fängt immer.",                 img: ITEM_BASE+"master-ball.png" },
  potion:      { name:"Trank",       desc:"+20 HP.",                      img: ITEM_BASE+"potion.png" },
  superpotion: { name:"Supertrank",  desc:"+50 HP.",                      img: ITEM_BASE+"super-potion.png" },
  hyperpotion: { name:"Hypertrank",  desc:"+200 HP.",                     img: ITEM_BASE+"hyper-potion.png" },
  maxpotion:   { name:"MaxTrank",    desc:"Volle HP.",                    img: ITEM_BASE+"max-potion.png" },
  fullrestore: { name:"Komplett",    desc:"HP + alle Status heilen.",     img: ITEM_BASE+"full-restore.png" },
  antidote:    { name:"Gegengift",   desc:"Heilt Vergiftung.",            img: ITEM_BASE+"antidote.png" },
  awakening:   { name:"Weckflöte",   desc:"Heilt Schlafstatus.",          img: ITEM_BASE+"awakening.png" },
  paralysheal: { name:"Paraheilm.",  desc:"Heilt Lähmung.",               img: ITEM_BASE+"paralyze-heal.png" },
  fullheal:    { name:"Vollheiler",  desc:"Heilt alle Statusprobleme.",   img: ITEM_BASE+"full-heal.png" },
  revive:      { name:"Beleber",     desc:"Belebt K.O.-Pokémon (½ HP).", img: ITEM_BASE+"revive.png" },
  escape:      { name:"Fluchtweg",   desc:"Flieht aus Höhlen.",           img: ITEM_BASE+"escape-rope.png" },
  old_amber:    { name:"Altes Bernstein", desc:"Fossil → Aerodactyl.",   img: ITEM_BASE+"old-amber.png",    isKey:true },
  dome_fossil:  { name:"Kuppelfossil",    desc:"Fossil → Kabuto.",       img: ITEM_BASE+"dome-fossil.png",  isKey:true },
  helix_fossil: { name:"Spiralenfossil",  desc:"Fossil → Amonitas.",     img: ITEM_BASE+"helix-fossil.png", isKey:true },
  hm_cut:      { name:"VM01 Zerschneider", desc:"Schneidet Büsche.",     img: ITEM_BASE+"hm01.png", isHM:true, hmType:"Normal",  lockedBy:"cascade", usageDesc:"Zinnia Arena-Eingang" },
  hm_fly:      { name:"VM02 Fliegen",      desc:"Schnellreise.",         img: ITEM_BASE+"hm02.png", isHM:true, hmType:"Flying",  lockedBy:"thunder", usageDesc:"Schnellreise" },
  hm_surf:     { name:"VM03 Surfer",       desc:"Reist über Wasser.",    img: ITEM_BASE+"hm03.png", isHM:true, hmType:"Water",   lockedBy:"soul",    usageDesc:"Meerrouten" },
  hm_strength: { name:"VM04 Stärke",       desc:"Bewegt Felsbrocken.",   img: ITEM_BASE+"hm04.png", isHM:true, hmType:"Normal",  lockedBy:"soul",    usageDesc:"Siegerstraße" },
  hm_flash:    { name:"VM05 Blitz",        desc:"Senkt Genauigkeit.",    img: ITEM_BASE+"hm05.png", isHM:true, hmType:"Normal",  lockedBy:"stone",   usageDesc:"Rotes Felsgebirge" },
  fahrrad: {
    name:"Fahrrad", desc:"Verdoppelt die Etappengeschwindigkeit auf Routen.",
    img: ITEM_BASE+"bicycle.png", isSpecial:true, activeDesc:"⚡ 2× Etappentempo aktiv",
  },
  ep_teiler: {
    name:"EP-Teiler", desc:"Alle Pokémon in der Party erhalten EP nach jedem Kampf.",
    img: ITEM_BASE+"exp-share.png", isSpecial:true, activeDesc:"⚡ Ganzes Team erhält EP",
  },
};

// ── Trainer-Sprites ────────────────────────────────────────────
var TRAINER_SPRITES = {
  youngster:   PS_TRAINER+"youngster.png",   lass:       PS_TRAINER+"lass.png",
  hiker:       PS_TRAINER+"hiker.png",        biker:      PS_TRAINER+"biker.png",
  swimmer_m:   PS_TRAINER+"swimmer-m.png",    swimmer_f:  PS_TRAINER+"swimmer-f.png",
  rocket_m:    PS_TRAINER+"team-rocket-grunt-m.png", rocket_f: PS_TRAINER+"team-rocket-grunt-f.png",
  ninja:       PS_TRAINER+"ninja-boy.png",    channeler:  PS_TRAINER+"channeler.png",
  supernerd:   PS_TRAINER+"super-nerd.png",   beauty:     PS_TRAINER+"beauty.png",
  poke_fan_f:  PS_TRAINER+"poke-fan-f.png",
  // ── FIX: Gary/Rival benutzt blue.png (nicht rival2.png) ────
  rival:       PS_TRAINER+"blue.png",
  cooltrainer: PS_TRAINER+"cooltrainer-m.png",gentleman:  PS_TRAINER+"gentleman.png",
  brock:    PS_TRAINER+"brock.png",    misty:   PS_TRAINER+"misty.png",
  surge:    PS_TRAINER+"lt-surge.png", erika:   PS_TRAINER+"erika.png",
  koga:     PS_TRAINER+"koga.png",     sabrina: PS_TRAINER+"sabrina.png",
  blaine:   PS_TRAINER+"blaine.png",   giovanni:PS_TRAINER+"giovanni.png",
  agatha:   PS_TRAINER+"agatha.png",   bruno:   PS_TRAINER+"bruno.png",
  lance:    PS_TRAINER+"lance.png",    blue:    PS_TRAINER+"blue.png",
};

function getTrainerSprite(trainer) {
  if (!trainer) return TRAINER_SPRITES.youngster;
  var n = trainer.name || "";
  if (trainer.isRival)              return TRAINER_SPRITES.rival;
  if (n.includes("Team Rocket"))    return Math.random()<0.5?TRAINER_SPRITES.rocket_m:TRAINER_SPRITES.rocket_f;
  if (n.includes("Jungtrainerin"))  return TRAINER_SPRITES.lass;
  if (n.includes("Jungtrainer"))    return TRAINER_SPRITES.youngster;
  if (n.includes("Wanderer"))       return TRAINER_SPRITES.hiker;
  if (n.includes("Geologe")||n.includes("Forscher")) return TRAINER_SPRITES.gentleman;
  if (n.includes("Biker"))          return TRAINER_SPRITES.biker;
  if (n.includes("Schwimmerin"))    return TRAINER_SPRITES.swimmer_f;
  if (n.includes("Schwimmer")||n.includes("Taucher")) return TRAINER_SPRITES.swimmer_m;
  if (n.includes("Soldat")||n.includes("Arenakämpfer")||n.includes("Elite")) return TRAINER_SPRITES.cooltrainer;
  if (n.includes("Ninja"))          return TRAINER_SPRITES.ninja;
  if (n.includes("Channelerin"))    return TRAINER_SPRITES.channeler;
  if (n.includes("Supernerd"))      return TRAINER_SPRITES.supernerd;
  if (n.includes("Schönheit"))      return TRAINER_SPRITES.beauty;
  if (n.includes("Pokémon-Fan"))    return TRAINER_SPRITES.poke_fan_f;
  if (n.includes("Jugendliche"))    return TRAINER_SPRITES.lass;
  if (n.includes("Jugendlicher"))   return TRAINER_SPRITES.youngster;
  return TRAINER_SPRITES.youngster;
}
function getGymLeaderSprite(name) {
  var map={"Rocco":"brock","Misty":"misty","Mysto":"surge","Erika":"erika","Koga":"koga","Sabrina":"sabrina","Brand":"blaine","Giovanni":"giovanni","Blau":"blue","Agathe":"agatha","Bruno":"bruno","Siegfried":"lance"};
  return TRAINER_SPRITES[map[name]] || TRAINER_SPRITES.cooltrainer;
}

// ─── Sprite-URLs ───────────────────────────────────────────────
function pkmnSpriteUrl(dexId, isShiny) {
  return PKM_SPRITES + (isShiny ? "shiny/" : "") + dexId + ".png";
}

// ══════════════════════════════════════════════════════════════
//  STARTER
// ══════════════════════════════════════════════════════════════
function showStarterScreen() {
  var starters=[{dexId:1,name:"Bisasam",typ:"Pflanze/Gift",color:"#78C850",emoji:"🌱"},{dexId:4,name:"Glumanda",typ:"Feuer",color:"#F08030",emoji:"🔥"},{dexId:7,name:"Schiggy",typ:"Wasser",color:"#6890F0",emoji:"💧"}];
  var grid=document.getElementById("starterGrid"); if(!grid) return;
  grid.innerHTML="";
  starters.forEach(function(s){
    var card=document.createElement("div"); card.className="starter-card"; card.style.borderColor=s.color;
    card.innerHTML="<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+s.dexId+".png' alt='"+s.name+"'><div class='starter-name'>"+s.name+"</div><div class='starter-type' style='background:"+s.color+"'>"+s.emoji+" "+s.typ+"</div>";
    card.onclick=function(){
      var ni=document.getElementById("trainerName"),name=ni?ni.value.trim():"",msg=document.getElementById("starterNameMsg");
      if(!name){if(ni){ni.focus();ni.style.borderColor="#ef4444";}if(msg)msg.textContent="⚠️ Bitte zuerst deinen Trainer-Namen eingeben!";return;}
      if(ni)ni.style.borderColor="";if(msg)msg.textContent="";onStarterChosen(name,s.dexId);
    };
    grid.appendChild(card);
  });
  var ni=document.getElementById("trainerName");
  if(ni) ni.oninput=function(){if(ni.value.trim()){ni.style.borderColor="";var msg=document.getElementById("starterNameMsg");if(msg)msg.textContent="";}};
}

// ── World-Tab ──────────────────────────────────────────────────
function renderWorldTab() {
  var container=document.getElementById("viewWorld"); if(!container||!STATE) return;
  var zone=getZone(STATE.currentZoneId); if(!zone) return;
  if(zone.type==="city"&&_inCity) return;
  var icon={route:"🌿",dungeon:"🕳️",city:"🏙️",gym:"⚔️",sea:"🌊"}[zone.type]||"📍";
  var html="<div class='zone-info-panel'><div class='zone-info-header'>"+icon+" <b>"+zone.name+"</b></div>";
  if(zone.wildPokemon&&zone.wildPokemon.length>0){
    var total=zone.wildPokemon.reduce(function(s,e){return s+e.weight;},0);
    html+="<div class='encounter-section'><div class='encounter-title'>🎲 Wilde Pokémon</div>";
    zone.wildPokemon.slice().sort(function(a,b){return b.weight-a.weight;}).forEach(function(entry){
      var pd=PKMN[entry.dexId],pct=Math.round(entry.weight/total*100);
      html+="<div class='encounter-row'><img src='"+PKM_SPRITES+entry.dexId+".png' class='enc-sprite' onerror='this.style.opacity=0'><div class='enc-info'><span class='enc-name'>"+(pd?pd.name:"?")+"</span> <span class='enc-lv'>Lv."+entry.minLv+"–"+entry.maxLv+"</span></div><div class='enc-right'><div class='enc-bar-wrap'><div class='enc-bar' style='width:"+Math.min(100,pct*2)+"%'></div></div><span class='enc-pct'>"+pct+"%</span></div></div>";
    });
    html+="</div>";
  }
  if(zone.trainers&&zone.trainers.length>0){
    html+="<div class='trainer-section'><div class='encounter-title'>⚔️ Trainer</div>";
    zone.trainers.forEach(function(t){var defeated=isTrainerDefeated(zone.id,t.stage),spr=getTrainerSprite(t);html+="<div class='trainer-row "+(defeated?"trainer-defeated":"")+"'><img src='"+spr+"' class='trainer-mini-sprite' onerror='this.style.display=\"none\"'><div class='trainer-row-info'><b>"+(t.isRival?"⚡ Rival: ":"")+t.name+"</b><span class='trainer-stage'> (Etappe "+t.stage+")</span></div><span class='trainer-status'>"+(defeated?"✓":"⚔️")+"</span></div>";});
    html+="</div>";
  }
  if(zone.gymLeader){var gl=zone.gymLeader,defeated=isTrainerDefeated(zone.id,gl.stage),glSpr=getGymLeaderSprite(gl.name);html+="<div class='trainer-section'><div class='encounter-title'>🏅 Arenaleiter</div><div class='trainer-row gym-leader-row "+(defeated?"trainer-defeated":"")+"'><img src='"+glSpr+"' class='trainer-mini-sprite'><div class='trainer-row-info'><b>"+gl.name+"</b><br><small>"+gl.badge+"</small></div><span class='trainer-status'>"+(defeated?"🏅":"⚔️")+"</span></div></div>";}
  html+="</div>"; container.innerHTML=html;
}
function renderCityView(zone){var container=document.getElementById("viewWorld");if(!container)return;container.innerHTML="<div class='city-view'><div class='city-header'><div class='city-title'>🏙️ "+zone.name+"</div></div></div>";if(typeof renderCityHub==="function")renderCityHub(zone);}
function healInCity(){healPartyFully();renderPlayerSprites();updateHUD();showToast("Team vollständig geheilt! 💚");}

// ══════════════════════════════════════════════════════════════
//  TEAM-SCREEN
// ══════════════════════════════════════════════════════════════
function renderTeamScreen() {
  var container=document.getElementById("teamList"); if(!container||!STATE) return;
  container.innerHTML="";
  var n=STATE.party.length;
  var inCity=!!_inCity;

  STATE.party.forEach(function(p,idx){
    var pd=PKMN[p.dexId], name=pd?pd.name:"?";
    var isShiny=!!p.shiny;
    var hpPct=Math.max(0,Math.round(p.currentHP/p.maxHP*100));
    var xpPct=Math.min(100,Math.round(p.xp/p.xpToNext*100));
    var readyEvo=!!p.readyToEvolve, evoPd=readyEvo?PKMN[p.readyToEvolve]:null;
    var card=document.createElement("div");
    card.className="team-card"+(p.currentHP<=0?" team-fainted":"")+(readyEvo?" team-evo-ready":"")+(isShiny?" team-card-shiny":"");
    card.innerHTML=
      "<img class='team-sprite"+(isShiny?" team-sprite-shiny":"")+"' src='"+pkmnSpriteUrl(p.dexId,isShiny)+"' onerror='this.src=\""+pkmnSpriteUrl(p.dexId,false)+"\"' alt='"+name+"'>"+
      "<div class='team-info'>"+
        "<div class='team-nameline'><b>"+(p.nick||name)+"</b> <span class='team-lv'>Lv."+p.level+"</span>"+
          (isShiny?"<span class='team-shiny-badge'>✨ Shiny</span>":"")+
          (p.status?"<span class='status-badge status-"+p.status+"'>"+statusText(p.status)+"</span>":"")+
          (idx===0?"<span class='team-lead-badge'>★ Lead</span>":"")+
          (readyEvo?"<span class='team-evo-badge'>✨ Entwicklung!</span>":"")+
        "</div>"+
        "<div class='team-types'>"+(pd?pd.types.map(function(t){return "<span class='type-badge' style='background:"+(TYPE_COLORS[t]||"#aaa")+"'>"+(typeof typeName==="function"?typeName(t):t)+"</span>";}).join(""):"")+"</div>"+
        "<div class='team-hprow'><div class='team-hpbar'><div class='team-hpfill' style='width:"+hpPct+"%;background:"+hpColor(p.currentHP,p.maxHP)+"'></div></div> <span class='team-hptxt'>"+p.currentHP+"/"+p.maxHP+"</span></div>"+
        "<div class='team-xprow'><div class='team-xpbar'><div class='team-xpfill' style='width:"+xpPct+"%'></div></div> <span class='team-xptxt'>EP "+p.xp+"/"+p.xpToNext+"</span></div>"+
        "<div class='team-moves'>"+p.moves.map(function(m){var mv=MOVES[m];return mv?"<span class='mini-move' style='border-color:"+(TYPE_COLORS[mv.type]||"#888")+"'>"+mv.name+"</span>":"";}).join("")+"</div>"+
        (readyEvo?"<button class='team-evo-btn' onclick='triggerEvolution("+idx+")'><img src='"+PKM_SPRITES+(p.readyToEvolve||0)+".png' class='team-evo-preview'>✨ Zu "+(evoPd?evoPd.name:"?")+" entwickeln!</button>":"")+
      "</div>"+
      "<div class='team-actions'>"+
        "<button class='team-act-sm' "+(idx===0?"disabled":"")+" onclick='movePartyUp("+idx+")' title='Nach oben'>↑</button>"+
        "<button class='team-act-sm' "+(idx===n-1?"disabled":"")+" onclick='movePartyDown("+idx+")' title='Nach unten'>↓</button>"+
        "<button class='team-act-sm' "+(idx===0?"disabled":"")+" onclick='setLeadPkmn("+idx+")' title='Als Lead'>★</button>"+
        "<button class='team-act-sm"+(inCity?"":" team-act-disabled")+"' "+(inCity?"onclick='sendToBox("+idx+")' title='In Box'":"title='Nur in Städten' disabled")+">📦</button>"+
      "</div>";
    container.appendChild(card);
  });

  var boxSection=document.getElementById("boxPreview");
  if(boxSection){
    if(STATE.box.length===0){
      boxSection.innerHTML="<p style='color:#888;text-align:center;padding:12px'>Box ist leer</p>";
    }else{
      boxSection.innerHTML=STATE.box.map(function(p,i){
        var pd=PKMN[p.dexId],isShiny=!!p.shiny,sprUrl=pkmnSpriteUrl(p.dexId,isShiny);
        var clickAttr=inCity?"onclick='recallFromBox("+i+")'":" onclick='showToast(\"Nur in Städten möglich!\")' style='cursor:not-allowed'";
        return "<div class='box-mini"+(isShiny?" box-mini-shiny":"")+"' "+clickAttr+">"+
          (isShiny?"<div class='box-shiny-star'>✨</div>":"")+
          "<img src='"+sprUrl+"' onerror='this.src=\""+pkmnSpriteUrl(p.dexId,false)+"\"'>"+
          "<div class='box-mini-label'>"+(pd?pd.name:"?")+" Lv."+p.level+(p.readyToEvolve?" 🔄":"")+(p.shiny?" ✨":"")+"</div>"+
          (!inCity?"<div class='box-mini-lock'>🔒</div>":"")+
        "</div>";
      }).join("");
    }
  }
  if(!inCity){
    var hint=document.createElement("div");
    hint.style.cssText="font-size:11px;color:#556070;text-align:center;padding:8px 0 4px;border-top:1px solid rgba(255,255,255,.06);margin-top:8px";
    hint.textContent="🔒 Box-Wechsel nur in Pokécentern (Städten) möglich";
    container.appendChild(hint);
  }
}

(function injectTeamCss(){
  if(document.getElementById("team-shiny-style"))return;
  var s=document.createElement("style");s.id="team-shiny-style";
  s.textContent=`
    .team-card-shiny{border-color:rgba(245,197,24,.45)!important;background:linear-gradient(135deg,var(--bg-surface) 70%,rgba(245,197,24,.06))!important;}
    .team-sprite-shiny{filter:drop-shadow(0 0 5px rgba(245,197,24,.55));}
    .team-shiny-badge{font-size:10px;font-weight:700;color:#f5c518;background:rgba(245,197,24,.15);border:1px solid rgba(245,197,24,.35);border-radius:4px;padding:1px 5px;margin-left:2px;}
    .box-mini{position:relative;}
    .box-mini-shiny{border-color:rgba(245,197,24,.5)!important;background:rgba(245,197,24,.07)!important;}
    .box-shiny-star{position:absolute;top:2px;right:3px;font-size:9px;line-height:1;pointer-events:none;}
    .box-mini-label{font-size:9px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:64px;text-align:center;}
    .box-mini-lock{position:absolute;top:2px;left:3px;font-size:9px;opacity:.5;}
    .team-act-disabled{opacity:.25!important;cursor:not-allowed!important;}
  `;
  document.head.appendChild(s);
})();

// ── Party-Operationen ──────────────────────────────────────────
function setLeadPkmn(idx){if(!STATE||idx===0)return;STATE.party.unshift(STATE.party.splice(idx,1)[0]);renderTeamScreen();renderPlayerSprites();saveGame();}
function movePartyUp(idx){if(!STATE||idx<=0)return;var t=STATE.party[idx];STATE.party[idx]=STATE.party[idx-1];STATE.party[idx-1]=t;if(idx===1)renderPlayerSprites();renderTeamScreen();saveGame();}
function movePartyDown(idx){if(!STATE||idx>=STATE.party.length-1)return;var t=STATE.party[idx];STATE.party[idx]=STATE.party[idx+1];STATE.party[idx+1]=t;if(idx===0)renderPlayerSprites();renderTeamScreen();saveGame();}

function sendToBox(idx){
  if(!_inCity){showToast("📦 Box-Wechsel nur in Städten möglich!");return;}
  if(!STATE||STATE.party.length<=1){showToast("Mindestens 1 Pokémon in der Party!");return;}
  var p=STATE.party.splice(idx,1)[0];addToBox(p);
  if(idx===0)renderPlayerSprites();renderTeamScreen();saveGame();
  showToast((PKMN[p.dexId]?PKMN[p.dexId].name:"?")+(p.shiny?" ✨":"")+" → Box");
}
function recallFromBox(idx){
  if(!_inCity){showToast("📦 Box-Wechsel nur in Städten möglich!");return;}
  if(!STATE||STATE.party.length>=6){showToast("Party ist voll! (max. 6)");return;}
  var p=STATE.box.splice(idx,1)[0];STATE.party.push(p);renderTeamScreen();saveGame();
  showToast((PKMN[p.dexId]?PKMN[p.dexId].name:"?")+(p.shiny?" ✨":"")+" → Party");
}

// ══════════════════════════════════════════════════════════════
//  BAG
// ══════════════════════════════════════════════════════════════
function renderBagScreen(){
  var container=document.getElementById("bagList");if(!container||!STATE)return;container.innerHTML="";
  var specKeys=Object.keys(ITEM_DEFS).filter(function(k){return ITEM_DEFS[k].isSpecial&&(STATE.items[k]||0)>0;});
  if(specKeys.length>0){_bagHeader(container,"⭐ Spezial-Items");specKeys.forEach(function(key){var def=ITEM_DEFS[key];var row=document.createElement("div");row.className="bag-item bag-special-item";row.innerHTML="<div class='bag-icon-wrap'><img src='"+(def.img||"")+"' class='bag-item-sprite' onerror='this.style.display=\"none\"'></div><div class='bag-info'><b>"+def.name+"</b><br><small>"+def.desc+"</small><br><small class='bag-special-active'>"+def.activeDesc+"</small></div><div class='bag-special-badge'>✅ Aktiv</div>";container.appendChild(row);});}
  var hmKeys=Object.keys(ITEM_DEFS).filter(function(k){return ITEM_DEFS[k].isHM&&(STATE.items[k]||0)>0;});
  if(hmKeys.length>0){_bagHeader(container,"📀 VM-Beutel");hmKeys.forEach(function(key){var def=ITEM_DEFS[key];var badgeOk=!def.lockedBy||(STATE.badgeIds&&STATE.badgeIds.indexOf(def.lockedBy)>=0);var typeColor=(typeof TYPE_COLORS!=="undefined"&&TYPE_COLORS[def.hmType])?TYPE_COLORS[def.hmType]:"#818cf8";var row=document.createElement("div");row.className="bag-item bag-hm-item";row.innerHTML="<div class='bag-hm-num'>"+key.replace("hm_","VM").toUpperCase()+"</div><div class='bag-hm-type' style='background:"+typeColor+"'>"+def.hmType+"</div><div class='bag-info'><b>"+def.name+"</b><br><small>"+def.desc+"</small><br><small class='bag-hm-usage'>🗺️ "+def.usageDesc+"</small></div><div class='bag-hm-status"+(badgeOk?"":" bag-hm-locked")+"'>"+(badgeOk?"✅ Aktiv":"🔒 Abzeichen fehlt")+"</div>";container.appendChild(row);});}
  var keyKeys=Object.keys(ITEM_DEFS).filter(function(k){return ITEM_DEFS[k].isKey&&!ITEM_DEFS[k].isHM&&(STATE.items[k]||0)>0;});
  if(keyKeys.length>0){_bagHeader(container,"🗝️ Schlüsselitems");keyKeys.forEach(function(key){var def=ITEM_DEFS[key],count=STATE.items[key]||0;var row=document.createElement("div");row.className="bag-item";row.innerHTML="<div class='bag-icon-wrap'><img src='"+(def.img||"")+"' class='bag-item-sprite' onerror='this.style.display=\"none\"'></div><div class='bag-info'><b>"+def.name+"</b><br><small>"+def.desc+"</small></div><span class='bag-count'>x"+count+"</span><span style='font-size:10px;color:#556070;padding:4px'>Schlüssel</span>";container.appendChild(row);});}
  var useKeys=Object.keys(ITEM_DEFS).filter(function(k){return !ITEM_DEFS[k].isHM&&!ITEM_DEFS[k].isKey&&!ITEM_DEFS[k].isSpecial&&(STATE.items[k]||0)>0;});
  if(useKeys.length>0){_bagHeader(container,"💊 Items");useKeys.forEach(function(key){var count=STATE.items[key]||0,def=ITEM_DEFS[key];var row=document.createElement("div");row.className="bag-item";row.innerHTML="<div class='bag-icon-wrap'><img src='"+(def.img||"")+"' class='bag-item-sprite' onerror='this.style.display=\"none\"'></div><div class='bag-info'><b>"+def.name+"</b><br><small>"+def.desc+"</small></div><span class='bag-count'>x"+count+"</span><button onclick='useItem(\""+key+"\")'>Nutzen</button>";container.appendChild(row);});}
  if(specKeys.length===0&&hmKeys.length===0&&keyKeys.length===0&&useKeys.length===0)container.innerHTML="<p style='color:#888;text-align:center;padding:20px'>Tasche leer</p>";
}
function _bagHeader(container,label){var h=document.createElement("div");h.className="bag-section-header";h.innerHTML=label;container.appendChild(h);}
function useItem(itemKey){
  if(!STATE||!STATE.items[itemKey]||STATE.items[itemKey]<=0){showToast("Keine mehr!");return;}
  var player=getActivePkmn();if(!player){showToast("Kein aktives Pokémon!");return;}
  var pd=PKMN[player.dexId],name=pd?pd.name:"Pokémon";
  switch(itemKey){
    case "potion":      if(player.currentHP>=player.maxHP){showToast("HP voll!");return;}player.currentHP=Math.min(player.maxHP,player.currentHP+20);break;
    case "superpotion": if(player.currentHP>=player.maxHP){showToast("HP voll!");return;}player.currentHP=Math.min(player.maxHP,player.currentHP+50);break;
    case "hyperpotion": if(player.currentHP>=player.maxHP){showToast("HP voll!");return;}player.currentHP=Math.min(player.maxHP,player.currentHP+200);break;
    case "maxpotion":   if(player.currentHP>=player.maxHP){showToast("HP voll!");return;}player.currentHP=player.maxHP;break;
    case "fullrestore": player.currentHP=player.maxHP;player.status=null;player.statusTurns=0;player.moves.forEach(function(m){if(player.pp)player.pp[m]=ppMax(m);});break;
    case "fullheal":    player.status=null;player.statusTurns=0;break;
    case "antidote":    if(player.status!=="poison"){showToast("Nicht vergiftet!");return;}player.status=null;break;
    case "awakening":   if(player.status!=="sleep"){showToast("Schläft nicht!");return;}player.status=null;player.statusTurns=0;break;
    case "paralysheal": if(player.status!=="paralysis"){showToast("Nicht gelähmt!");return;}player.status=null;break;
    case "revive":{var fainted=STATE.party.find(function(p){return p.currentHP<=0;});if(!fainted){showToast("Kein K.O. Pokémon!");return;}fainted.currentHP=Math.floor(fainted.maxHP/2);fainted._faintAnnounced=false;showToast((PKMN[fainted.dexId]?PKMN[fainted.dexId].name:"?")+" belebt!");STATE.items[itemKey]--;renderBagScreen();renderTeamScreen();saveGame();return;}
    default:showToast("Kann hier nicht benutzt werden.");return;
  }
  STATE.items[itemKey]--;showToast(name+": "+(ITEM_DEFS[itemKey]?ITEM_DEFS[itemKey].name:itemKey)+" benutzt!");renderBagScreen();renderTeamScreen();updatePlayerHp();saveGame();
}

function renderCatchBalls(visible){
  var container=document.getElementById("catchBalls");if(!container)return;container.innerHTML="";
  if(!visible||!STATE)return;
  ["pokeball","superball","hyperball","masterball"].forEach(function(type){
    var count=STATE.items[type]||0;if(count<=0)return;
    var btn=document.createElement("button");btn.className="ball-btn";
    btn.title=(ITEM_DEFS[type]?ITEM_DEFS[type].name:type)+" (x"+count+")";
    btn.innerHTML="<img src='"+(BALL_SPRITES[type]||"")+"' width='24' height='24' onerror='this.replaceWith(document.createTextNode(\"⚪\"))'><span class='ball-count'>x"+count+"</span>";
    btn.onclick=function(){onCatchClick(type);};container.appendChild(btn);
  });
}

// ── Karten-Screen (Platzhalter — wird von patch.js überschrieben) ──
function renderMapScreen(){
  var container=document.getElementById("mapList");if(!container||!STATE)return;
  container.innerHTML="<p style='color:#888;padding:16px'>Lade Karte...</p>";
}

// ── HUD ────────────────────────────────────────────────────────
function updateHUD(){if(!STATE)return;var m=document.getElementById("hudMoney");if(m)m.textContent=STATE.money+" ₽";var b=document.getElementById("hudBadges");if(b)b.textContent=STATE.badges+"/8 🏅";var p=document.getElementById("hudPlayer");if(p)p.textContent=STATE.name;}
function showCityShop(zone){if(!zone||!zone.shopItems)return;var popup=document.getElementById("shopPopup");if(popup)popup.style.display="flex";var list=document.getElementById("shopItemList");if(!list)return;list.innerHTML="";zone.shopItems.forEach(function(item){var canAfford=STATE.money>=item.cost,def=ITEM_DEFS[item.id];var row=document.createElement("div");row.className="shop-row";row.innerHTML=(def&&def.img?"<img src='"+def.img+"' width='28' height='28' style='image-rendering:pixelated;margin-right:8px' onerror='this.style.display=\"none\"'>":"")+"<div class='shop-info'><b>"+item.name+"</b> – "+item.desc+"</div><div class='shop-price'>"+item.cost+" ₽</div><button "+(canAfford?"":"disabled")+" onclick='buyItem(\""+item.id+"\","+item.cost+")'>Kaufen</button>";list.appendChild(row);});}
function closeShop(){var p=document.getElementById("shopPopup");if(p)p.style.display="none";}
function buyItem(itemId,cost){if(!STATE||STATE.money<cost){showToast("Kein Geld!");return;}var def=ITEM_DEFS[itemId];if(def&&def.isSpecial&&(STATE.items[itemId]||0)>0){showToast((def.name||itemId)+" besitzt du bereits!");return;}STATE.money-=cost;STATE.items[itemId]=(STATE.items[itemId]||0)+1;updateHUD();var zone=getZone(STATE.currentZoneId);if(zone)showCityShop(zone);if(itemId==="fahrrad"&&typeof startStageLoop==="function"&&!_waitingForInput&&!_inCity)startStageLoop();saveGame();showToast((def?def.name:itemId)+" erhalten!"+(def&&def.activeDesc?" "+def.activeDesc:""));}
function closeGymPopup(){var p=document.getElementById("gymPopup");if(p)p.style.display="none";}
function showOfflineReward(awaySeconds){if(awaySeconds<60)return;var modal=document.getElementById("offlineModal"),msg=document.getElementById("offlineMsg");if(!modal||!msg)return;var h=Math.floor(awaySeconds/3600),m2=Math.floor((awaySeconds%3600)/60);msg.textContent="Du warst "+(h>0?h+"h ":"")+m2+"m weg!";modal.style.display="flex";}
function closeOfflineModal(){var m=document.getElementById("offlineModal");if(m)m.style.display="none";}
